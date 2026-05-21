
import re
import os

path = r'c:\Users\JV\Documents\GitHub\iReside\src\components\landlord\applications\RentApplications.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace legacy classes
replacements = [
    (r'bg-card/50', 'neu-section'),
    (r'bg-card/80', 'neu-section'),
    (r'bg-card', 'neu-section'),
    (r'bg-background/50', 'neu-card-pressed'),
    (r'bg-background', 'neu-card-pressed'),
    (r'bg-muted/30', 'neu-pressed'),
    (r'bg-muted', 'neu-pressed'),
    (r'shadow-(?:sm|lg|xl|2xl)', ''),
    (r'border-border', 'border-white/5'),
    (r'text-foreground', 'text-white'),
    (r'text-muted-foreground', 'text-neutral-400'),
    (r'hover:bg-muted', 'hover:bg-white/5'),
    (r'hover:bg-card', 'hover:neu-card-raised'),
]

for old, new in replacements:
    content = re.sub(old, new, content)

# Specific fix for buttons that should be neu-btn
# <button className="... bg-primary ... shadow-lg shadow-primary/20 ..."
def button_replacer(match):
    s = match.group(0)
    if 'bg-primary' in s and 'neu-btn' not in s:
        s = s.replace('className="', 'className="neu-btn ')
    return s

content = re.sub(r'<button\s+[^>]*className="[^"]+"', button_replacer, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied bulk neumorphic replacements to RentApplications.tsx")
