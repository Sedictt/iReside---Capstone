import os
import re

directories = [
    r"c:\Users\JV\Documents\GitHub\iReside\src\app\landlord\tenants",
    r"c:\Users\JV\Documents\GitHub\iReside\src\components\landlord\tenants",
]

def process_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Cards and Panels
    content = re.sub(r'\bbg-card border border-border\b', 'neumorphic-panel', content)
    content = re.sub(r'\bborder border-border bg-card\b', 'neumorphic-panel', content)
    content = re.sub(r'\bbg-background border border-border\b', 'neumorphic-panel', content)
    content = re.sub(r'\bborder border-border bg-background\b', 'neumorphic-panel', content)
    
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
    content = re.sub(r'\bbg-muted\b', 'neumorphic-inset', content)
    
    # Shadows and explicit borders
    content = re.sub(r'\bshadow-sm\b', '', content)
    content = re.sub(r'\bshadow-md\b', '', content)
    content = re.sub(r'\bshadow-lg\b', '', content)
    content = re.sub(r'\bshadow-inner\b', '', content)
    content = re.sub(r'\bborder-2 border-background\b', '', content)
    content = re.sub(r'\bborder border-border\b', '', content)
    content = re.sub(r'\bborder-b border-border\b', 'border-b border-white/5', content) # keep simple bottom borders for layout if needed
    
    # Fix multiple spaces
    content = re.sub(r'  +', ' ', content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith(".tsx"):
                process_file(os.path.join(root, file))

print("Applied Neumorphism to tenants successfully!")
