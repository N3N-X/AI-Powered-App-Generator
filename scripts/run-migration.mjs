import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function runMigration() {
  // Use DATABASE_URL without pgbouncer for migrations
  let connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ No database connection string found');
    process.exit(1);
  }

  // Remove pgbouncer parameter if present
  connectionString = connectionString.replace('?pgbouncer=true', '');
  
  console.log('🔌 Connecting to:', connectionString.replace(/:[^:@]+@/, ':****@'));
  
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected!\n');

    const migrationPath = join(
      process.cwd(),
      'supabase/migrations/20260122000000_initial_schema.sql'
    );

    console.log('📂 Reading migration file...');
    const sql = readFileSync(migrationPath, 'utf8');
    console.log(`✅ Loaded ${sql.split('\n').length} lines of SQL\n`);

    console.log('🚀 Running migration...');
    await client.query(sql);
    console.log('✅ Migration completed successfully!\n');

    console.log('📊 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\n✅ Created tables:');
    result.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n🎉 Database migration complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.code) console.error('Error code:', error.code);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
