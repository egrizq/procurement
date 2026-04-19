import db from '#config/drizzle.ts';
import { apiTokens } from '../../db/schema/index.ts';
import { eq, and, gt } from 'drizzle-orm';

class ApiTokenRepository {
        static TOKEN_EXP_MS = new Date(Date.now() + 24 * 60 * 60 * 1000);

        async findToken(where: { where: any }) {
                const w = where.where;
                const conditions = [];
                
                if (w.token) {
                        conditions.push(eq(apiTokens.token, w.token));
                }
                if (w.deviceId) {
                        conditions.push(eq(apiTokens.deviceId, w.deviceId));
                }
                if (w.expiredAt && w.expiredAt.gt) {
                        conditions.push(gt(apiTokens.expiredAt, w.expiredAt.gt));
                }
                
                if (conditions.length === 0) return null;
                const filters = conditions.length === 1 ? conditions[0] : and(...conditions);

                const result = await db.select().from(apiTokens).where(filters).limit(1);
                return result[0] || null;
        }

        async createToken(tokenHash: string, deviceId: string, deviceName: string) {
                const inserted = await db.insert(apiTokens).values({
                        token: tokenHash,
                        deviceId: deviceId,
                        deviceName: deviceName,
                        expiredAt: ApiTokenRepository.TOKEN_EXP_MS,
                });
                
                const result = await db.select().from(apiTokens).where(eq(apiTokens.id, inserted[0].insertId)).limit(1);
                return result[0];
        }

        async updateToken(token: string, data: any) {
                const updated = await db.update(apiTokens).set(data).where(eq(apiTokens.token, token));
                return updated[0].affectedRows > 0;
        }
}

export default ApiTokenRepository;
