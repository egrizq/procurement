import db from '../../config/drizzle';
import {
  goodReceipts,
  purchaseOrders,
  mstVendors,
  vesselRequestItems,
  mstItems,
} from '../../db/schema/index.ts';
import { desc, eq, like, sql, and, or, inArray, notInArray } from 'drizzle-orm';

// ─── GR Number Generator ────────────────────────────────────────
async function generateGrNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const lastGr = await db.query.goodReceipts.findFirst({
    orderBy: [desc(goodReceipts.id)],
    columns: { grNumber: true },
  });

  let seq = 1;
  if (lastGr?.grNumber) {
    const parts = lastGr.grNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1] || '', 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `GR-${dateStr}-${String(seq).padStart(4, '0')}`;
}

class GoodReceiptRepository {
  async getPendingPOsForReceipt() {
    // Find all purchaseOrderIds that already have a good receipt
    const existingGrPOs = await db
      .select({ poId: goodReceipts.purchaseOrderId })
      .from(goodReceipts);
    const existingPoIds = existingGrPOs.map((gr) => gr.poId);

    // Conditions for PO status: Approved or Auto Approved
    const statusCondition = or(
      eq(purchaseOrders.status, 'Approved'),
      eq(purchaseOrders.status, 'Auto Approved')
    );

    // If there are existing POs, exclude them
    const whereCondition =
      existingPoIds.length > 0
        ? and(statusCondition, notInArray(purchaseOrders.id, existingPoIds))
        : statusCondition;

    const result = await db.query.purchaseOrders.findMany({
      where: whereCondition,
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
      },
      orderBy: [desc(purchaseOrders.createdAt)],
    });

    return result;
  }

  async createGoodReceipt(data: {
    purchaseOrderId: number;
    isSameItem: boolean;
    reason?: string | null;
    createdBy: number;
  }) {
    // Check if PO exists and is Approved/Auto Approved
    const po = await db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, data.purchaseOrderId),
    });
    if (!po) {
      throw new Error('Purchase Order not found');
    }
    if (po.status !== 'Approved' && po.status !== 'Auto Approved') {
      throw new Error('Purchase Order is not approved yet');
    }

    // Check if GR already exists
    const existingGr = await db.query.goodReceipts.findFirst({
      where: eq(goodReceipts.purchaseOrderId, data.purchaseOrderId),
    });
    if (existingGr) {
      throw new Error('Good Receipt already created for this Purchase Order');
    }

    const grNumber = await generateGrNumber();
    const status = data.isSameItem ? 'Accepted' : 'Rejected';

    const [inserted] = await db.insert(goodReceipts).values({
      grNumber,
      purchaseOrderId: data.purchaseOrderId,
      isSameItem: data.isSameItem,
      status,
      discrepancyReason: data.isSameItem ? null : (data.reason || null),
      createdBy: data.createdBy,
    });

    return await this.getGoodReceiptById(inserted.insertId);
  }

  async getGoodReceiptById(id: number) {
    const result = await db.query.goodReceipts.findFirst({
      where: eq(goodReceipts.id, id),
      with: {
        purchaseOrder: {
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
          },
        },
        createdByUser: { columns: { id: true, fullName: true } },
      },
    });
    return result || null;
  }

  async getGoodReceipts(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    status?: string
  ) {
    const searchPattern = `%${search}%`;

    let matchingIds: number[] | null = null;
    if (search) {
      const results = await db
        .select({ id: goodReceipts.id })
        .from(goodReceipts)
        .leftJoin(purchaseOrders, eq(goodReceipts.purchaseOrderId, purchaseOrders.id))
        .leftJoin(mstVendors, eq(purchaseOrders.vendorId, mstVendors.id))
        .leftJoin(vesselRequestItems, eq(purchaseOrders.vesselRequestItemId, vesselRequestItems.id))
        .leftJoin(mstItems, eq(vesselRequestItems.itemId, mstItems.id))
        .where(
          or(
            like(goodReceipts.grNumber, searchPattern),
            like(purchaseOrders.poNumber, searchPattern),
            like(mstVendors.name, searchPattern),
            like(mstItems.name, searchPattern)
          )
        );
      matchingIds = results.map((r) => r.id);
      if (matchingIds.length === 0) return { items: [], total: 0 };
    }

    const conditions = [];
    if (matchingIds !== null) conditions.push(inArray(goodReceipts.id, matchingIds));
    if (status) conditions.push(eq(goodReceipts.status, status as any));

    const condition =
      conditions.length > 0
        ? conditions.length === 1
          ? conditions[0]
          : and(...conditions)
        : undefined;

    const itemsQuery = db.query.goodReceipts.findMany({
      where: condition,
      with: {
        purchaseOrder: {
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
          },
        },
        createdByUser: { columns: { id: true, fullName: true } },
      },
      offset: (page - 1) * limit,
      limit,
      orderBy: [desc(goodReceipts.createdAt)],
    });

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(goodReceipts)
      .where(condition)
      .then((res) => Number(res[0]?.count || 0));

    const [items, total] = await Promise.all([itemsQuery, countQuery]);
    return { items, total };
  }
}

export default GoodReceiptRepository;
