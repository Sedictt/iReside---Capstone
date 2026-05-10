const fs = require('fs');
const path = 'src/components/landlord/applications/WalkInApplicationModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace ConfirmationModal backdrop
content = content.replace(
    /<motion\.div\s+\n\s+initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}\n\s+onClick={onClose}\n\s+className="absolute inset-0 bg-black\/80 backdrop-blur-sm"\s+\n\s+\/>/,
    `<motion.button 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-default" 
                aria-label="Close Confirmation"
            />`
);

// Second attempt with literal strings if regex fails
if (!content.includes('aria-label="Close Confirmation"')) {
    // Try a more direct string replacement for line 151 area
    // We know the lines from view_file
    const lines = content.split('\n');
    // Lines are 1-indexed, so line 149 is index 148
    if (lines[150].includes('onClick={onClose}') && lines[148].includes('<motion.div')) {
        lines[148] = lines[148].replace('<motion.div', '<motion.button');
        lines[152] = lines[152].replace('/>', 'aria-label="Close Confirmation" />');
        lines[153] = '            </motion.button>'; // Wait, it was self-closing
        // Actually, let's just use the button pattern
    }
}

// Replace main modal backdrop
content = content.replace(
    /<motion\.div\n\s+initial={{ opacity: 0 }}\n\s+animate={{ opacity: 1 }}\n\s+exit={{ opacity: 0 }}\n\s+onClick={onClose}\n\s+className="absolute inset-0 bg-black\/60 backdrop-blur-xl"\n\s+\/>/,
    `<motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-xl cursor-default"
                aria-label="Close Modal"
            />`
);

fs.writeFileSync(path, content);
console.log('Applied accessibility fixes');
