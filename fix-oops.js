const fs = require('fs');
const files = [
  'src/components/admin/AdminSidebar.tsx',
  'src/app/admin/dashboard/page.tsx', 
  'src/app/admin/users/page.tsx',
  'src/app/admin/registrations/page.tsx',
  'src/app/admin/layout.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Remove duplicates
    content = content.replace(/primary\/20\d\d/g, 'primary/20');
    content = content.replace(/primary\/20\s+ring-1/g, 'primary/20 ring-1');
    content = content.replace(/primary\/2080/g, 'primary/80');
    // Fix rgba
    content = content.replace(/109,152,56,\)/g, '109,152,56,0.2)');
    content = content.replace(/109,152,56,\]/g, '109,152,56,0.2)]');

    fs.writeFileSync(file, content);
  }
});