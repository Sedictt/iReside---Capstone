const fs = require('fs');

let c = fs.readFileSync('src/app/page.tsx', 'utf8');

c = c.replace(
    /<div className="min-h-screen bg-white text-zinc-900 dark:bg-\[\#0A0A0B\] dark:text-white selection:bg-emerald-600 dark:bg-emerald-500\/30 font-sans overflow-x-hidden">/,
    `<div className="min-h-screen bg-background text-foreground selection:bg-primary/20 font-sans overflow-x-hidden">`
);

// We need to match the actual background div up top correctly
c = c.replace(
    /<div className="absolute top-\[-10%\] right-\[-5%\] w-\[800px\] h-\[800px\] bg-emerald-300\/40 dark:bg-emerald-900\/20 rounded-full blur-\[120px\] mix-blend-screen" \/>/,
    `<div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-primary/10 dark:bg-primary/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-60" />`
);

c = c.replace(
    /<div className="absolute bottom-\[-10%\] left-\[-10%\] w-\[600px\] h-\[600px\] bg-zinc-300\/50 dark:bg-zinc-800\/30 rounded-full blur-\[120px\] mix-blend-screen" \/>/,
    `<div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 dark:bg-white/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />`
);

c = c.replace(
    /className="fixed top-0 w-full z-50 border-b border-zinc-200 dark:border-white\/\[0\.04\] bg-white\/80 dark:bg-\[\#0A0A0B\]\/80 backdrop-blur-2xl"/,
    `className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-2xl"`
);

// We replace the logo gradient
c = c.replace(
    /bg-gradient-to-br from-emerald-500 to-emerald-700/g,
    `bg-gradient-to-br from-primary-200 to-primary-dark`
);
c = c.replace(
    /shadow-\[0_0_25px_rgba\(16,185,129,0\.3\)\]/g,
    `shadow-[0_0_25px_rgba(109,152,56,0.3)]`
);
c = c.replace(
    /ring-zinc-200 dark:ring-white\/10/,
    `ring-border`
);

// Title text
c = c.replace(
    /text-xl md:text-2xl font-extrabold tracking-tight leading-none text-zinc-900 dark:text-white\/95/,
    `text-xl md:text-2xl font-extrabold tracking-tight leading-none text-foreground`
);
c = c.replace(
    /text-\[9px\] md:text-\[10px\] font-extrabold uppercase tracking-\[0\.25em\] text-emerald-600 dark:text-emerald-400\/90 leading-tight mt-0\.5/,
    `text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.25em] text-primary leading-tight mt-0.5`
);

// Exclusive Network badge
c = c.replace(
    /span className="inline-flex items-center gap-2 px-5 py-2\.5 rounded-full border border-emerald-500\/30 bg-emerald-600 dark:bg-emerald-500\/10 text-\[11px\] font-black uppercase tracking-\[0\.2em\] text-emerald-600 dark:text-emerald-400 mb-6 shadow-\[0_0_30px_rgba\(16,185,129,0\.15\)\] backdrop-blur-md"/,
    `span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-6 shadow-[0_0_30px_rgba(109,152,56,0.15)] backdrop-blur-md"`
);

// Property log line
c = c.replace(
    /span className="text-zinc-900 dark:text-white block pb-2 md:pb-4 drop-shadow-2xl"/,
    `span className="text-foreground block pb-2 md:pb-4 dark:drop-shadow-2xl"`
);

// Perfected gradient
c = c.replace(
    /span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-600 block pr-4"/,
    `span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-200 via-primary to-primary-dark dark:from-primary-200 dark:via-primary dark:to-primary block pr-4"`
);

// Underline text
c = c.replace(
    /p className="text-lg md:text-2xl text-zinc-600 dark:text-zinc-600\/90 dark:text-zinc-400\/90 max-w-2xl mx-auto font-medium leading-relaxed mb-8 tracking-tight"/,
    `p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed mb-8 tracking-tight"`
);

// Background below Perfected
c = c.replace(
    /Link href="\/apply-landlord" className="group relative flex items-center justify-center h-14 md:h-16 px-8 md:px-10 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black font-black text-lg transition-all hover:scale-105 shadow-\[0_0_40px_rgba\(16,185,129,0\.3\)\] hover:shadow-\[0_0_60px_rgba\(16,185,129,0\.5\)\] overflow-hidden"/,
    `Link href="/apply-landlord" className="group relative flex items-center justify-center h-14 md:h-16 px-8 md:px-10 rounded-full bg-primary text-primary-foreground font-black text-lg transition-all hover:scale-105 hover:bg-primary-dark shadow-[0_0_40px_rgba(109,152,56,0.3)] hover:shadow-[0_0_60px_rgba(109,152,56,0.5)] overflow-hidden"`
);

// Find Scroll to explore
c = c.replace(
    /span className="text-\[9px\] md:text-\[10px\] font-black uppercase tracking-\[0\.3em\] text-zinc-400 dark:text-zinc-500"/,
    `span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground"`
);
c = c.replace(
    /div className="w-\[1px\] h-6 md:h-10 bg-gradient-to-b from-emerald-500\/50 to-transparent"/,
    `div className="w-[1px] h-6 md:h-10 bg-gradient-to-b from-primary/50 to-transparent"`
);


// Replace any straggling emerald text classes on the rest of the page (for cohesion)
c = c.replace(/text-emerald-600 dark:text-emerald-400/g, 'text-primary dark:text-primary-200');
c = c.replace(/from-emerald-500\/10/g, 'from-primary/10');
c = c.replace(/bg-emerald-500\/10 dark:bg-emerald-500\/20/g, 'bg-primary/10 dark:bg-primary/20');
c = c.replace(/bg-emerald-600 dark:bg-emerald-500/g, 'bg-primary');
c = c.replace(/from-emerald-900\/10/g, 'from-primary/10');
c = c.replace(/bg-emerald-300\/40/g, 'bg-primary/40');
c = c.replace(/bg-emerald-900\/20/g, 'bg-primary/20');
c = c.replace(/text-emerald/g, 'text-primary');

fs.writeFileSync('src/app/page.tsx', c);

console.log('done running iReside fix!');
