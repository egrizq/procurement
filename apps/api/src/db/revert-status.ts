import '../env.ts';
import pool from '../config/database.ts';

async function run() {
  console.log('Reverting database status enum and data back to original "Ok" state...');

  const connection = await pool.getConnection();

  try {
    // 1. Expand enum to allow both
    console.log('Expanding enums to allow both "Ok" and "Approved by system"...');
    await connection.query(
      "ALTER TABLE `vessel_request_items` MODIFY COLUMN `status` enum('Ok', 'Approved by system', 'Waiting', 'Approved', 'Rejected') NOT NULL DEFAULT 'Waiting'"
    );
    await connection.query(
      "ALTER TABLE `vessel_requests` MODIFY COLUMN `status` enum('Ok', 'Approved by system', 'Waiting', 'Approved', 'Rejected') NOT NULL DEFAULT 'Waiting'"
    );

    // 2. Revert data to 'Ok'
    console.log('Reverting data to "Ok"...');
    const [resItems] = await connection.query(
      "UPDATE `vessel_request_items` SET `status` = 'Ok' WHERE `status` = 'Approved by system'"
    );
    console.log(`Reverted request items rows:`, (resItems as any).affectedRows || 0);

    const [resReqs] = await connection.query(
      "UPDATE `vessel_requests` SET `status` = 'Ok' WHERE `status` = 'Approved by system'"
    );
    console.log(`Reverted vessel requests rows:`, (resReqs as any).affectedRows || 0);

    // 3. Shrink enum back to original definition
    console.log('Shrinking enums to original definition...');
    await connection.query(
      "ALTER TABLE `vessel_request_items` MODIFY COLUMN `status` enum('Ok', 'Waiting', 'Approved', 'Rejected') NOT NULL DEFAULT 'Waiting'"
    );
    await connection.query(
      "ALTER TABLE `vessel_requests` MODIFY COLUMN `status` enum('Ok', 'Waiting', 'Approved', 'Rejected') NOT NULL DEFAULT 'Waiting'"
    );

    console.log('Revert completed successfully!');
  } catch (error) {
    console.error('Revert failed:', error);
    throw error;
  } finally {
    connection.release();
  }
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
