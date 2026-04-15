const fs = require('fs');

let content = fs.readFileSync('src/app/page.tsx', 'utf-8');

// Replace dark colors with their responsive light counterparts
content = content.replace(/bg-\[#0A0A0B\] text-white/g, 'bg-white text-zinc-900 dark:bg-[#0A0A0B] dark:text-white');
content = content.replace(/bg-emerald-900\/20/g, 'bg-emerald-300/40 dark:bg-emerald-900/20');
content = content.replace(/bg-zinc-800\/30/g, 'bg-zinc-300/50 dark:bg-zinc-800/30');
content = content.replace(/bg-\[#0A0A0B\]\/80 backdrop-blur-2xl/g, 'bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-2xl');
content = content.replace(/border-white\/\[0\.04\]/g, 'border-zinc-200 dark:border-white/[0.04]');
content = content.replace(/text-white\/95/g, 'text-zinc-900 dark:text-white/95');
content = content.replace(/ring-white\/10/g, 'ring-zinc-200 dark:ring-white/10');
content = content.replace(/border-white\/10 bg-white\/\[0\.02\]/g, 'border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.02]');
content = content.replace(/text-white transition-all hover:bg-white\/\[0\.08\] hover:border-white\/20/g, 'text-zinc-900 dark:text-white transition-all hover:bg-zinc-100 dark:hover:bg-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20');
content = content.replace(/text-white\/50/g, 'text-zinc-500 dark:text-white/50');
content = content.replace(/from-emerald-500\/10/g, 'from-emerald-500/20 dark:from-emerald-500/10');
content = content.replace(/text-emerald-400/g, 'text-emerald-600 dark:text-emerald-400');
content = content.replace(/text-teal-400/g, 'text-teal-600 dark:text-teal-400');
content = content.replace(/text-zinc-400/g, 'text-zinc-600 dark:text-zinc-400');
content = content.replace(/text-zinc-500/g, 'text-zinc-400 dark:text-zinc-500');
content = content.replace(/<span className="text-white block/g, '<span className="text-zinc-900 dark:text-white block');
content = content.replace(/text-zinc-400\/90/g, 'text-zinc-600/90 dark:text-zinc-400/90');
content = content.replace(/text-black font-black/g, 'text-white dark:text-black font-black');
content = content.replace(/bg-emerald-500/g, 'bg-emerald-600 dark:bg-emerald-500');
content = content.replace(/bg-\[#0A0A0B\] z-20 overflow-hidden/g, 'bg-zinc-50 dark:bg-[#0A0A0B] z-20 overflow-hidden');
content = content.replace(/text-white leading-tight/g, 'text-zinc-900 dark:text-white leading-tight');
content = content.replace(/border-white\/10 bg-zinc-950\/80/g, 'border-zinc-200 bg-white/80 dark:border-white/10 dark:bg-zinc-950/80');
content = content.replace(/hover:border-white\/20/g, 'hover:border-emerald-500/30 dark:hover:border-white/20');
content = content.replace(/bg-white\/\[0\.03\] border border-white\/10/g, 'bg-zinc-100 border border-zinc-200 dark:bg-white/[0.03] dark:border-white/10');
content = content.replace(/text-white mb-6/g, 'text-zinc-900 dark:text-white mb-6');
content = content.replace(/text-white\/30 pt-8 border-t border-white\/10/g, 'text-zinc-400 dark:text-white/30 pt-8 border-t border-zinc-200 dark:border-white/10');
content = content.replace(/border-t border-white\/10 bg-\[#0A0A0B\]/g, 'border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0A0A0B]');
content = content.replace(/mb-10 text-white/g, 'mb-10 text-zinc-900 dark:text-white');
content = content.replace(/bg-zinc-700/g, 'bg-zinc-300 dark:bg-zinc-700');
content = content.replace(/via-\[#0A0A0B\] to-\[#0A0A0B\]/g, 'via-white dark:via-[#0A0A0B] to-white dark:to-[#0A0A0B]');

// Wait there are a few missed text-white things
content = content.replace(/<span className="text-zinc-400 font-black/g, '<span className="text-zinc-600 dark:text-zinc-400 font-black');

fs.writeFileSync('src/app/page.tsx', content);

console.log('done');
