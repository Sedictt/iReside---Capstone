
import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/landlord/dashboard/ContactsSidebar.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update ChatUser interface
content = content.replace(
    '    avatar: string;',
    '    avatar: string;\n    avatarBgColor: string | null;'
);

// 2. Update mapConversationToUser
content = content.replace(
    '            avatar: other?.avatarUrl || FALLBACK_AVATAR,',
    '            avatar: other?.avatarUrl || FALLBACK_AVATAR,\n            avatarBgColor: other?.avatarBgColor || null,'
);

// 3. Update Sidebar rendering (messages list)
content = content.replace(
    '                                            <img\n                                                src={msg.avatar}\n                                                alt={msg.name}\n                                                className="h-10 w-10 rounded-full border-2 border-background object-cover"\n                                            />',
    `                                            <div 
                                                className="h-10 w-10 rounded-full border-2 border-background overflow-hidden"
                                                style={{ backgroundColor: msg.avatarBgColor || '#171717' }}
                                            >
                                                <img
                                                    src={msg.avatar}
                                                    alt={msg.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>`
);

// 4. Update Chatbox Header rendering
content = content.replace(
    '<img src={chat.avatar} alt={chat.name} className="h-8 w-8 rounded-full border border-border object-cover dark:border-white/10" />',
    `<div 
                                            className="h-8 w-8 rounded-full border border-border dark:border-white/10 overflow-hidden"
                                            style={{ backgroundColor: chat.avatarBgColor || '#171717' }}
                                        >
                                            <img src={chat.avatar} alt={chat.name} className="h-full w-full object-cover" />
                                        </div>`
);

// 5. Update ContactCardProps and ContactCard
content = content.replace(
    '    avatar: string;',
    '    avatar: string;\n    avatarBgColor: string | null;'
);

content = content.replace(
    'function ContactCard({ name, unit, avatar, status, isExpanded }: ContactCardProps) {',
    'function ContactCard({ name, unit, avatar, avatarBgColor, status, isExpanded }: ContactCardProps) {'
);

content = content.replace(
    '                <img\n                    src={avatar}\n                    alt={name}\n                    className="h-10 w-10 rounded-full border-2 border-background object-cover shadow-sm transition-transform duration-300 group-hover:scale-105"\n                />',
    `                <div 
                    className="h-10 w-10 rounded-full border-2 border-background overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: avatarBgColor || '#171717' }}
                >
                    <img
                        src={avatar}
                        alt={name}
                        className="h-full w-full object-cover"
                    />
                </div>`
);

// 6. Update ContactCard usage in the loop
content = content.replace(
    '                                        avatar={contact.avatar}',
    '                                        avatar={contact.avatar}\n                                        avatarBgColor={contact.avatarBgColor}'
);

fs.writeFileSync(filePath, content);
console.log('ContactsSidebar.tsx updated successfully');
