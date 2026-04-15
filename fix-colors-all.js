const fs = require('fs');

function fixFiles() {
    const files = [
        'src/app/page.tsx',
        'src/app/admin/users/page.tsx',
        'src/components/admin/AdminSidebar.tsx',
        'src/app/admin/registrations/page.tsx',
        'src/app/admin/dashboard/page.tsx'
    ];

    files.forEach(file => {
        if (!fs.existsSync(file)) return;
        let c = fs.readFileSync(file, 'utf8');
        
        c = c.replace(/\bbg-\[\#0A0A0B\]\b/g, 'bg-zinc-50 dark:bg-[#0A0A0B]');
        c = c.replace(/\bbg-\[\#0F0F12\]\b/g, 'bg-white dark:bg-[#0F0F12]');
        c = c.replace(/(?<!dark:)\btext-white\b(?!(\/|\w|\-))/g, 'text-zinc-900 dark:text-white');
        c = c.replace(/(?<!dark:)\btext-white\/([0-9]+)\b/g, 'text-zinc-500 dark:text-white/$1');
        c = c.replace(/(?<!dark:)\bborder-white\/([0-9]+)\b/g, 'border-zinc-200 dark:border-white/$1');
        c = c.replace(/(?<!dark:)\bborder-white\/\[0\.([0-9]+)\]\b/g, 'border-zinc-200 dark:border-white/[0.$1]');
        c = c.replace(/(?<!dark:)\bbg-black\/([0-9]+)\b/g, 'bg-zinc-100 dark:bg-black/$1');
        c = c.replace(/(?<!dark:)\bbg-white\/([0-9]+)\b/g, 'bg-zinc-100/50 dark:bg-white/$1');
        c = c.replace(/(?<!dark:)\bbg-white\/\[0\.([0-9]+)\]\b/g, 'bg-zinc-100/50 dark:bg-white/[0.$1]');
        
        fs.writeFileSync(file, c);
    });
}
fixFiles();
