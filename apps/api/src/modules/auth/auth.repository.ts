import db from '../../config/drizzle';
import { users } from '../../db/schema/index.ts';
import { eq, or } from 'drizzle-orm';

class AuthRepository {
        async createUser(data: typeof users.$inferInsert) {
                const inserted = await db.insert(users).values(data);
                const result = await db.select().from(users).where(eq(users.id, inserted[0].insertId)).limit(1);
                return result[0];
        }

        async findUser(data: Partial<typeof users.$inferSelect>) {
                const conditions = [];
                if (data.id) conditions.push(eq(users.id, data.id));
                if (data.username) conditions.push(eq(users.username, data.username));
                if (data.email) conditions.push(eq(users.email, data.email));

                if (conditions.length === 0) return null;

                const filters = conditions.length === 1 ? conditions[0] : or(...conditions);

                const result = await db.select().from(users).where(filters).limit(1);
                return result[0] || null;
        }
}

export default AuthRepository;
