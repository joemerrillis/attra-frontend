
import re

file_path = r"c:\Users\Joseph Merrill\attra\attra-frontend\src\types\api.d.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_block = False
block_indent = ""

for i, line in enumerate(lines):
    if skip_block:
        # Heuristic for closing brace: same indentation as block start + "};" or "}," or just "}"
        # Also handle if the line is just closing brace
        current_indent = len(line) - len(line.lstrip())
        content = line.strip()
        
        # If we are deeper, continue skipping
        if len(line) - len(line.lstrip()) > len(block_indent):
            continue
            
        # If we are at same level or less
        if content.startswith("}"):
            print(f"Closing block at line {i+1}: {line.strip()}")
            skip_block = False
            continue # Skip the closing line
        else:
            # If it's not a closing brace but same indent, maybe next property?
            # But in d.ts, properties are usually separated by } or ,.
            # Assuming standard formatting where block ends with } on same indent level.
            # If we hit something else at same level, maybe we missed the closing brace?
            # But let's assume valid formatted file.
            pass
            # aggressive skip: continue skipping until we see a closing brace at matched indent.
            if len(line) - len(line.lstrip()) == len(block_indent) and content.startswith("}"):
                 skip_block = False
                 continue
            
            # If we see `};` or `},`
            if content.startswith("}"):
                skip_block = False
                continue

    # valid start?
    if '"/api/internal/campaigns' in line:
        print(f"Removing block start at line {i+1}: {line.strip()}")
        skip_block = True
        # Capture indentation
        block_indent = line[:len(line) - len(line.lstrip())]
        continue

    if not skip_block:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("File processed and updated.")
