const fs = require('fs');
const path = 'src/components/landlord/applications/WalkInApplicationModal.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// Fix first backdrop at line 149 (index 148)
if (lines[148].includes('<motion.div')) {
    lines[148] = lines[148].replace('<motion.div', '<motion.button');
}
if (lines[152].includes('/>')) {
    lines[152] = lines[152].replace('/>', 'aria-label="Close Confirmation" />');
}
// We also need to change the closing tag if it's not self-closing, but here it is.

// Fix second backdrop at line 710 (index 709)
if (lines[709].includes('<motion.div')) {
    lines[709] = lines[709].replace('<motion.div', '<motion.button');
}
if (lines[715].includes('/>')) {
    lines[715] = lines[715].replace('/>', 'aria-label="Close Modal" />');
}

fs.writeFileSync(path, lines.join('\n'));
console.log('Applied accessibility fixes via line numbers');
