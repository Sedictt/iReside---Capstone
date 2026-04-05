const fs = require('fs');
let content = fs.readFileSync('src/components/landlord/visual-planner/VisualBuilder.tsx', 'utf-8');

content = content.replace(/bg-slate-800 relative shadow-sm/g, 'bg-white dark:bg-slate-800 relative shadow-sm');
content = content.replace(/bg-slate-800\/80/g, 'bg-black/5 dark:bg-slate-800/80');

// There is a 'bg-[#23242f] hover:bg-slate-800' inside the UnitStatus selection panel
content = content.replace(/bg-\[#23242f\] hover:bg-slate-800/g, 'bg-slate-100 dark:bg-[#23242f] hover:bg-slate-200 dark:hover:bg-slate-800');

// Fix border colors that are hardcoded to dark
content = content.replace(/border-slate-700\/50/g, 'border-slate-300 dark:border-slate-700/50');
content = content.replace(/border-slate-600/g, 'border-slate-300 dark:border-slate-600');
content = content.replace(/border-slate-500/g, 'border-slate-400 dark:border-slate-500');

// Fix the 'absolute inset-x-[18%] top-[14%] bottom-[18%] border border-slate-300 flex' from before
// We already did replace border-slate-300 in the earlier pass where we didn't add dark prefix correctly
// Let's just fix text colors generally
content = content.replace(/text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-400 dark:text-slate-400 dark:text-slate-300/g, 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300');
content = content.replace(/text-slate-600 dark:text-slate-400 dark:text-slate-400 dark:text-slate-300/g, 'text-slate-600 dark:text-slate-300');

fs.writeFileSync('src/components/landlord/visual-planner/VisualBuilder.tsx', content);
