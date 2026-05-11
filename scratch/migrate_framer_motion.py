import os
import re

def migrate_framer_motion(directory):
    pattern = re.compile(r'import\s+\{\s*([^}]*?)\bmotion\b([^}]*?)\s*\}\s*from\s*["\']framer-motion["\']', re.MULTILINE)
    
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.next' in dirs:
            dirs.remove('.next')
            
        for file in files:
            if file.endswith(('.tsx', '.ts', '.jsx', '.js')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = pattern.sub(r'import { \1m as motion\2 } from "framer-motion"', content)
                    
                    if new_content != content:
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Migrated: {path}")
                except Exception as e:
                    print(f"Error processing {path}: {e}")

if __name__ == "__main__":
    migrate_framer_motion('C:\\Users\\JV\\Documents\\GitHub\\iReside\\src')
