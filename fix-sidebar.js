const fs = require('fs');
let c = fs.readFileSync('src/components/admin/AdminSidebar.tsx', 'utf8');

if (!c.includes('import { ThemeToggle }')) {
  c = c.replace(/import \{ signOut \} from ".*?";/, "import { ThemeToggle } from '@/components/theme-toggle';\n$&");
  c = c.replace(
    /\{\s*\/\*\s*Footer Profile\/Actions\s*\*\/\s*\}/,
    `
            {/* Footer Features */}
            <div className="px-4 pb-4">
                <ThemeToggle />
            </div>
            
            {/* Footer Profile/Actions */}`
  );
  fs.writeFileSync('src/components/admin/AdminSidebar.tsx', c);
}
