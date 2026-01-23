#!/usr/bin/env ts-node

import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const { Client } = pg;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
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
      ORDER BY table_name;
    `);

    console.log('\n✅ Created tables:');
    result.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n🎉 Database migration complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
