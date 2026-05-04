
import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/app/landlord/messages/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update mapping fallback
if (content.includes('avatar: FALLBACK_AVATAR,')) {
    content = content.replace(
        'avatar: FALLBACK_AVATAR,', 
        'avatar: FALLBACK_AVATAR,\n        avatarBgColor: null,'
    );
    console.log('Updated fallback mapping');
}

// Update conversation mapping
if (content.includes('avatar: other?.avatarUrl || FALLBACK_AVATAR,')) {
    content = content.replace(
        'avatar: other?.avatarUrl || FALLBACK_AVATAR,', 
        'avatar: other?.avatarUrl || FALLBACK_AVATAR,\n            avatarBgColor: other?.avatarBgColor || null,'
    );
    console.log('Updated conversation mapping');
}

// Update sidebar rendering
if (content.includes('src={contact.avatar}')) {
    content = content.replace(
        '<img src={contact.avatar} alt={contact.name} className="h-12 w-12 rounded-full border border-border object-cover dark:border-white/10" />',
        `<div 
                                            className="h-12 w-12 shrink-0 rounded-full border border-border dark:border-white/10 overflow-hidden"
                                            style={{ backgroundColor: contact.avatarBgColor || '#171717' }}
                                        >
                                            <img src={contact.avatar} alt={contact.name} className="h-full w-full object-cover" />
                                        </div>`
    );
    console.log('Updated sidebar rendering');
}

// Update active header rendering
if (content.includes('src={displayContact.avatar}')) {
    content = content.replace(
        '<img src={displayContact.avatar} alt={displayContact.name} className="h-10 w-10 rounded-full border border-border object-cover dark:border-white/10" />',
        `<div 
                            className="h-10 w-10 rounded-full border border-border dark:border-white/10 overflow-hidden"
                            style={{ backgroundColor: displayContact.avatarBgColor || '#171717' }}
                        >
                            <img src={displayContact.avatar} alt={displayContact.name} className="h-full w-full object-cover" />
                        </div>`
    );
    console.log('Updated active header rendering');
}

fs.writeFileSync(filePath, content);
console.log('File updated successfully');
