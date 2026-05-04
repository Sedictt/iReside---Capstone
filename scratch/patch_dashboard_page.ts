
import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/app/landlord/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update PaymentListItem type
content = content.replace(
    '    avatar: string | null;',
    '    avatar: string | null;\n    avatarBgColor: string | null;'
);

// 2. Update PaymentCard rendering
content = content.replace(
    '                    <img src={avatar || fallbackAvatar} alt={tenant} className="h-12 w-12 rounded-full border-2 border-background object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-110" />',
    `                    <div 
                        className="h-12 w-12 rounded-full border-2 border-background overflow-hidden grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-110"
                        style={{ backgroundColor: (payment as any).avatarBgColor || '#171717' }}
                    >
                        <img src={avatar || fallbackAvatar} alt={tenant} className="h-full w-full object-cover" />
                    </div>`
);

// 3. Update Quick Action Popout rendering
content = content.replace(
    '                                        <img \n                                            src={selectedActionPayment.avatar || FALLBACK_AVATAR} \n                                            alt={selectedActionPayment.tenant} \n                                            className="h-full w-full rounded-full border-4 border-primary/20 object-cover"\n                                        />',
    `                                        <div 
                                            className="h-full w-full rounded-full border-4 border-primary/20 overflow-hidden"
                                            style={{ backgroundColor: (selectedActionPayment as any).avatarBgColor || '#171717' }}
                                        >
                                            <img 
                                                src={selectedActionPayment.avatar || FALLBACK_AVATAR} 
                                                alt={selectedActionPayment.tenant} 
                                                className="h-full w-full object-cover"
                                            />
                                        </div>`
);

fs.writeFileSync(filePath, content);
console.log('LandlordDashboard page updated successfully');
