const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  // Check if users table exists
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1);
  
  if (error) {
    console.error('❌ Error querying users table:', error.message);
  } else {
    console.log('✅ Users table exists!');
  }
  
  // Check auth settings
  const { data: authData, error: authError } = await supabase.auth.getSession();
  console.log('Auth config check:', authError ? authError.message : 'OK');
}

test();
