# 📋 Backend API Requirements: GET /api/internal/team

**Date:** 2025-01-20
**Priority:** HIGH
**Issue:** Frontend getting "Team data not available" error

---

## The Error

```
Could not load full tenant data, using minimal tenant object: Error: Team data not available
```

**Location:** `src/contexts/AuthContext.tsx:95-99`

**Impact:**
- ⚠️ Tenant name shows "Loading..."
- ⚠️ No branding (logo, colors)
- ⚠️ Always defaults to "free" plan
- ⚠️ Console warning on every page load

---

## Flow Chart: How Frontend Gets Team/Tenant Data

```
1. User Logs In
   ↓
2. Supabase Auth Returns Session
   ↓
3. Check JWT app_metadata.tenant_id
   ↓
   ├─ No tenant_id? → User needs onboarding
   └─ Has tenant_id? → Continue
                       ↓
4. Call GET /api/internal/team
   ↓
   ├─ SUCCESS → Extract tenant data from team_members
   └─ FAIL → Fall back to minimal tenant object (THIS IS THE ERROR)
```

---

## The Critical API Call

### Request

**Endpoint:** `GET /api/internal/team`

**Method:** GET

**Headers:**
```http
Authorization: Bearer {supabase_jwt_token}
Content-Type: application/json
```

**Authentication:**
- Uses Supabase JWT from session
- Backend should extract `tenant_id` from JWT's `app_metadata.tenant_id`
- Should return team members for that tenant

**Query Parameters:** None (tenant_id comes from JWT)

---

## Expected Response Structure

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "team_members": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "user_id": "uuid",
      "display_name": "John Doe",
      "role": "owner",
      "permissions": {},
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",

      "tenants": {
        "id": "uuid",
        "name": "Acme Inc",
        "slug": "acme-inc",
        "branding": {
          "logo_url": "https://example.com/logo.png",
          "primary_color": "#4F46E5"
        },
        "plan_key": "free",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    }
  ]
}
```

---

## Field Requirements

### Top Level
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `team_members` | Array | ✅ Yes | Can be empty array, but must exist |

### team_members[] Object
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string (uuid) | ✅ Yes | Team member ID |
| `tenant_id` | string (uuid) | ✅ Yes | Tenant ID |
| `user_id` | string (uuid) | ✅ Yes | User ID (must match logged-in user) |
| `display_name` | string \| null | ✅ Yes | User's display name |
| `role` | enum | ✅ Yes | One of: "owner", "admin", "member", "viewer" |
| `permissions` | object | ✅ Yes | Any object, can be `{}` |
| `is_active` | boolean | ✅ Yes | Must be `true` for active users |
| `created_at` | string (ISO 8601) | ✅ Yes | |
| `updated_at` | string (ISO 8601) | ✅ Yes | |
| **`tenants`** | object | ✅ **CRITICAL** | **Nested tenant object - MUST be populated** |

### tenants Object (Nested)
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string (uuid) | ✅ Yes | Tenant ID |
| `name` | string | ✅ Yes | Tenant/company name |
| `slug` | string \| null | ✅ Yes | URL-friendly slug |
| `branding` | object \| null | ✅ Yes | Branding config (can be null) |
| `plan_key` | string | ✅ Yes | One of: "free", "pro", "enterprise" |
| `created_at` | string (ISO 8601) | ✅ Yes | |
| `updated_at` | string (ISO 8601) | ✅ Yes | |

### branding Object (Optional Fields)
| Field | Type | Notes |
|-------|------|-------|
| `logo_url` | string | URL to logo image |
| `logo` | string | Alternative logo field |
| `primary_color` | string | Hex color code (e.g., "#4F46E5") |
| `primaryColor` | string | Alternative naming |
| `secondary_color` | string | Hex color code |
| `secondaryColor` | string | Alternative naming |

---

## Frontend Code Logic

**File:** `src/contexts/AuthContext.tsx`

```typescript
// Line 80: Call team API
const { team_members } = await teamApi.list();

// Line 81: Find current user's team membership
const teamMember = team_members.find(
  tm => tm.user_id === userId && tm.is_active
);

// Line 83-93: Check if tenant data is present
if (teamMember?.tenants) {
  // ✅ SUCCESS: Use full tenant data
  setUser({...});
  setTenant(teamMember.tenants);
} else {
  // ❌ FAIL: Throw error
  throw new Error('Team data not available');
}
```

**What Frontend Does:**
1. Calls `GET /api/internal/team`
2. Finds team member where `user_id` matches current user AND `is_active = true`
3. Checks if `teamMember.tenants` exists
4. If exists → uses it as tenant data ✅
5. If missing → throws error and falls back to minimal tenant ❌

---

## What Causes the Error

### Scenario 1: Empty Array
```json
{
  "team_members": []
}
```
**Why:** No team member found for user
**Fix:** Ensure team_member row exists when tenant is created

---

### Scenario 2: Missing `tenants` Object
```json
{
  "team_members": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "tenant_id": "uuid"
      // ❌ MISSING: "tenants" object
    }
  ]
}
```
**Why:** Backend didn't join/include tenant data
**Fix:** Include nested tenant object via JOIN

---

### Scenario 3: `tenants` is `null`
```json
{
  "team_members": [
    {
      "id": "uuid",
      "tenants": null  // ❌ BAD
    }
  ]
}
```
**Why:** Tenant was deleted or join failed
**Fix:** Backend should never return null tenants for active members

---

### Scenario 4: User Inactive
```json
{
  "team_members": [
    {
      "user_id": "correct-id",
      "is_active": false  // ❌ Inactive
    }
  ]
}
```
**Why:** User was deactivated
**Fix:** Ensure `is_active = true` for valid users

---

### Scenario 5: User ID Mismatch
```json
{
  "team_members": [
    {
      "user_id": "wrong-id",  // ❌ Doesn't match
      "is_active": true
    }
  ]
}
```
**Why:** Backend returned wrong user's team members
**Fix:** Filter by correct `user_id` from JWT

---

## Implementation Guide

### Step 1: Verify Endpoint Exists
```
✅ Endpoint: GET /api/internal/team
✅ Returns: 200 OK (not 404 or 500)
```

---

### Step 2: Extract tenant_id from JWT

```typescript
// Pseudocode
const token = req.headers.authorization.replace('Bearer ', '');
const decoded = jwt.verify(token, supabaseJwtSecret);
const tenantId = decoded.app_metadata.tenant_id;

if (!tenantId) {
  return res.status(400).json({ error: 'No tenant_id in JWT' });
}
```

---

### Step 3: Query Database with JOIN

```sql
SELECT
  tm.id,
  tm.tenant_id,
  tm.user_id,
  tm.display_name,
  tm.role,
  tm.permissions,
  tm.is_active,
  tm.created_at,
  tm.updated_at,

  -- Nested tenant data
  json_build_object(
    'id', t.id,
    'name', t.name,
    'slug', t.slug,
    'branding', t.branding,
    'plan_key', t.plan_key,
    'created_at', t.created_at,
    'updated_at', t.updated_at
  ) as tenants

FROM team_members tm
INNER JOIN tenants t ON tm.tenant_id = t.id
WHERE tm.tenant_id = $1
  AND tm.is_active = true
```

**Parameters:**
- `$1` = `tenantId` (from JWT)

---

### Step 4: Format Response

```typescript
const rows = await db.query(sql, [tenantId]);

const response = {
  team_members: rows.map(row => ({
    id: row.id,
    tenant_id: row.tenant_id,
    user_id: row.user_id,
    display_name: row.display_name,
    role: row.role,
    permissions: row.permissions || {},
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,

    // CRITICAL: Include nested tenant
    tenants: row.tenants || {
      id: row.tenant_id,
      name: row.tenant_name,
      slug: row.tenant_slug,
      branding: row.tenant_branding,
      plan_key: row.tenant_plan_key,
      created_at: row.tenant_created_at,
      updated_at: row.tenant_updated_at,
    }
  }))
};

return res.status(200).json(response);
```

---

## Testing

### Manual Test with cURL

```bash
# Get JWT token from browser (DevTools → Application → Local Storage)
export JWT_TOKEN="your-jwt-token-here"

curl -X GET \
  https://api.attra.io/api/internal/team \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.'
```

**Expected Output:**
```json
{
  "team_members": [
    {
      "id": "...",
      "tenant_id": "...",
      "user_id": "...",
      "display_name": "John Doe",
      "role": "owner",
      "permissions": {},
      "is_active": true,
      "created_at": "...",
      "updated_at": "...",
      "tenants": {
        "id": "...",
        "name": "Acme Inc",
        "slug": "acme-inc",
        "branding": {
          "logo_url": "https://...",
          "primary_color": "#4F46E5"
        },
        "plan_key": "free",
        "created_at": "...",
        "updated_at": "..."
      }
    }
  ]
}
```

### Validation Checklist

- [ ] Response status is `200 OK`
- [ ] Response has `team_members` array
- [ ] Array is not empty (at least 1 team member)
- [ ] Team member has `user_id` matching JWT user
- [ ] Team member has `is_active: true`
- [ ] Team member has **`tenants` object** (not null)
- [ ] `tenants.name` is populated
- [ ] `tenants.plan_key` is valid ("free", "pro", or "enterprise")
- [ ] `tenants.branding` exists (can be null, but field should exist)

---

## Error Handling

### If tenant doesn't exist:
```json
{
  "error": "Tenant not found",
  "code": "TENANT_NOT_FOUND"
}
```
**Status:** `404 Not Found`

---

### If user not a member:
```json
{
  "error": "User is not a member of this tenant",
  "code": "NOT_MEMBER"
}
```
**Status:** `403 Forbidden`

---

### If no tenant_id in JWT:
```json
{
  "error": "No tenant_id in JWT metadata",
  "code": "NO_TENANT_ID"
}
```
**Status:** `400 Bad Request`

---

## Success Criteria

✅ Frontend stops showing "Could not load full tenant data" warning
✅ Tenant name displays correctly (not "Loading...")
✅ Branding (logo, colors) loads properly
✅ Correct plan_key is shown
✅ Console has no errors

---

## Questions?

Contact frontend team if you need:
- Example JWT token for testing
- Database schema details
- More context on the flow

---

**Generated:** 2025-01-20
**Frontend Repo:** attra-frontend
**Backend Endpoint:** `GET /api/internal/team`
