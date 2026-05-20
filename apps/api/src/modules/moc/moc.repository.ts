import db from '../../config/drizzle';
import { mocs, mocVendors, vesselRequests, vesselRequestItems, mstItems, mstVessels } from '../../db/schema/index.ts';
import { desc, eq, like, sql, and, or, inArray } from 'drizzle-orm';

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
        const vendorValues = data.vendors.map((v: any) => ({
          mocId: mocId,
          vendorId: v.vendorId,
          unitPrice: v.unitPrice,
          leadTime: v.leadTime,
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
        user: {
          columns: { id: true, fullName: true },
        },
        vesselRequest: {
          with: {
            vessel: {
              columns: { id: true, name: true },
            },
          },
        },
        vesselRequestItem: {
          with: {
            item: {
              columns: { id: true, name: true },
            },
          },
        },
        mocVendors: {
          with: {
            vendor: {
              columns: { id: true, name: true },
            },
          },
        },
      },
    });

    return result || null;
  }

  async getMocs(page: number = 1, limit: number = 10, search: string = '', status?: string) {
    const searchPattern = `%${search}%`;

    // Fetch matching MOC IDs using joins to search across request code, item name, and vessel name
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
      if (matchingMocIds.length === 0) {
        return { items: [], total: 0 };
      }
    }

    const conditions = [];
    if (matchingMocIds !== null) {
      conditions.push(inArray(mocs.id, matchingMocIds));
    }
    if (status) {
      conditions.push(eq(mocs.status, status as any));
    }

    const condition = conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined;

    const itemsQuery = db.query.mocs.findMany({
      where: condition,
      with: {
        user: {
          columns: { id: true, fullName: true },
        },
        vesselRequest: {
          with: {
            vessel: {
              columns: { id: true, name: true },
            },
          },
        },
        vesselRequestItem: {
          with: {
            item: {
              columns: { id: true, name: true },
            },
          },
        },
        mocVendors: {
          with: {
            vendor: {
              columns: { id: true, name: true },
            },
          },
        },
      },
      offset: (page - 1) * limit,
      limit: limit,
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
      // Update status
      await tx
        .update(mocs)
        .set({
          status: data.status || 'Draft',
          updatedAt: new Date(),
        })
        .where(eq(mocs.id, id));

      // Re-insert vendors (delete old and insert new)
      await tx.delete(mocVendors).where(eq(mocVendors.mocId, id));

      if (data.vendors && data.vendors.length > 0) {
        const vendorValues = data.vendors.map((v: any) => ({
          mocId: id,
          vendorId: v.vendorId,
          unitPrice: v.unitPrice,
          leadTime: v.leadTime,
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
}

export default MocRepository;
