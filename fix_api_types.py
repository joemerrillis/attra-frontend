
import os

file_path = r"c:\Users\Joseph Merrill\attra\attra-frontend\src\types\api.d.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Ranges to remove (1-indexed in view_file, so 0-indexed in python)
# Range 1: 1460 to 1495
# Range 2: 3147 to 3182
# Note: When deleting, indices shift. Better to process ranges from bottom to top or just filter.

# 0-indexed: 1459 to 1495 (exclusive? inclusive?)
# Line 1460 in view_file is index 1459.
# Line 1495 in view_file is index 1494.
# So remove 1459 to 1495 (index 1459 to 1494 inclusive).
# Wait, let's verify context.
# Line 1459 in file is index 1458.
# Line 1460 in file is index 1459.

# Let's inspect the lines to be sure.
print(f"Line 1460 check: {lines[1459].strip()}")
print(f"Line 1495 check: {lines[1494].strip()}")
print(f"Line 3147 check: {lines[3146].strip()}")
print(f"Line 3182 check: {lines[3181].strip()}")

if "campaigns" not in lines[1459] and "campaigns" not in lines[3146]:
    print("Error: Lines do not match expectation. Aborting.")
    exit(1)

# Filter out lines
new_lines = []
for i, line in enumerate(lines):
    line_num = i + 1
    # Skip range 1: 1460-1495
    if 1460 <= line_num <= 1495:
        continue
    # Skip range 2: 3147-3182
    if 3147 <= line_num <= 3182:
        continue
    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("File updated.")
