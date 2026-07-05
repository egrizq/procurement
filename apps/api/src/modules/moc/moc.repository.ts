import db from "../../config/drizzle";
import {
	mocs,
	mocVendors,
	mocSawWeightRequests,
	vesselRequests,
	vesselRequestItems,
	mstItems,
	mstVessels,
} from "../../db/schema/index.ts";
import { desc, eq, like, sql, and, or, inArray } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────
// SAW (Simple Additive Weighting) Algorithm
// Weights: Price 40% (cost), Qty 25%, Warranty 20%, Discount 15%
// ─────────────────────────────────────────────────────────────
const SAW_WEIGHTS = {
	unitPrice: 0.4, // cost  → lower is better
	availableQty: 0.25, // benefit → higher is better
	warranty: 0.2, // benefit → higher is better
	discount: 0.15, // benefit → higher is better
};

function calculateSAW(vendors: any[], weights: typeof SAW_WEIGHTS = SAW_WEIGHTS): any[] {
	if (!vendors || vendors.length === 0) return vendors;

	const minPrice = Math.min(...vendors.map((v) => v.unitPrice || 1));
	const maxQty = Math.max(...vendors.map((v) => v.availableQty || 0));
	const maxWar = Math.max(...vendors.map((v) => v.warranty || 0));
	const maxDis = Math.max(...vendors.map((v) => v.discount || 0));

	const scored = vendors.map((v) => {
		const rPrice = minPrice / (v.unitPrice || 1);
		const rQty = maxQty > 0 ? (v.availableQty || 0) / maxQty : 0;
		const rWar = maxWar > 0 ? (v.warranty || 0) / maxWar : 0;
		const rDis = maxDis > 0 ? (v.discount || 0) / maxDis : 0;

		const score =
			weights.unitPrice * rPrice +
			weights.availableQty * rQty +
			weights.warranty * rWar +
			weights.discount * rDis;

		return { ...v, sawScore: parseFloat(score.toFixed(4)) };
	});

	const maxScore = Math.max(...scored.map((v) => v.sawScore));
	return scored.map((v) => ({
		...v,
		isSelected: v.sawScore === maxScore,
	}));
}

/**
 * Returns full SAW breakdown detail: normalized, weighted, ranked.
 * Used for the scoring analysis UI display.
 */
function calculateSAWWithBreakdown(
	vendors: any[],
	weights: typeof SAW_WEIGHTS = SAW_WEIGHTS,
) {
	if (!vendors || vendors.length === 0) return { vendors: [], weights };

	const minPrice = Math.min(...vendors.map((v) => v.unitPrice || 1));
	const maxQty = Math.max(...vendors.map((v) => v.availableQty || 0));
	const maxWar = Math.max(...vendors.map((v) => v.warranty || 0));
	const maxDis = Math.max(...vendors.map((v) => v.discount || 0));

	const scored = vendors.map((v) => {
		const rPrice = parseFloat((minPrice / (v.unitPrice || 1)).toFixed(4));
		const rQty =
			maxQty > 0 ? parseFloat(((v.availableQty || 0) / maxQty).toFixed(4)) : 0;
		const rWar =
			maxWar > 0 ? parseFloat(((v.warranty || 0) / maxWar).toFixed(4)) : 0;
		const rDis =
			maxDis > 0 ? parseFloat(((v.discount || 0) / maxDis).toFixed(4)) : 0;

		const wPrice = parseFloat((weights.unitPrice * rPrice).toFixed(4));
		const wQty = parseFloat((weights.availableQty * rQty).toFixed(4));
		const wWar = parseFloat((weights.warranty * rWar).toFixed(4));
		const wDis = parseFloat((weights.discount * rDis).toFixed(4));

		const sawScore = parseFloat((wPrice + wQty + wWar + wDis).toFixed(4));

		return {
			...v,
			normalized: { rPrice, rQty, rWar, rDis },
			weighted: { wPrice, wQty, wWar, wDis },
			sawScore,
		};
	});

	const sorted = [...scored].sort((a, b) => b.sawScore - a.sawScore);
	const maxScore = sorted[0]?.sawScore ?? 0;

	const ranked = scored.map((v) => ({
		...v,
		rank: sorted.findIndex((s) => s.id === v.id) + 1,
		isSelected: v.sawScore === maxScore,
	}));

	return {
		vendors: ranked,
		weights,
		minPrice,
		maxQty,
		maxWar,
		maxDis,
	};
}

/**
 * Resolves the SAW weights to use for a given MOC: the manager-approved
 * custom weight set if one is active, otherwise the module default.
 */
async function getActiveWeightsForMoc(mocId: number): Promise<typeof SAW_WEIGHTS> {
	const moc = await db.query.mocs.findFirst({
		where: eq(mocs.id, mocId),
		columns: { activeSawWeightRequestId: true },
	});
	if (!moc?.activeSawWeightRequestId) return SAW_WEIGHTS;

	const activeRequest = await db.query.mocSawWeightRequests.findFirst({
		where: and(
			eq(mocSawWeightRequests.id, moc.activeSawWeightRequestId),
			eq(mocSawWeightRequests.status, "Approved"),
		),
		columns: {
			unitPriceWeight: true,
			availableQtyWeight: true,
			warrantyWeight: true,
			discountWeight: true,
		},
	});
	if (!activeRequest) return SAW_WEIGHTS;

	return {
		unitPrice: Number(activeRequest.unitPriceWeight),
		availableQty: Number(activeRequest.availableQtyWeight),
		warranty: Number(activeRequest.warrantyWeight),
		discount: Number(activeRequest.discountWeight),
	};
}

class MocRepository {
	async createMoc(data: any, createdBy: number) {
		let mocId: number;

		await db.transaction(async (tx) => {
			const [inserted] = await tx.insert(mocs).values({
				vesselRequestId: data.vesselRequestId,
				vesselRequestItemId: data.vesselRequestItemId,
				status: data.status || "Draft",
				createdBy: createdBy,
			});

			mocId = inserted.insertId;

			if (data.vendors && data.vendors.length > 0) {
				const isCompleted = data.status === "Completed";
				const vendorsToInsert = isCompleted
					? calculateSAW(data.vendors)
					: data.vendors;

				const vendorValues = vendorsToInsert.map((v: any) => ({
					mocId: mocId,
					vendorId: v.vendorId,
					unitPrice: v.unitPrice,
					availableQty: v.availableQty ?? 0,
					warranty: v.warranty ?? 0,
					discount: v.discount ?? 0,
					sawScore: v.sawScore ?? null,
					remarks: v.remarks || null,
					isSelected: v.isSelected || false,
				}));
				await tx.insert(mocVendors).values(vendorValues);
			}
		});

		// Query AFTER transaction commits so data is visible
		return await this.getMocById(mocId!);
	}

	async getMocById(id: number) {
		const result = await db.query.mocs.findFirst({
			where: eq(mocs.id, id),
			with: {
				user: { columns: { id: true, fullName: true } },
				vesselRequest: {
					with: { vessel: { columns: { id: true, name: true } } },
				},
				vesselRequestItem: {
					with: { item: { columns: { id: true, name: true } } },
				},
				mocVendors: {
					with: { vendor: { columns: { id: true, name: true } } },
				},
				selectedVendor: { columns: { id: true, name: true } },
				purchaseOrders: { columns: { id: true, poNumber: true, status: true } },
				sawWeightRequests: {
					orderBy: [desc(mocSawWeightRequests.createdAt)],
					limit: 5,
				},
				activeSawWeightRequest: true,
			},
		});

		return result || null;
	}

	async getMocs(
		page: number = 1,
		limit: number = 10,
		search: string = "",
		status?: string,
	) {
		const searchPattern = `%${search}%`;

		let matchingMocIds: number[] | null = null;
		if (search) {
			const results = await db
				.select({ id: mocs.id })
				.from(mocs)
				.innerJoin(vesselRequests, eq(mocs.vesselRequestId, vesselRequests.id))
				.innerJoin(
					vesselRequestItems,
					eq(mocs.vesselRequestItemId, vesselRequestItems.id),
				)
				.innerJoin(mstItems, eq(vesselRequestItems.itemId, mstItems.id))
				.innerJoin(mstVessels, eq(vesselRequests.vesselId, mstVessels.id))
				.where(
					or(
						like(vesselRequests.requestCode, searchPattern),
						like(mstItems.name, searchPattern),
						like(mstVessels.name, searchPattern),
					),
				);
			matchingMocIds = results.map((r) => r.id);
			if (matchingMocIds.length === 0) return { items: [], total: 0 };
		}

		const conditions = [];
		if (matchingMocIds !== null)
			conditions.push(inArray(mocs.id, matchingMocIds));
		if (status) conditions.push(eq(mocs.status, status as any));

		const condition =
			conditions.length > 0
				? conditions.length === 1
					? conditions[0]
					: and(...conditions)
				: undefined;

		const itemsQuery = db.query.mocs.findMany({
			where: condition,
			with: {
				user: { columns: { id: true, fullName: true } },
				vesselRequest: {
					with: { vessel: { columns: { id: true, name: true } } },
				},
				vesselRequestItem: {
					with: { item: { columns: { id: true, name: true } } },
				},
				mocVendors: {
					with: { vendor: { columns: { id: true, name: true } } },
				},
			},
			offset: (page - 1) * limit,
			limit,
			orderBy: [desc(mocs.createdAt)],
		});

		const countQuery = db
			.select({ count: sql<number>`count(*)` })
			.from(mocs)
			.where(condition)
			.then((res) => Number(res[0]?.count || 0));

		const [items, total] = await Promise.all([itemsQuery, countQuery]);
		return { items, total };
	}

	async updateMoc(id: number, data: any) {
		await db.transaction(async (tx) => {
			await tx
				.update(mocs)
				.set({
					status: data.status || "Draft",
					selectedVendorId: data.selectedVendorId ?? null,
					updatedAt: new Date(),
				})
				.where(eq(mocs.id, id));

			await tx.delete(mocVendors).where(eq(mocVendors.mocId, id));

			if (data.vendors && data.vendors.length > 0) {
				const isCompleted = data.status === "Completed";
				const vendorsToInsert = isCompleted
					? calculateSAW(data.vendors)
					: data.vendors;

				const vendorValues = vendorsToInsert.map((v: any) => ({
					mocId: id,
					vendorId: v.vendorId,
					unitPrice: v.unitPrice,
					availableQty: v.availableQty ?? 0,
					warranty: v.warranty ?? 0,
					discount: v.discount ?? 0,
					sawScore: v.sawScore ?? null,
					remarks: v.remarks || null,
					isSelected: v.isSelected || false,
				}));
				await tx.insert(mocVendors).values(vendorValues);
			}
		});

		// Query AFTER transaction commits so data is visible
		return await this.getMocById(id);
	}

	async deleteMoc(id: number) {
		await db.delete(mocs).where(eq(mocs.id, id));
	}

	/**
	 * Run SAW scoring on an existing MOC's vendors.
	 * Persists sawScore + isSelected per vendor and returns
	 * the updated MOC alongside the full breakdown for UI display.
	 */
	async scoreMoc(id: number) {
		const moc = await this.getMocById(id);
		if (!moc) throw new Error("MOC not found");

		const vendors = moc.mocVendors ?? [];
		if (vendors.length < 2) {
			throw new Error("At least 2 vendors are required to run SAW scoring");
		}

		const weights = await getActiveWeightsForMoc(id);
		const breakdown = calculateSAWWithBreakdown(vendors, weights);

		await db.transaction(async (tx) => {
			for (const v of breakdown.vendors) {
				await tx
					.update(mocVendors)
					.set({ sawScore: String(v.sawScore), isSelected: v.isSelected })
					.where(eq(mocVendors.id, v.id));
			}
		});

		const updatedMoc = await this.getMocById(id);
		return { moc: updatedMoc, breakdown };
	}

	/**
	 * Staff submits a proposed custom SAW weight set for a Draft MOC,
	 * to be reviewed by a Manager.
	 */
	async submitSawWeightRequest(
		mocId: number,
		userId: number,
		weights: {
			unitPriceWeight: number;
			availableQtyWeight: number;
			warrantyWeight: number;
			discountWeight: number;
			reason?: string;
		},
	) {
		const moc = await db.query.mocs.findFirst({ where: eq(mocs.id, mocId) });
		if (!moc) throw new Error("MOC not found");
		if (moc.status !== "Draft") {
			throw new Error("SAW weight requests can only be submitted for Draft MOCs");
		}

		const existingPending = await db.query.mocSawWeightRequests.findFirst({
			where: and(
				eq(mocSawWeightRequests.mocId, mocId),
				eq(mocSawWeightRequests.status, "Pending"),
			),
		});
		if (existingPending) {
			throw new Error("This MOC already has a pending SAW weight request");
		}

		const [inserted] = await db.insert(mocSawWeightRequests).values({
			mocId,
			unitPriceWeight: String(weights.unitPriceWeight),
			availableQtyWeight: String(weights.availableQtyWeight),
			warrantyWeight: String(weights.warrantyWeight),
			discountWeight: String(weights.discountWeight),
			reason: weights.reason || null,
			status: "Pending",
			requestedBy: userId,
		});

		return await db.query.mocSawWeightRequests.findFirst({
			where: eq(mocSawWeightRequests.id, inserted.insertId),
		});
	}

	/**
	 * Manager approves or rejects a pending SAW weight request.
	 * On approval, the request becomes the MOC's active weight set;
	 * scoring is not re-run automatically — staff must re-run it manually.
	 */
	async reviewSawWeightRequest(
		requestId: number,
		userId: number,
		action: "Approve" | "Reject",
		rejectReason?: string,
	) {
		const request = await db.query.mocSawWeightRequests.findFirst({
			where: eq(mocSawWeightRequests.id, requestId),
		});
		if (!request) throw new Error("SAW weight request not found");
		if (request.status !== "Pending") {
			throw new Error("Only Pending requests can be reviewed");
		}

		const newStatus = action === "Approve" ? "Approved" : "Rejected";

		await db.transaction(async (tx) => {
			await tx
				.update(mocSawWeightRequests)
				.set({
					status: newStatus,
					reviewedBy: userId,
					reviewedAt: new Date(),
					rejectReason: action === "Reject" ? rejectReason ?? null : null,
					updatedAt: new Date(),
				})
				.where(eq(mocSawWeightRequests.id, requestId));

			if (action === "Approve") {
				await tx
					.update(mocs)
					.set({ activeSawWeightRequestId: requestId, updatedAt: new Date() })
					.where(eq(mocs.id, request.mocId));
			}
		});

		const updatedRequest = await db.query.mocSawWeightRequests.findFirst({
			where: eq(mocSawWeightRequests.id, requestId),
		});

		return {
			request: updatedRequest,
			mocId: request.mocId,
			requesterUserId: request.requestedBy,
		};
	}
}

export default MocRepository;
