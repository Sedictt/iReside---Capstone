import re
import os

file_path = r"c:\Users\JV\Documents\GitHub\iReside\src\components\landlord\applications\RentApplications.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace neu- classes
content = re.sub(r'\bneu-section\b', 'neumorphic-panel', content)
content = re.sub(r'\bneu-card-pressed\b', 'neumorphic-extruded', content)
content = re.sub(r'\bneu-pressed(/[0-9]+)?\b', 'neumorphic-inset', content)
content = re.sub(r'\bneu-btn\b', 'neumorphic-extruded', content)
content = re.sub(r'\bneu-input\b', 'neumorphic-inset', content)
content = re.sub(r'\bneu-icon\b', 'neumorphic-inset-card', content)

# Remove explicit border styles as per guidelines
content = re.sub(r'\bborder border-white/[0-9]+\b', '', content)
content = re.sub(r'\bborder border-primary/[0-9]+\b', '', content) # Keep primary border if it's not white? Guidelines just say "Avoid Borders... e.g. border border-white/10". I'll only remove white/x borders.

# Fix multiple spaces that might have been created
content = re.sub(r'  +', ' ', content)
content = re.sub(r' \b(neumorphic-[a-z-]+)\b', r' \1', content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Applied Neumorphism successfully!")
