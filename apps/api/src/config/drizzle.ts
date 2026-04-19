import { drizzle } from 'drizzle-orm/mysql2';
import pool from './database';
import * as schema from '../db/schema';

// Create the Drizzle instance using the existing mysql2 connection pool
const db = drizzle(pool, { mode: 'default', schema });

export default db;