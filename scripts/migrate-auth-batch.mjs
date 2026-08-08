import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const baseDir = 'src/app/api/landlord';
const mode = process.argv[2] || 'check'; // 'check' or 'migrate'

function findRouteFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findRouteFiles(fullPath));
    } else if (entry.name === 'route.ts') {
      results.push(fullPath);
    }
  }
  return results;
}

function replaceAuthBlock(content) {
  // Pattern 1: createClient + getUser multi-line or single-line, any error variable name, any destructure shape
  const authBlockPattern = /const\s+supabase\s*=\s*await\s+createClient\(\);[\s\n\r\t ]*?const\s*\{\s*data:\s*\{\s*user[\s\n\r\t ]*:[\s\n\r\t ]*(\w+)?[\s\n\r\t ]*\}[\s\n\r\t ]*,[\s\n\r\t ]*error:(\w+)[\s\n\r\t ]*\}[\s\n\r\t ]*=[\s\n\r\t ]*await\s+supabase\.auth\.getUser\(\);[\s\n\r\t ]*if\s*\(\s*\2[\s\n\r\t ]*\|\||\s*!\1[\s\n\r\t ]*\)/g;

  const replacement = `const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;`;

  let newContent = content.replace(authBlockPattern, replacement);

  // Pattern 2: createClient + getUser standard single-line
  if (newContent === content) {
    const pattern2 = /const\s+supabase\s*=\s*await\s+createClient\(\);\s*\n\s*const\s*\{\s*data:\s*\{\s*user\s*\}[\s\n\r\t ]*,[\s\n\r\t ]*error:\s*(userError|authError|error)[\s\n\r\t ]*\}[\s\n\r\t ]*=[\s\n\r\t ]*await\s+supabase\.auth\.getUser\(\);[\s\n\r\t ]*if\s*\(\s*\2[\s\n\r\t ]*\|\||\s*!user[\s\n\r\t ]*\)/gs;
    newContent = newContent.replace(pattern2, replacement);
  }

  // Pattern 3: getUser with ONLY "if (!user)" check (no error var)
  if (newContent === content) {
    const pattern3 = /const\s+supabase\s*=\s*await\s+createClient\(\);[\s\n\r\t ]*?const\s*\{\s*data:\s*\{\s*user\s*\}[\s\n\r\t ]*\}[\s\n\r\t ]*=\s*await\s+supabase\.auth\.getUser\(\);[\s\n\r\t ]*if\s*\(\s*!?user[\s\n\r\t]*\)/g;
    newContent = newContent.replace(pattern3, replacement);
  }

  // Pattern 4: getUser without preceding createClient, any var name rename
  if (newContent === content) {
    const pattern4 = /const\s*\{\s*data:\s*\{\s*user[\s\n\r\t ]*:[\s\n\r\t ]*(\w+)?[\s\n\r\t ]*\}[\s\n\r\t ]*,[\s\n\r\t ]*error:(\w+)[\s\n\r\t ]*\}[\s\n\r\t ]*=[\s\n\r\t ]*await\s+supabase\.auth\.getUser\(\);[\s\n\r\t ]*if\s*\(\s*\2[\s\n\r\t ]*\|\||\s*!\1[\s\n\r\t ]*\)/g;
    newContent = newContent.replace(pattern4, replacement);
  }

  return newContent;
}

function addImport(content) {
  const importLine = `import { requireAuthenticatedUser } from "@/lib/api/auth-guard";`;

  // Check if already has it
  if (content.includes('requireAuthenticatedUser')) {
    return content;
  }

  // Add after last import line
  const lastImport = content.match(/^import[^;]+;\n/gm);
  if (lastImport) {
    const lastIdx = content.lastIndexOf(lastImport[lastImport.length - 1]) + lastImport[lastImport.length - 1].length;
    return content.slice(0, lastIdx) + importLine + '\n' + content.slice(lastIdx);
  }

  return importLine + '\n' + content;
}

function replaceUserId(content) {
  // Replace user.id with userId but NOT within newUser.user.id
  return content.replace(/(?<!newUser\.)(?<!\w)user\.id(?!\w)/g, 'userId');
}

// Main
const files = findRouteFiles(baseDir);

if (mode === 'check') {
  console.log('Files with getUser() remaining:');
  let count = 0;
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    if (content.includes('getUser()')) {
      count++;
      const matches = content.match(/getUser\(\)/g);
      console.log(`  [${matches.length}x] ${relative(process.cwd(), file)}`);
    }
  }
  console.log(`\nTotal: ${count} files remaining`);
} else if (mode === 'migrate') {
  let success = 0;
  let skipped = 0;
  let errors = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');

      if (!content.includes('getUser()')) {
        skipped++;
        continue;
      }

      if (content.includes('requireAuthenticatedUser')) {
        console.log(`[SKIP] Already migrated: ${relative(process.cwd(), file)}`);
        skipped++;
        continue;
      }

      let result = content;

      // 1. Add import
      result = addImport(result);

      // 2. Replace auth block
      const beforeReplace = result;
      result = replaceAuthBlock(result);

      if (result === beforeReplace) {
        errors.push(`Could not match auth pattern in: ${relative(process.cwd(), file)}`);
        console.log(`[FAIL] ${relative(process.cwd(), file)}`);
        continue;
      }

      // 3. Replace user.id
      result = replaceUserId(result);

      // 4. Write
      writeFileSync(file, result, 'utf-8');
      success++;
      console.log(`[OK] ${relative(process.cwd(), file)}`);
    } catch (err) {
      errors.push(`${file}: ${err.message}`);
    }
  }

  console.log(`\nResults: ${success} migrated, ${files.length - success - skipped} failed, ${skipped} skipped`);
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  ${e}`));
  }
}