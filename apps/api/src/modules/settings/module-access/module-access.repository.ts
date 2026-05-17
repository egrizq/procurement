import db from '../../../config/drizzle';
import { roleModules } from '../../../db/schema/index.ts';
import { eq, and } from 'drizzle-orm';

class ModuleAccessRepository {
	async getAllMappings() {
		const mappings = await db.select().from(roleModules);
		return mappings;
	}

	async getMappingsByUserType(userType: string) {
		const mappings = await db
			.select()
			.from(roleModules)
			.where(eq(roleModules.userType, userType as any));
		return mappings;
	}

	async addMapping(userType: string, moduleSlug: string) {
		const inserted = await db.insert(roleModules).values({
			userType: userType as any,
			moduleSlug,
		});
		const record = await db
			.select()
			.from(roleModules)
			.where(eq(roleModules.id, inserted[0].insertId));
		return record[0];
	}

	async removeMapping(userType: string, moduleSlug: string) {
		const result = await db
			.delete(roleModules)
			.where(
				and(
					eq(roleModules.userType, userType as any),
					eq(roleModules.moduleSlug, moduleSlug)
				)
			);
		return result[0].affectedRows > 0;
	}

	async getPermittedSlugs(userType: string) {
		const mappings = await db
			.select({ moduleSlug: roleModules.moduleSlug })
			.from(roleModules)
			.where(eq(roleModules.userType, userType as any));
		return mappings.map((m) => m.moduleSlug);
	}
}

export default ModuleAccessRepository;
