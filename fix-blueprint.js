const fs = require('fs');
const content = fs.readFileSync('src/components/landlord/visual-planner/VisualBuilder.tsx', 'utf-8');

let newContent = content;

// Handle hardcoded blueprint area backgrounds
newContent = newContent.replace(/bg-slate-800\/30 border border-slate-700\/50/g, 'bg-slate-100/50 dark:bg-slate-800/30 border border-slate-300/50 dark:border-slate-700/50');
newContent = newContent.replace(/text-[\]\w\/]+ font-black tracking-.* text-slate-500\/10/g, (match) => {
    return match.replace('text-slate-500/10', 'text-slate-400/10 dark:text-slate-500/10');
});

// Handle Unit grid rendering (ghost units and drawn units)
// For Ghost
newContent = newContent.replace(/bg-slate-800\/70/g, 'bg-white/80 dark:bg-slate-800/70');
newContent = newContent.replace(/border-slate-500/g, 'border-slate-400 dark:border-slate-500');
newContent = newContent.replace(/border-slate-600/g, 'border-slate-300 dark:border-slate-600');
newContent = newContent.replace(/bg-slate-800 z-10/g, 'bg-white dark:bg-slate-800 z-10');
newContent = newContent.replace(/bg-slate-600/g, 'bg-slate-300 dark:bg-slate-600');
newContent = newContent.replace(/text-slate-200/g, 'text-slate-800 dark:text-slate-200');
newContent = newContent.replace(/bg-slate-900/g, 'bg-slate-50 dark:bg-slate-900');
newContent = newContent.replace(/bg-slate-400\/50/g, 'bg-slate-300/50 dark:bg-slate-400/50');
newContent = newContent.replace(/text-slate-300/g, 'text-slate-600 dark:text-slate-300');
newContent = newContent.replace(/bg-slate-700\/30/g, 'bg-slate-200/50 dark:bg-slate-700/30');

// Additional matches for actual Units (not just ghosts)
newContent = newContent.replace(/text-slate-400/g, 'text-slate-500 dark:text-slate-400');
newContent = newContent.replace(/text-slate-500/g, 'text-slate-600 dark:text-slate-500');
newContent = newContent.replace(/bg-slate-700/g, 'bg-slate-200 dark:bg-slate-700');
newContent = newContent.replace(/border-slate-700/g, 'border-slate-300 dark:border-slate-700');

fs.writeFileSync('src/components/landlord/visual-planner/VisualBuilder.tsx', newContent);
