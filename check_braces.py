
file_path = r"c:\Users\Joseph Merrill\attra\attra-frontend\src\types\api.d.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

balance = 0
for i, line in enumerate(lines):
    for char in line:
        if char == '{':
            balance += 1
        elif char == '}':
            balance -= 1
    
    if balance < 0:
        print(f"Brace mismatch (negative balance) at line {i+1}: {line.strip()}")
        break

print(f"Final brace balance: {balance}")
