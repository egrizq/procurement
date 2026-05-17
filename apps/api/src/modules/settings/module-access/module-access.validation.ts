import { z } from 'zod';
import { usersTypeEnum } from '../../../db/schema/enums.ts';

export const KNOWN_MODULE_SLUGS = [
	'vessels',
	'master-data',
	'master-data/items',
	'master-data/vendors',
	'master-data/vessel-stocks',
	'request',
	'moc',
	'purchase-order',
	'good-receipt',
	'settings',
	'settings/users',
	'settings/module-access',
	'settings/vessel-item-standards',
] as const;

export const addMappingSchema = z.object({
	body: z.object({
		userType: z.enum(usersTypeEnum, { message: 'Invalid user type' }),
		moduleSlug: z.enum(KNOWN_MODULE_SLUGS, { message: 'Invalid module slug' }),
	}),
});

export const removeMappingSchema = z.object({
	body: z.object({
		userType: z.enum(usersTypeEnum, { message: 'Invalid user type' }),
		moduleSlug: z.enum(KNOWN_MODULE_SLUGS, { message: 'Invalid module slug' }),
	}),
});
