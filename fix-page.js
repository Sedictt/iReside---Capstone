const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// Insert ThemeToggle
if (!code.includes('import { ThemeToggle }')) {
  code = code.replace(/import \{ ArrowRight/, "import { ThemeToggle } from '@/components/theme-toggle';\nimport { ArrowRight");
  
  // Add it next to the Access Portal button
  code = code.replace(
    /<Link href="\/login"/,
    `<div className="flex items-center gap-4"><ThemeToggle /><Link href="/login"`
  );

  code = code.replace(
    /<\/Link>/,
    `</Link></div>`
  );
}

fs.writeFileSync('src/app/page.tsx', code);
