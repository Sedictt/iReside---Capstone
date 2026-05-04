
import fs from 'fs';

const content = fs.readFileSync('c:/Users/JV/Documents/GitHub/iReside/src/app/landlord/statistics/page.tsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
lines.forEach((line, i) => {
    // Count <div but not <div ... />
    const openDiv = (line.match(/<div(?![^>]*\/>)/g) || []).length;
    const closeDiv = (line.match(/<\/div>/g) || []).length;
    const openSec = (line.match(/<section(?![^>]*\/>)/g) || []).length;
    const closeSec = (line.match(/<\/section>/g) || []).length;
    
    balance += openDiv - closeDiv + openSec - closeSec;
    if (openDiv !== 0 || closeDiv !== 0 || openSec !== 0 || closeSec !== 0) {
        console.log(`Line ${i + 1}: Balance ${balance} (OpenDiv: ${openDiv}, CloseDiv: ${closeDiv}, OpenSec: ${openSec}, CloseSec: ${closeSec})`);
    }
});
console.log('Final Balance:', balance);
