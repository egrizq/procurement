import '../env.ts';
import pool from '../config/database.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('Running manual migration for 0010_uneven_greymalkin.sql...');
  const sqlPath = path.resolve(__dirname, '../../drizzle/0010_uneven_greymalkin.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Split by statement-breakpoint
  const statements = sqlContent.split('--> statement-breakpoint');

  const connection = await pool.getConnection();

  try {
    for (let statement of statements) {
      statement = statement.trim();
      if (!statement) continue;
      console.log('Executing:', statement);
      await connection.query(statement);
      console.log('Success.');
    }
    console.log('Migration 0010 completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
