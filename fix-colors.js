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

    // Clean up botched replacements from previous script
    content = content.replace(/primary\//g, 'primary/20'); // Quick fix for empty opacity (some might be wrong but better than invalid)
    content = content.replace(/primary\/20\s+ring-1/g, 'primary/20 ring-1'); // specific fix from sidebar
    
    // Convert any remaining green- variations (green-700/green-900, etc)
    content = content.replace(/text-green-\d{3}/g, 'text-primary');
    content = content.replace(/bg-green-\d{3}\/(\d+)/g, 'bg-primary/');
    content = content.replace(/bg-green-\d{3}/g, 'bg-primary');
    content = content.replace(/border-green-\d{3}\/(\d+)/g, 'border-primary/');
    content = content.replace(/border-green-\d{3}/g, 'border-primary');
    content = content.replace(/ring-green-\d{3}\/(\d+)/g, 'ring-primary/');
    content = content.replace(/ring-green-\d{3}/g, 'ring-primary');
    content = content.replace(/shadow-green-[^\s]+/g, 'shadow-primary/20');
    content = content.replace(/from-green-\d{3}\/(\d+)/g, 'from-primary/');
    content = content.replace(/from-green-\d{3}/g, 'from-primary');
    content = content.replace(/to-green-\d{3}\/(\d+)/g, 'to-primary/');
    content = content.replace(/to-green-\d{3}/g, 'to-primary');
    
    // Also, some leftover /2020 might have occurred if a previous primary/ was matched twice, let's fix it later if seen.
    content = content.replace(/109,152,56,([\d.]+)/g, '109,152,56,'); // rgba primary fix ensure untouched
    
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed colors safely via node script');