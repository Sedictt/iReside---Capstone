const fs = require('fs');

function refactorFile(path, patterns) {
    let content = fs.readFileSync(path, 'utf8');
    let original = content;
    
    for (const { search, replace } of patterns) {
        content = content.replace(search, replace);
    }
    
    if (content !== original) {
        fs.writeFileSync(path, content);
        console.log(`Refactored ${path}`);
    } else {
        console.log(`No changes needed for ${path}`);
    }
}

// DigitalSigner.tsx patterns
const digitalSignerPatterns = [
    {
        search: /setSignatures\(\[\.\.\.signatures, (\w+)\]\)/g,
        replace: 'setSignatures(prev => [...prev, $1])'
    },
    {
        search: /setSignatures\(signatures\.map\((.*)\)\)/g,
        replace: 'setSignatures(prev => prev.map($1))'
    },
    {
        search: /setSignatures\(signatures\.filter\((.*)\)\)/g,
        replace: 'setSignatures(prev => prev.filter($1))'
    },
    // Backdrop fixes
    {
        search: /<motion\.div\s+\n\s+initial={{ opacity: 0 }}\n\s+animate={{ opacity: 1 }}\n\s+exit={{ opacity: 0 }}\n\s+onClick={() => setIsSidebarOpen\(false\)}\n\s+className="fixed inset-0 bg-black\/60 backdrop-blur-sm z-40 md:hidden"\n\s+\/>/g,
        replace: `<motion.button 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden cursor-default"
              aria-label="Close Sidebar"
            />`
    },
    {
        search: /<motion\.div\s+\n\s+initial={{ opacity: 0 }}\n\s+animate={{ opacity: 1 }}\n\s+exit={{ opacity: 0 }}\n\s+onClick={() => setShowConfirmation\(false\)}\n\s+className="absolute inset-0 bg-black\/80 backdrop-blur-md"\n\s+\/>/g,
        replace: `<motion.button 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmation(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-default"
              aria-label="Close Confirmation"
            />`
    }
];

// WalkInApplicationModal.tsx patterns
const walkInModalPatterns = [
    {
        search: /setLeaseData\(\{\s*\.\.\.leaseData,\s*(.*)\s*\}\)/g,
        replace: 'setLeaseData(prev => ({ ...prev, $1 }))'
    },
    {
        search: /setPaymentData\(\{\s*\n\s*\.\.\.paymentData,\s*\n\s*(.*):\s*\{\s*\.\.\.paymentData\.(.*),\s*(.*)\s*\},\s*\n\s*\}\)/g,
        replace: 'setPaymentData(prev => ({ ...prev, $1: { ...prev.$1, $3 } }))'
    }
];

refactorFile('src/components/shared/DigitalSigner/DigitalSigner.tsx', digitalSignerPatterns);
refactorFile('src/components/landlord/applications/WalkInApplicationModal.tsx', walkInModalPatterns);
