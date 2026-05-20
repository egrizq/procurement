import '../env.ts';
import pool from '../config/database.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('Running manual migration for MOC tables...');
  const sqlPath = path.resolve(__dirname, '../../drizzle/0007_smart_toxin.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Split by statement-breakpoint
  const statements = sqlContent.split('--> statement-breakpoint');

  const connection = await pool.getConnection();

  try {
    for (let statement of statements) {
      statement = statement.trim();
      if (!statement) continue;
      console.log('Executing:', statement);
      try {
        await connection.query(statement);
        console.log('Success.');
      } catch (err: any) {
        if (err.message.includes('already exists') || err.message.includes('Duplicate key name') || err.message.includes('Multiple primary key defined')) {
          console.log('Skipping (already exists/duplicate).');
        } else {
          throw err;
        }
      }
    }
    console.log('Migration completed successfully!');
  } finally {
    connection.release();
  }
  await pool.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
