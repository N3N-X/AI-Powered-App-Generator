import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const migrationPath = join(
      process.cwd(),
      'supabase/migrations/20260122000000_initial_schema.sql'
    );

    console.log('📂 Reading migration file...');
    const sql = readFileSync(migrationPath, 'utf8');
    console.log(`✅ Loaded ${sql.split('\n').length} lines of SQL\n`);

    console.log('🚀 Running migration via Supabase SQL...');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      process.stdout.write(`\r[${i + 1}/${statements.length}] Executing...`);

      const { error } = await supabase.rpc('exec_sql', { sql: stmt });

      if (error && !error.message.includes('already exists')) {
        console.error(`\n❌ Failed at statement ${i + 1}:`, error.message);
        console.error('Statement:', stmt.substring(0, 100) + '...');
      }
    }

    console.log('\n\n✅ Migration completed!\n');

    console.log('📊 Verifying tables...');
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (error) {
      console.error('Could not verify tables:', error.message);
    } else {
      console.log('\n✅ Tables in database:');
      data?.forEach((row) => {
        console.log(`   - ${row.table_name}`);
      });
    }

    console.log('\n🎉 Database setup complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
