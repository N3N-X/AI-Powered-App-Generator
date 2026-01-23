#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Converting Prisma code to Supabase...\n');

// Common Prisma to Supabase conversions
const conversions = [
  // User operations
  { from: /prisma\.user\.findUnique\(\{\s*where:\s*\{\s*id:\s*(\w+)\s*\}\s*\}\)/g, to: 'await (await createClient()).from("users").select("*").eq("id", $1).single()' },
  { from: /prisma\.user\.findUnique\(\{\s*where:\s*\{\s*email:\s*(\w+)\s*\}\s*\}\)/g, to: 'await (await createClient()).from("users").select("*").eq("email", $1).single()' },
  { from: /prisma\.user\.create\(\{\s*data:\s*(\w+)\s*\}\)/g, to: 'await (await createClient()).from("users").insert($1).select().single()' },
  { from: /prisma\.user\.update\(\{\s*where:\s*\{\s*id:\s*(\w+)\s*\},\s*data:\s*(\w+)\s*\}\)/g, to: 'await (await createClient()).from("users").update($2).eq("id", $1).select().single()' },

  // Project operations
  { from: /prisma\.project\.findUnique\(\{\s*where:\s*\{\s*id:\s*(\w+)\s*\}\s*\}\)/g, to: 'await (await createClient()).from("projects").select("*").eq("id", $1).single()' },
  { from: /prisma\.project\.findMany\(\{\s*where:\s*\{\s*userId:\s*(\w+)\s*\}\s*\}\)/g, to: 'await (await createClient()).from("projects").select("*").eq("user_id", $1)' },
  { from: /prisma\.project\.create\(\{\s*data:\s*(\w+)\s*\}\)/g, to: 'await (await createClient()).from("projects").insert($1).select().single()' },
  { from: /prisma\.project\.update\(\{\s*where:\s*\{\s*id:\s*(\w+)\s*\},\s*data:\s*(\w+)\s*\}\)/g, to: 'await (await createClient()).from("projects").update($2).eq("id", $1).select().single()' },
  { from: /prisma\.project\.delete\(\{\s*where:\s*\{\s*id:\s*(\w+)\s*\}\s*\}\)/g, to: 'await (await createClient()).from("projects").delete().eq("id", $1)' },

  // Build operations
  { from: /prisma\.build\.findMany\(\{/g, to: '(await createClient()).from("builds").select("*")' },
  { from: /prisma\.build\.create\(\{\s*data:\s*(\w+)\s*\}\)/g, to: 'await (await createClient()).from("builds").insert($1).select().single()' },
  { from: /prisma\.build\.update\(\{\s*where:\s*\{\s*id:\s*(\w+)\s*\},\s*data:\s*(\w+)\s*\}\)/g, to: 'await (await createClient()).from("builds").update($2).eq("id", $1).select().single()' },

  // Generic Prisma patterns
  { from: /const user = await prisma/g, to: 'const supabase = await createClient();\n  const { data: user } = await supabase' },
  { from: /const project = await prisma/g, to: 'const supabase = await createClient();\n  const { data: project } = await supabase' },
  { from: /const build = await prisma/g, to: 'const supabase = await createClient();\n  const { data: build } = await supabase' },
];

// Find all TypeScript files
function getAllTsFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      getAllTsFiles(fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }

  return files;
}

// Process each file
const appFiles = getAllTsFiles(path.join(process.cwd(), 'app'));
const libFiles = getAllTsFiles(path.join(process.cwd(), 'lib'));
const allFiles = [...appFiles, ...libFiles];

let filesUpdated = 0;

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Skip if no prisma references
  if (!content.includes('prisma')) {
    continue;
  }

  console.log(`📝 Processing: ${path.relative(process.cwd(), filePath)}`);

  // Apply conversions
  for (const { from, to } of conversions) {
    content = content.replace(from, to);
  }

  // Additional cleanup
  content = content.replace(/await prisma\./g, 'await supabase.from(');
  content = content.replace(/prisma\./g, 'supabase.from(');

  // Only write if changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesUpdated++;
    console.log(`   ✓ Updated`);
  }
}

console.log(`\n✅ Migration complete!`);
console.log(`   Updated ${filesUpdated} files`);
console.log(`\n⚠️  Manual review required:`);
console.log(`   - Complex queries with includes/nested selects`);
console.log(`   - Transactions`);
console.log(`   - Aggregations`);
console.log(`\n📖 See lib/supabase/db.ts for helper functions`);
