import db from '../../config/drizzle';
import {
  purchaseOrders,
  vesselItemStandards,
  mocs,
  mstVendors,
  vesselRequestItems,
  mstItems,
  vesselRequests,
  mstVessels,
  users,
} from '../../db/schema/index.ts';
import { desc, eq, like, sql, and, or, inArray } from 'drizzle-orm';

// ─── PO Number Generator ────────────────────────────────────────
async function generatePoNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const lastPo = await db.query.purchaseOrders.findFirst({
    orderBy: [desc(purchaseOrders.id)],
    columns: { poNumber: true },
  });

  let seq = 1;
  if (lastPo?.poNumber) {
    const parts = lastPo.poNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `PO-${dateStr}-${String(seq).padStart(4, '0')}`;
}

// ─── Threshold Helper ───────────────────────────────────────────
// Reads po_threshold from vessel_item_standard for the given item.
// Returns null if no standard exists or threshold is not set → Pending Approval.
async function getItemThreshold(itemId: number): Promise<number | null> {
  const standard = await db.query.vesselItemStandards.findFirst({
    where: eq(vesselItemStandards.itemId, itemId),
    columns: { poThreshold: true },
  });
  if (!standard || standard.poThreshold === null || standard.poThreshold === undefined) {
    return null;
  }
  return Number(standard.poThreshold);
}

class PurchaseOrderRepository {
  async createPO(data: {
    mocId: number;
    vendorId: number;
    vesselRequestItemId: number;
    unitPrice: number;
    qty: number;
    notes?: string | null;
    itemId: number;
    createdBy: number;
  }) {
    const totalAmount = data.unitPrice * data.qty;

    // Threshold from vessel_item_standard.po_threshold for this item.
    // null → no threshold configured → always Pending Approval.
    const threshold = await getItemThreshold(data.itemId);

    let status: 'Auto Approved' | 'Pending Approval' = 'Pending Approval';
    if (threshold !== null && threshold > 0 && totalAmount < threshold) {
      status = 'Auto Approved';
    }

    const poNumber = await generatePoNumber();

    const [inserted] = await db.insert(purchaseOrders).values({
      poNumber,
      mocId: data.mocId,
      vendorId: data.vendorId,
      vesselRequestItemId: data.vesselRequestItemId,
      unitPrice: String(data.unitPrice),
      qty: data.qty,
      totalAmount: String(totalAmount),
      status,
      notes: data.notes || null,
      createdBy: data.createdBy,
    });

    // Mark MOC as Approved (PO created)
    await db.update(mocs).set({ status: 'Approved', updatedAt: new Date() }).where(eq(mocs.id, data.mocId));

    return await this.getPOById(inserted.insertId);
  }

  async getPOById(id: number) {
    const result = await db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, id),
      with: {
        vendor: { columns: { id: true, name: true } },
        vesselRequestItem: {
          with: { item: { columns: { id: true, name: true, itemCode: true } } },
        },
        moc: {
          with: {
            vesselRequest: {
              with: { vessel: { columns: { id: true, name: true } } },
            },
          },
          columns: { id: true, status: true },
        },
        createdByUser: { columns: { id: true, fullName: true } },
        approvedByUser: { columns: { id: true, fullName: true } },
      },
    });
    return result || null;
  }

  async getPOs(page: number = 1, limit: number = 10, search: string = '', status?: string) {
    const searchPattern = `%${search}%`;

    let matchingIds: number[] | null = null;
    if (search) {
      const results = await db
        .select({ id: purchaseOrders.id })
        .from(purchaseOrders)
        .leftJoin(mstVendors, eq(purchaseOrders.vendorId, mstVendors.id))
        .leftJoin(vesselRequestItems, eq(purchaseOrders.vesselRequestItemId, vesselRequestItems.id))
        .leftJoin(mstItems, eq(vesselRequestItems.itemId, mstItems.id))
        .where(
          or(
            like(purchaseOrders.poNumber, searchPattern),
            like(mstVendors.name, searchPattern),
            like(mstItems.name, searchPattern)
          )
        );
      matchingIds = results.map((r) => r.id);
      if (matchingIds.length === 0) return { items: [], total: 0 };
    }

    const conditions = [];
    if (matchingIds !== null) conditions.push(inArray(purchaseOrders.id, matchingIds));
    if (status) conditions.push(eq(purchaseOrders.status, status as any));

    const condition =
      conditions.length > 0
        ? conditions.length === 1
          ? conditions[0]
          : and(...conditions)
        : undefined;

    const itemsQuery = db.query.purchaseOrders.findMany({
      where: condition,
      with: {
        vendor: { columns: { id: true, name: true } },
        vesselRequestItem: {
          with: { item: { columns: { id: true, name: true, itemCode: true } } },
        },
        moc: {
          with: {
            vesselRequest: {
              columns: { id: true, requestCode: true },
              with: { vessel: { columns: { id: true, name: true } } },
            },
          },
          columns: { id: true, status: true },
        },
        createdByUser: { columns: { id: true, fullName: true } },
        approvedByUser: { columns: { id: true, fullName: true } },
      },
      offset: (page - 1) * limit,
      limit,
      orderBy: [desc(purchaseOrders.createdAt)],
    });

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(purchaseOrders)
      .where(condition)
      .then((res) => Number(res[0]?.count || 0));

    const [items, total] = await Promise.all([itemsQuery, countQuery]);
    return { items, total };
  }

  async approvePO(id: number, userId: number) {
    const po = await this.getPOById(id);
    if (!po) throw new Error('Purchase Order not found');
    if (po.status !== 'Pending Approval') {
      throw new Error('Only Pending Approval POs can be approved');
    }

    await db
      .update(purchaseOrders)
      .set({ status: 'Approved', approvedBy: userId, approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id));

    return await this.getPOById(id);
  }

  async rejectPO(id: number, userId: number, rejectionReason: string) {
    const po = await this.getPOById(id);
    if (!po) throw new Error('Purchase Order not found');
    if (po.status !== 'Pending Approval') {
      throw new Error('Only Pending Approval POs can be rejected');
    }

    await db
      .update(purchaseOrders)
      .set({
        status: 'Rejected',
        approvedBy: userId,
        approvedAt: new Date(),
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrders.id, id));

    return await this.getPOById(id);
  }
}

export default PurchaseOrderRepository;
