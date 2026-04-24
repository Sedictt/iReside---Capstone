
import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/landlord/dashboard/PaymentModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update PaymentListItem interface
content = content.replace(
    '    avatar: string | null;',
    '    avatar: string | null;\n    avatarBgColor?: string | null;'
);

// 2. Update List Area rendering
content = content.replace(
    '                                                <img src={payment.avatar || FALLBACK_AVATAR} alt={payment.tenant} className="h-14 w-14 rounded-full border-2 border-background object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-110" />',
    `                                                <div 
                                                    className="h-14 w-14 rounded-full border-2 border-background overflow-hidden grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-110"
                                                    style={{ backgroundColor: payment.avatarBgColor || '#171717' }}
                                                >
                                                    <img src={payment.avatar || FALLBACK_AVATAR} alt={payment.tenant} className="h-full w-full object-cover" />
                                                </div>`
);

// 3. Update Secondary Action Popout rendering
content = content.replace(
    '                                                    <img \n                                                        src={selectedActionPayment.avatar || FALLBACK_AVATAR} \n                                                        alt={selectedActionPayment.tenant} \n                                                        className="h-full w-full rounded-full border-4 border-primary/20 object-cover shadow-2xl shadow-primary/10"\n                                                    />',
    `                                                    <div 
                                                        className="h-full w-full rounded-full border-4 border-primary/20 overflow-hidden shadow-2xl shadow-primary/10"
                                                        style={{ backgroundColor: selectedActionPayment.avatarBgColor || '#171717' }}
                                                    >
                                                        <img 
                                                            src={selectedActionPayment.avatar || FALLBACK_AVATAR} 
                                                            alt={selectedActionPayment.tenant} 
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>`
);

fs.writeFileSync(filePath, content);
console.log('PaymentModal.tsx updated successfully');
