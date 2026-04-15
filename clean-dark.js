const fs = require('fs');

let c = fs.readFileSync('src/app/page.tsx', 'utf8');

c = c.replace(/color: "from-teal-500\/20"/, 'color: "from-teal-500/20 dark:from-teal-500/10"');
c = c.replace(/color: "from-zinc-500\/20"/, 'color: "from-zinc-500/20 dark:from-zinc-500/10"');
c = c.replace(/bg-zinc-50 dark:border-white\/10 dark:bg-white\/\[0\.02\]/g, 'bg-muted border-border');
c = c.replace(/text-zinc-900 dark:text-white/g, 'text-foreground');
c = c.replace(/hover:bg-zinc-100 dark:hover:bg-white\/\[0\.08\]/g, 'hover:bg-muted/80');
c = c.replace(/hover:border-zinc-300 dark:hover:border-emerald-500\/30 dark:hover:border-white\/20/g, 'hover:border-primary/30');
c = c.replace(/text-zinc-400 dark:text-zinc-500 dark:text-white\/50 group-hover:text-primary dark:text-primary-200/g, 'text-muted-foreground group-hover:text-primary');
c = c.replace(/from-emerald-500\/20 dark:from-primary\/10/g, 'from-primary/10');
c = c.replace(/dark:drop-shadow-2xl/g, 'drop-shadow-2xl dark:drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)]');
c = c.replace(/bg-zinc-50 dark:bg-\[\#0A0A0B\]/g, 'bg-background');
c = c.replace(/text-zinc-600 dark:text-zinc-400/g, 'text-muted-foreground');
c = c.replace(/border-zinc-200 bg-white\/80 dark:border-white\/10 dark:bg-zinc-950\/80/g, 'border-border bg-card');
c = c.replace(/hover:border-emerald-500\/30 dark:hover:border-white\/20/g, 'hover:border-primary/50');
c = c.replace(/bg-zinc-100 border border-zinc-200 dark:bg-white\/\[0\.03\] dark:border-white\/10/g, 'bg-muted border border-border');
c = c.replace(/text-zinc-400 dark:text-zinc-500/g, 'text-muted-foreground');
c = c.replace(/text-zinc-400 dark:text-white\/30/g, 'text-muted-foreground');
c = c.replace(/border-t border-zinc-200 dark:border-white\/10/g, 'border-t border-border');
c = c.replace(/bg-white dark:bg-\[\#0A0A0B\]/g, 'bg-background');
c = c.replace(/via-white dark:via-\[\#0A0A0B\]/g, 'via-background');
c = c.replace(/to-white dark:to-\[\#0A0A0B\]/g, 'to-background');
c = c.replace(/text-white dark:text-black/g, 'text-primary-foreground');
c = c.replace(/bg-zinc-300 dark:bg-zinc-700/g, 'bg-muted-foreground/30');

// Features text that got stranded
c = c.replace(/bg-zinc-50 border-zinc-200/g, 'bg-muted border-border');
c = c.replace(/border-border bg-card backdrop-blur-2xl p-8 md:p-16 flex flex-col justify-between overflow-hidden group shadow-\[0_0_50px_rgba\(0,0,0,0\.5\)\] transition-all hover:border-emerald-500\/30 dark:hover:border-white\/20/g, 
  'border-border bg-card backdrop-blur-2xl p-8 md:p-16 flex flex-col justify-between overflow-hidden group shadow-xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all hover:border-primary/50');

c = c.replace(/shadow-\[0_0_80px_rgba\(16,185,129,0\.3\)\] hover:shadow-\[0_0_100px_rgba\(16,185,129,0\.5\)\]/g, 
  'shadow-[0_0_80px_rgba(109,152,56,0.3)] hover:shadow-[0_0_100px_rgba(109,152,56,0.5)]');
c = c.replace(/text-zinc-600\/90 dark:text-zinc-400\/90/g, 'text-muted-foreground');
c = c.replace(/via-background to-background/g, 'via-background dark:via-background-dark to-background dark:to-background-dark');
c = c.replace(/bg-background/g, 'bg-background dark:bg-background-dark'); // Since next-themes doesn't implicitly fix background unless the root does it, actually wait root does it.
// Revert
c = c.replace(/bg-background dark:bg-background-dark/g, 'bg-background');

fs.writeFileSync('src/app/page.tsx', c);
console.log('done running clean dark!');
