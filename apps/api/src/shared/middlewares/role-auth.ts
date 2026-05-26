import type { Request, Response, NextFunction } from 'express';
import AppError from '#shared/utils/error.ts';
import db from '#config/drizzle.ts';
import { users, roleModules } from '../../db/schema/index.ts';
import { eq } from 'drizzle-orm';

// Known module slugs (registered route prefixes without leading slash)
const KNOWN_MODULE_SLUGS = [
  'vessels',
  'master-data',
  'master-data/items',
  'master-data/vendors',
  'master-data/vessel-stocks',
  'request',
  'moc',
  'purchase-orders',
  'good-receipt',
  'settings',
  'settings/users',
  'settings/module-access',
  'settings/vessel-item-standards',
];

const API_ROUTE_TO_MODULE: Record<string, string> = {
  'master-data/vessels': 'vessels',
  'vessel-requests': 'request',
  'good-receipts': 'good-receipt',
};

const hasModuleAccess = (permittedSlugs: string[], moduleSlug: string) => {
  return permittedSlugs.includes(moduleSlug);
};

const roleAuth = () => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.apiToken?.userId;
    if (!userId) throw new AppError('Authentication required', 401);

    // Resolve user type
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, type: true },
    });
    if (!user) throw new AppError('User account not found', 401);

    // Resolve module slug from route path
    // req.baseUrl is like '/api/settings/users' — strip the '/api/' prefix
    const routeSlug = req.baseUrl.replace(/^\/api\//, '');
    const moduleSlug = API_ROUTE_TO_MODULE[routeSlug] || routeSlug;

    if (!KNOWN_MODULE_SLUGS.includes(moduleSlug)) {
      throw new AppError('Module could not be resolved', 403);
    }

    const access = await db.query.roleModules.findMany({
      where: eq(roleModules.userType, user.type),
      columns: { moduleSlug: true },
    });

    console.log(`User ID ${userId} with type ${user.type} accessing module ${moduleSlug}`);

    if (!hasModuleAccess(access.map((item) => item.moduleSlug), moduleSlug)) {
      throw new AppError('Insufficient module permissions', 403);
    }

    next();
  };
};

export default roleAuth;
