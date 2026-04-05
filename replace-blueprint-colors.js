
const fs = require("fs");
let content = fs.readFileSync("src/components/landlord/visual-planner/VisualBuilder.tsx", "utf-8");

const replacements = [
    // Main blueprint background
    ["bg-slate-800/30 border border-slate-700/50 rounded-xl", "bg-slate-200/50 dark:bg-slate-800/30 border border-slate-300 dark:border-slate-700/50 rounded-xl"],
    // Watermark
    ["text-slate-500/10", "text-slate-500/20 dark:text-slate-500/10"],
    // Ghost blocks (isLiving)
    ["bg-slate-800/70 relative", "bg-white/80 dark:bg-slate-800/70 relative"],
    ["border-[2px] border-slate-500", "border-[2px] border-slate-400 dark:border-slate-500"],
    ["border border-slate-600", "border border-slate-300 dark:border-slate-600"],
    ["bg-slate-800 z-10 border-x-2 border-slate-500", "bg-black/5 dark:bg-slate-800 z-10 border-x-2 border-slate-400 dark:border-slate-500"],
    ["bg-slate-800 z-10 flex items-center justify-center border-x border-slate-500", "bg-black/5 dark:bg-slate-800 z-10 flex items-center justify-center border-x border-slate-400 dark:border-slate-500"],
    ["w-full h-px bg-slate-600", "w-full h-px bg-slate-300 dark:bg-slate-600"],
    ["font-bold text-xs text-slate-200", "font-bold text-xs text-slate-700 dark:text-slate-200"],
    ["bg-slate-900", "bg-black/5 dark:bg-slate-900"],
    
    // Ghost paths
    ["w-full h-px bg-slate-400/50", "w-full h-px bg-slate-400/80 dark:bg-slate-400/50"],
    ["h-full w-px bg-slate-400/50", "h-full w-px bg-slate-400/80 dark:bg-slate-400/50"],
    ["h-[60%] w-px bg-slate-300 relative", "h-[60%] w-px bg-slate-400 dark:bg-slate-300 relative"],
    ["w-[60%] h-px bg-slate-300 relative", "w-[60%] h-px bg-slate-400 dark:bg-slate-300 relative"],
    ["w-full h-[60%] border border-slate-300", "w-full h-[60%] border border-slate-400 dark:border-slate-300"],
    ["h-full w-[60%] border border-slate-300", "h-full w-[60%] border border-slate-400 dark:border-slate-300"],
    
    ["bg-slate-700/30", "bg-slate-200/50 dark:bg-slate-700/30"],
    ["text-slate-300", "text-slate-400 dark:text-slate-300"],
    
    // Actual rendered units (lines 2224+)
    ["bg-slate-800/70 shadow-md", "bg-white/80 dark:bg-slate-800/70 shadow-md"],
    ["text-slate-200 truncate", "text-slate-700 dark:text-slate-200 truncate"],
];

for (let [oldStr, newStr] of replacements) {
    strPattern = oldStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    content = content.replace(new RegExp(strPattern, "g"), newStr);
}

fs.writeFileSync("src/components/landlord/visual-planner/VisualBuilder.tsx", content);

