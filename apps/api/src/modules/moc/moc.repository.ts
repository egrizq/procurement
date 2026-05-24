import db from '../../config/drizzle';
import { mocs, mocVendors, vesselRequests, vesselRequestItems, mstItems, mstVessels } from '../../db/schema/index.ts';
import { desc, eq, like, sql, and, or, inArray } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────
// SAW (Simple Additive Weighting) Algorithm
// Weights: Price 40% (cost), Qty 25%, Warranty 20%, Discount 15%
// ─────────────────────────────────────────────────────────────
const SAW_WEIGHTS = {
  unitPrice:    0.40, // cost  → lower is better
  availableQty: 0.25, // benefit → higher is better
  warranty:     0.20, // benefit → higher is better
  discount:     0.15, // benefit → higher is better
};

function calculateSAW(vendors: any[]): any[] {
  if (!vendors || vendors.length === 0) return vendors;

  const minPrice = Math.min(...vendors.map((v) => v.unitPrice || 1));
  const maxQty   = Math.max(...vendors.map((v) => v.availableQty || 0));
  const maxWar   = Math.max(...vendors.map((v) => v.warranty || 0));
  const maxDis   = Math.max(...vendors.map((v) => v.discount || 0));

  const scored = vendors.map((v) => {
    const rPrice = minPrice / (v.unitPrice || 1);
    const rQty   = maxQty > 0 ? (v.availableQty || 0) / maxQty : 0;
    const rWar   = maxWar > 0 ? (v.warranty || 0) / maxWar : 0;
    const rDis   = maxDis > 0 ? (v.discount || 0) / maxDis : 0;

    const score =
      SAW_WEIGHTS.unitPrice    * rPrice +
      SAW_WEIGHTS.availableQty * rQty   +
      SAW_WEIGHTS.warranty     * rWar   +
      SAW_WEIGHTS.discount     * rDis;

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
function calculateSAWWithBreakdown(vendors: any[]) {
  if (!vendors || vendors.length === 0) return { vendors: [], weights: SAW_WEIGHTS };

  const minPrice = Math.min(...vendors.map((v) => v.unitPrice || 1));
  const maxQty   = Math.max(...vendors.map((v) => v.availableQty || 0));
  const maxWar   = Math.max(...vendors.map((v) => v.warranty || 0));
  const maxDis   = Math.max(...vendors.map((v) => v.discount || 0));

  const scored = vendors.map((v) => {
    const rPrice = parseFloat((minPrice / (v.unitPrice || 1)).toFixed(4));
    const rQty   = maxQty > 0 ? parseFloat(((v.availableQty || 0) / maxQty).toFixed(4)) : 0;
    const rWar   = maxWar > 0 ? parseFloat(((v.warranty || 0) / maxWar).toFixed(4)) : 0;
    const rDis   = maxDis > 0 ? parseFloat(((v.discount || 0) / maxDis).toFixed(4)) : 0;

    const wPrice = parseFloat((SAW_WEIGHTS.unitPrice    * rPrice).toFixed(4));
    const wQty   = parseFloat((SAW_WEIGHTS.availableQty * rQty).toFixed(4));
    const wWar   = parseFloat((SAW_WEIGHTS.warranty     * rWar).toFixed(4));
    const wDis   = parseFloat((SAW_WEIGHTS.discount     * rDis).toFixed(4));

    const sawScore = parseFloat((wPrice + wQty + wWar + wDis).toFixed(4));

    return {
      ...v,
      normalized: { rPrice, rQty, rWar, rDis },
      weighted:   { wPrice, wQty, wWar, wDis },
      sawScore,
    };
  });

  const sorted  = [...scored].sort((a, b) => b.sawScore - a.sawScore);
  const maxScore = sorted[0]?.sawScore ?? 0;

  const ranked = scored.map((v) => ({
    ...v,
    rank: sorted.findIndex((s) => s.id === v.id) + 1,
    isSelected: v.sawScore === maxScore,
  }));

  return { vendors: ranked, weights: SAW_WEIGHTS, minPrice, maxQty, maxWar, maxDis };
}

class MocRepository {
  async createMoc(data: any, createdBy: number) {
    return await db.transaction(async (tx) => {
      const [inserted] = await tx.insert(mocs).values({
        vesselRequestId: data.vesselRequestId,
        vesselRequestItemId: data.vesselRequestItemId,
        status: data.status || 'Draft',
        createdBy: createdBy,
      });

      const mocId = inserted.insertId;

      if (data.vendors && data.vendors.length > 0) {
        const isCompleted = data.status === 'Completed';
        const vendorsToInsert = isCompleted ? calculateSAW(data.vendors) : data.vendors;

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

      return await this.getMocById(mocId);
    });
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
      },
    });

    return result || null;
  }

  async getMocs(page: number = 1, limit: number = 10, search: string = '', status?: string) {
    const searchPattern = `%${search}%`;

    let matchingMocIds: number[] | null = null;
    if (search) {
      const results = await db
        .select({ id: mocs.id })
        .from(mocs)
        .innerJoin(vesselRequests, eq(mocs.vesselRequestId, vesselRequests.id))
        .innerJoin(vesselRequestItems, eq(mocs.vesselRequestItemId, vesselRequestItems.id))
        .innerJoin(mstItems, eq(vesselRequestItems.itemId, mstItems.id))
        .innerJoin(mstVessels, eq(vesselRequests.vesselId, mstVessels.id))
        .where(
          or(
            like(vesselRequests.requestCode, searchPattern),
            like(mstItems.name, searchPattern),
            like(mstVessels.name, searchPattern)
          )
        );
      matchingMocIds = results.map((r) => r.id);
      if (matchingMocIds.length === 0) return { items: [], total: 0 };
    }

    const conditions = [];
    if (matchingMocIds !== null) conditions.push(inArray(mocs.id, matchingMocIds));
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
    return await db.transaction(async (tx) => {
      await tx
        .update(mocs)
        .set({
          status: data.status || 'Draft',
          selectedVendorId: data.selectedVendorId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(mocs.id, id));

      await tx.delete(mocVendors).where(eq(mocVendors.mocId, id));

      if (data.vendors && data.vendors.length > 0) {
        const isCompleted = data.status === 'Completed';
        const vendorsToInsert = isCompleted ? calculateSAW(data.vendors) : data.vendors;

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

      return await this.getMocById(id);
    });
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
    if (!moc) throw new Error('MOC not found');

    const vendors = moc.mocVendors ?? [];
    if (vendors.length < 2) {
      throw new Error('At least 2 vendors are required to run SAW scoring');
    }

    const breakdown = calculateSAWWithBreakdown(vendors);

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
}

export default MocRepository;
