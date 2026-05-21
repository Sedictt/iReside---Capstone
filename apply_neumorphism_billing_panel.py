import os
import re

directories = [
    r"c:\Users\JV\Documents\GitHub\iReside\src\components\landlord",
]

def process_file(file_path):
    if not file_path.endswith("BillingOperationsPanel.tsx"):
        return
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Cards and Panels
    content = re.sub(r'\bbg-card border border-border\b', 'neumorphic-panel', content)
    content = re.sub(r'\bborder border-border bg-card\b', 'neumorphic-panel', content)
    content = re.sub(r'\bbg-background border border-border\b', 'neumorphic-panel', content)
    content = re.sub(r'\bborder border-border bg-background\b', 'neumorphic-panel', content)
    content = re.sub(r'\bbg-card text-foreground shadow-sm ring-1 ring-border\b', 'neumorphic-panel text-foreground', content)
    
    # Primary Buttons
    content = re.sub(r'\bbg-primary(.*?)text-primary-foreground\b', r'neumorphic-primary\1', content)
    content = re.sub(r'\btext-primary-foreground(.*?)bg-primary\b', r'neumorphic-primary\1', content)
    
    # Secondary Buttons / Extruded
    content = re.sub(r'\bhover:bg-muted/50\b', 'hover:neumorphic-inset', content)
    content = re.sub(r'\bhover:bg-muted\b', 'hover:neumorphic-inset', content)
    
    # Insets
    content = re.sub(r'\bbg-muted/40\b', 'neumorphic-inset', content)
    content = re.sub(r'\bbg-muted/30\b', 'neumorphic-inset', content)
    content = re.sub(r'\bbg-muted/50\b', 'neumorphic-inset', content)
    content = re.sub(r'\bbg-muted/10\b', 'neumorphic-inset', content)
    content = re.sub(r'\bbg-muted/20\b', 'neumorphic-inset', content)
    content = re.sub(r'\bbg-muted/5\b', 'neumorphic-inset', content)
    content = re.sub(r'\bbg-muted\b', 'neumorphic-inset', content)
    
    # Shadows and explicit borders
    content = re.sub(r'\bshadow-sm\b', '', content)
    content = re.sub(r'\bshadow-md\b', '', content)
    content = re.sub(r'\bshadow-lg\b', '', content)
    content = re.sub(r'\bshadow-xl\b', '', content)
    content = re.sub(r'\bshadow-2xl\b', '', content)
    content = re.sub(r'\bshadow-inner\b', '', content)
    content = re.sub(r'\bborder-2 border-background\b', '', content)
    content = re.sub(r'\bborder border-border\b', '', content)
    content = re.sub(r'\bborder-b border-border\b', 'border-b border-white/5', content)
    content = re.sub(r'\bborder border-white/[0-9]+\b', '', content)
    
    # Custom fix for property default panels
    content = re.sub(r'\brounded-3xl border p-8 overflow-hidden\b', 'rounded-3xl neumorphic-panel p-8 overflow-hidden', content)
    content = re.sub(r'\brounded-2xl border bg-card\b', 'rounded-2xl neumorphic-panel', content)
    
    # Segmented controls inside these panels usually have something like 'rounded-xl bg-muted'
    content = re.sub(r'\brounded-xl bg-muted\b', 'rounded-xl neumorphic-inset', content)
    
    # Action buttons that say INCLUDED, DIRECT etc might be bg-background
    content = re.sub(r'\brounded-lg bg-background\b', 'rounded-lg neumorphic-extruded', content)
    content = re.sub(r'\bbg-foreground text-background\b', 'neumorphic-primary', content)
    
    # Fix multiple spaces and bugs
    content = re.sub(r'  +', ' ', content)
    content = re.sub(r'hover: \b', '', content)
    content = re.sub(r'hover:\"', '"', content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            process_file(os.path.join(root, file))

print("Applied Neumorphism to BillingOperationsPanel successfully!")
