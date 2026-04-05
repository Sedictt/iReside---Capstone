
const fs = require("fs");
let content = fs.readFileSync("src/components/landlord/visual-planner/VisualBuilder.tsx", "utf-8");

content = content.replace(/className="flex-1 relative bg-background-dark overflow-hidden flex flex-col"/g, `className="flex-1 relative bg-background-light dark:bg-background-dark overflow-hidden flex flex-col"`);
content = content.replace(/bg-background-dark \$\{styles\.bgGridPattern\}/g, `bg-slate-50 dark:bg-background-dark \${styles.bgGridPattern}`);

fs.writeFileSync("src/components/landlord/visual-planner/VisualBuilder.tsx", content);

