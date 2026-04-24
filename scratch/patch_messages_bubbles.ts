
import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/app/landlord/messages/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update other occurrences of displayContact.avatar rendering
const bubbleSearch = '<img src={displayContact.avatar} className="h-8 w-8 shrink-0 rounded-full border border-border dark:border-white/10" alt="avatar" />';
const bubbleReplace = `<div 
                                                        className="h-8 w-8 shrink-0 rounded-full border border-border dark:border-white/10 overflow-hidden"
                                                        style={{ backgroundColor: displayContact.avatarBgColor || '#171717' }}
                                                    >
                                                        <img src={displayContact.avatar} className="h-full w-full object-cover" alt="avatar" />
                                                    </div>`;

if (content.includes(bubbleSearch)) {
    content = content.replace(new RegExp(bubbleSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), bubbleReplace);
    console.log('Updated bubble avatars');
}

fs.writeFileSync(filePath, content);
console.log('File updated successfully');
