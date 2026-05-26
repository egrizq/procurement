import db from "../../config/drizzle";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema/index.ts";

class ProfileRepository {
	async getUserById(userId: number) {
		return await db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				password: false, // excluding password to match Prisma's "select" behavior while getting everything else
			},
			with: {
				vessel: {
					columns: {
						id: true,
						name: true,
					},
				},
			},
		});
	}
}

export default ProfileRepository;
