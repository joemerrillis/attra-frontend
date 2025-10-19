@echo off
REM Pull backend schema contracts
echo 📡 Pulling backend contracts...

if not defined VITE_API_URL (
    set API_URL=http://localhost:8080
) else (
    set API_URL=%VITE_API_URL%
)

if not exist "src\lib\contracts" mkdir "src\lib\contracts"
if not exist "src\types" mkdir "src\types"

REM Pull OpenAPI schema
curl -s "%API_URL%/schema/openapi.json" -o src/lib/contracts/openapi.json
echo ✅ OpenAPI schema pulled

REM Pull TypeScript types
curl -s "%API_URL%/schema/types.d.ts" -o src/types/backend.d.ts
echo ✅ TypeScript types pulled

REM Pull manifest
curl -s "%API_URL%/schema/manifest.json" -o src/lib/contracts/manifest.json
echo ✅ Manifest pulled

REM Generate typed API client
echo 🔧 Generating typed API client...
pnpm dlx openapi-typescript src/lib/contracts/openapi.json -o src/types/api.d.ts
echo ✅ API client types generated

echo 🎉 Contracts synced successfully!
