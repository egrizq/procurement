import '../env.ts';
import bcrypt from 'bcrypt';
import db from '../config/drizzle';
import { 
  mstVessels, 
  mstItemCategories, 
  mstVendors, 
  mstItems, 
  users, 
  vesselItemStandards
} from './schema';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // 1. DELETE EXISTING DATA (Reverse dependency order to avoid FK errors)
    // We explicitly SKIP apiTokens to keep authentication tokens intact if desired
    console.log('🧹 Clearing existing data...');
    await db.delete(vesselItemStandards);
    await db.delete(users);
    await db.delete(mstItems);
    await db.delete(mstItemCategories);
    await db.delete(mstVendors);
    await db.delete(mstVessels);

    // 2. SEED VESSELS
    console.log('🚢 Seeding vessels...');
    await db.insert(mstVessels).values([
      { id: 1, name: 'Tugboat Alpha', type: 'Tug', imoNumber: 'IMO1234567', flag: 'IDN' },
      { id: 2, name: 'Barge Beta', type: 'Barge', imoNumber: 'IMO7654321', flag: 'IDN' },
      { id: 3, name: 'Crewboat Gamma', type: 'Crew', imoNumber: 'IMO1112223', flag: 'SGP' }
    ]);

    // 3. SEED ITEM CATEGORIES
    console.log('📦 Seeding item categories...');
    await db.insert(mstItemCategories).values([
      { id: 1, name: 'Engine Parts' },
      { id: 2, name: 'Deck Supplies' },
      { id: 3, name: 'Safety Equipment' }
    ]);

    // 4. SEED VENDORS
    console.log('🏢 Seeding vendors...');
    await db.insert(mstVendors).values([
      { id: 1, name: 'MarineTech Supplies', category: 'Sparepart', email: 'sales@marinetech.fake', phone: '08123456789' },
      { id: 2, name: 'Oceanic Fuel Co', category: 'Fuel', email: 'bunker@oceanic.fake', phone: '08987654321' },
      { id: 3, name: 'SafeHull Services', category: 'Jasa', email: 'service@safehull.fake', phone: '08221122334' }
    ]);

    // 5. SEED ITEMS
    console.log('🔧 Seeding items...');
    await db.insert(mstItems).values([
      { id: 1, itemCode: 'ENG-001', name: 'Fuel Filter', unit: 'Pcs', categoryId: 1, status: 'Publish' },
      { id: 2, itemCode: 'DK-001', name: 'Mooring Rope 50m', unit: 'Meter', categoryId: 2, status: 'Publish' },
      { id: 3, itemCode: 'SFT-001', name: 'Life Jacket', unit: 'Pcs', categoryId: 3, status: 'Publish' },
      { id: 4, itemCode: 'ENG-002', name: 'Engine Oil', unit: 'Liter', categoryId: 1, status: 'Publish' }
    ]);

    // 6. SEED USERS (Including Root Account)
    console.log('👥 Seeding users...');
    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('password123', saltRounds);
    const rootPassword = await bcrypt.hash('root1234', saltRounds);

    await db.insert(users).values([
      {
        id: 1,
        username: 'root',
        email: 'root@marine.com',
        password: rootPassword,
        type: 'Admin',
        department: 'IT',
        vesselId: 1, // Optional structurally, though assigned here for schema compliance
        fullName: 'System Administrator'
      },
      {
        id: 2,
        username: 'captain_alpha',
        email: 'captain_alpha@marine.com',
        password: defaultPassword,
        type: 'Crew',
        department: 'Deck',
        vesselId: 1,
        fullName: 'Captain John Doe'
      },
      {
        id: 3,
        username: 'purchasing_mgr',
        email: 'purchasing_mgr@marine.com',
        password: defaultPassword,
        type: 'Manager',
        department: 'Finance',
        vesselId: 2,
        fullName: 'Jane Smith'
      }
    ]);

    // 7. SEED VESSEL ITEM STANDARDS
    console.log('📏 Seeding vessel item standards...');
    await db.insert(vesselItemStandards).values([
      { vesselId: 1, itemId: 1, periode: 'monthly', minStock: 2, maxStock: 10 },
      { vesselId: 1, itemId: 2, periode: 'monthly', minStock: 1, maxStock: 5 },
      { vesselId: 1, itemId: 3, periode: 'weekly', minStock: 5, maxStock: 20 },
      { vesselId: 2, itemId: 4, periode: 'monthly', minStock: 50, maxStock: 200 }
    ]);

    console.log('✅ Seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
