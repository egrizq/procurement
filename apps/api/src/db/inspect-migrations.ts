import '../env.ts';
import pool from '../config/database.ts';

async function run() {
  const connection = await pool.getConnection();
  try {
    const [columns] = await connection.query('SHOW COLUMNS FROM `migrations`');
    console.log('Columns in migrations table:', columns);

    const [rows] = await connection.query('SELECT * FROM `migrations` ORDER BY id DESC LIMIT 5');
    console.log('Last migrations recorded:', rows);
  } catch (error) {
    console.error('Error querying migrations table:', error);
  } finally {
    connection.release();
  }
  await pool.end();
}

run().catch(console.error);
