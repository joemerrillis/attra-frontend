#!/bin/bash

# Pull backend schema contracts
echo "📡 Pulling backend contracts..."

API_URL=${VITE_API_URL:-"http://localhost:8080"}

mkdir -p src/lib/contracts
mkdir -p src/types

# Pull OpenAPI schema
curl -s "$API_URL/schema/openapi.json" -o src/lib/contracts/openapi.json
echo "✅ OpenAPI schema pulled"

# Pull TypeScript types
curl -s "$API_URL/schema/types.d.ts" -o src/types/backend.d.ts
echo "✅ TypeScript types pulled"

# Pull manifest
curl -s "$API_URL/schema/manifest.json" -o src/lib/contracts/manifest.json
echo "✅ Manifest pulled"

# Generate typed API client
echo "🔧 Generating typed API client..."
pnpm dlx openapi-typescript src/lib/contracts/openapi.json -o src/types/api.d.ts
echo "✅ API client types generated"

echo "🎉 Contracts synced successfully!"
