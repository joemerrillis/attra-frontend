
import re

file_path = r"c:\Users\Joseph Merrill\attra\attra-frontend\src\types\api.d.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_block = False
block_indent = ""

# Definition of start of a block to remove
# Matches: "    "/api/internal/campaigns...": {"
start_pattern = re.compile(r'^(\s+)"/api/internal/campaigns[^"]*":\s*\{')

for line in lines:
    if skip_block:
        # Check if line is the closing brace of the block.
        # It should have the same indentation as the start.
        if line.startswith(block_indent + "};"):
            skip_block = False
            continue # Skip the closing line too
        elif line.startswith(block_indent + "},"): # In case of comma
             skip_block = False
             continue
        else:
            continue # Skip content lines

    match = start_pattern.match(line)
    if match:
        print(f"Removing block: {line.strip()}")
        skip_block = True
        block_indent = match.group(1)
        continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("File processed and updated.")
