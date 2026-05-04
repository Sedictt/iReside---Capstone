
import fs from 'fs';

const content = fs.readFileSync('c:/Users/JV/Documents/GitHub/iReside/src/app/landlord/statistics/page.tsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
lines.forEach((line, i) => {
    const open = (line.match(/<div/g) || []).length;
    const close = (line.match(/<\/div/g) || []).length;
    const openSec = (line.match(/<section/g) || []).length;
    const closeSec = (line.match(/<\/section/g) || []).length;
    
    balance += open - close + openSec - closeSec;
    if (open !== 0 || close !== 0 || openSec !== 0 || closeSec !== 0) {
        console.log(`Line ${i + 1}: Balance ${balance} (Open: ${open}, Close: ${close}, OpenSec: ${openSec}, CloseSec: ${closeSec})`);
    }
});
console.log('Final Balance:', balance);
