# Text Element System - API Payload Reference

Complete reference for API payloads in the new text element system.

---

## Table of Contents

1. [Asset Generation Request](#asset-generation-request)
2. [Asset Generation Response](#asset-generation-response)
3. [Asset Type Specs](#asset-type-specs)
4. [Transformation Examples](#transformation-examples)
5. [Validation Rules](#validation-rules)

---

## Asset Generation Request

### New Structure (Preferred)

```json
POST /api/assets/generate

{
  "asset_type": "flyer",
  "message_theme": "Summer Sale",
  "locations": ["loc_abc123", "loc_def456"],
  "background_mode": "same",
  "background_id": "bg_xyz789",
  "base_url": "https://example.com",

  "text_elements": [
    {
      "type": "headline",
      "label": "Headline",
      "content": "50% Off Summer Sale!",
      "position": {
        "x": 170,
        "y": 726,
        "width": 2210,
        "height": null
      },
      "styling": {
        "fontSize": 153,
        "fontWeight": "bold",
        "textAlign": "center",
        "color": "#FFFFFF",
        "italic": false,
        "underline": false,
        "letterSpacing": 0,
        "lineSpacing": 10
      },
      "constraints": {
        "maxLength": 100,
        "required": true
      },
      "display_order": 0
    },
    {
      "type": "subheadline",
      "label": "Subheadline",
      "content": "This weekend only at our downtown location",
      "position": {
        "x": 170,
        "y": 1188,
        "width": 2210,
        "height": null
      },
      "styling": {
        "fontSize": 93,
        "fontWeight": "normal",
        "textAlign": "center",
        "color": "#FFFFFF",
        "italic": false,
        "underline": false,
        "letterSpacing": 0,
        "lineSpacing": 10
      },
      "constraints": {
        "maxLength": 150,
        "required": false
      },
      "display_order": 1
    },
    {
      "type": "cta",
      "label": "Call to Action",
      "content": "Scan to Shop Now",
      "position": {
        "x": 170,
        "y": 2383,
        "width": 2210,
        "height": null
      },
      "styling": {
        "fontSize": 93,
        "fontWeight": "bold",
        "textAlign": "center",
        "color": "#FFFFFF",
        "italic": false,
        "underline": true,
        "letterSpacing": 2,
        "lineSpacing": 10
      },
      "constraints": {
        "maxLength": 50,
        "required": true
      },
      "display_order": 2
    }
  ],

  "qr_position": {
    "x": 850,
    "y": 1283,
    "size": 850
  }
}
```

### Legacy Structure (Still Supported)

```json
POST /api/assets/generate

{
  "asset_type": "flyer",
  "message_theme": "Summer Sale",
  "locations": ["loc_abc123", "loc_def456"],
  "background_mode": "same",
  "background_id": "bg_xyz789",
  "base_url": "https://example.com",

  "headline": "50% Off Summer Sale!",
  "subheadline": "This weekend only at our downtown location",
  "cta": "Scan to Shop Now",

  "text_positions": {
    "headline": {
      "x": 170,
      "y": 726,
      "width": 2210,
      "height": "auto",
      "fontSize": 153,
      "fontWeight": "bold"
    },
    "subheadline": {
      "x": 170,
      "y": 1188,
      "width": 2210,
      "height": "auto",
      "fontSize": 93,
      "fontWeight": "normal"
    },
    "cta": {
      "x": 170,
      "y": 2383,
      "width": 2210,
      "height": "auto",
      "fontSize": 93,
      "fontWeight": "bold"
    },
    "qrCode": {
      "x": 850,
      "y": 1283,
      "size": 850
    }
  },

  "text_colors": {
    "headline": "#FFFFFF",
    "subheadline": "#FFFFFF",
    "cta": "#FFFFFF"
  }
}
```

---

## Asset Generation Response

```json
{
  "success": true,
  "message": "Assets generated successfully",
  "assets": [
    {
      "id": "asset_abc123",
      "location_id": "loc_abc123",
      "asset_type": "flyer",
      "message_theme": "Summer Sale",
      "qr_link_id": "qr_xyz789",
      "status": "completed",
      "file_url": "https://cdn.example.com/assets/asset_abc123.pdf",
      "thumbnail_url": "https://cdn.example.com/assets/asset_abc123_thumb.jpg",
      "created_at": "2025-11-11T12:34:56Z"
    },
    {
      "id": "asset_def456",
      "location_id": "loc_def456",
      "asset_type": "flyer",
      "message_theme": "Summer Sale",
      "qr_link_id": "qr_uvw012",
      "status": "completed",
      "file_url": "https://cdn.example.com/assets/asset_def456.pdf",
      "thumbnail_url": "https://cdn.example.com/assets/asset_def456_thumb.jpg",
      "created_at": "2025-11-11T12:34:57Z"
    }
  ]
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Headline is required",
    "CTA exceeds max length (55/50 characters)"
  ]
}
```

---

## Asset Type Specs

### Request

```http
GET /api/asset-types/flyer
```

### Response

```json
{
  "asset_type": "flyer",
  "display_name": "Flyer (8.5\" × 11\")",
  "width": 2550,
  "height": 3300,
  "aspect_ratio": "8.5:11",
  "min_font_size": 20,
  "max_font_size": 200,
  "min_text_width": 100,
  "min_text_height": 50,
  "min_letter_spacing": -5,
  "max_letter_spacing": 20,
  "min_line_spacing": 0,
  "max_line_spacing": 30,
  "min_qr_size": 200,
  "max_qr_size": 1200
}
```

### Example Specs for Different Asset Types

#### Business Card
```json
{
  "asset_type": "business_card",
  "display_name": "Business Card (3.5\" × 2\")",
  "width": 1050,
  "height": 600,
  "aspect_ratio": "3.5:2",
  "min_font_size": 16,
  "max_font_size": 80,
  "min_text_width": 50,
  "min_text_height": 30,
  "min_letter_spacing": -2,
  "max_letter_spacing": 10,
  "min_line_spacing": 0,
  "max_line_spacing": 15,
  "min_qr_size": 100,
  "max_qr_size": 400
}
```

#### Door Hanger
```json
{
  "asset_type": "door_hanger",
  "display_name": "Door Hanger (4\" × 10\")",
  "width": 1200,
  "height": 3000,
  "aspect_ratio": "4:10",
  "min_font_size": 20,
  "max_font_size": 150,
  "min_text_width": 100,
  "min_text_height": 50,
  "min_letter_spacing": -3,
  "max_letter_spacing": 15,
  "min_line_spacing": 0,
  "max_line_spacing": 25,
  "min_qr_size": 150,
  "max_qr_size": 800
}
```

---

## Transformation Examples

### Frontend → Backend Transformation

**Frontend (Before Transformation)**:
```json
{
  "tempId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "headline",
  "label": "Headline",
  "content": "Summer Sale",
  "position": {
    "x": 170,
    "y": 726,
    "width": 2210,
    "height": "auto"
  },
  "styling": {
    "fontSize": 153,
    "fontWeight": "bold",
    "textAlign": "center",
    "color": "#FFFFFF",
    "italic": false,
    "underline": false,
    "letterSpacing": 0,
    "lineSpacing": 10
  },
  "constraints": {
    "maxLength": 100,
    "required": true
  },
  "displayOrder": 0
}
```

**Backend (After Transformation)**:
```json
{
  "type": "headline",
  "label": "Headline",
  "content": "Summer Sale",
  "position": {
    "x": 170,
    "y": 726,
    "width": 2210,
    "height": null
  },
  "styling": {
    "fontSize": 153,
    "fontWeight": "bold",
    "textAlign": "center",
    "color": "#FFFFFF",
    "italic": false,
    "underline": false,
    "letterSpacing": 0,
    "lineSpacing": 10
  },
  "constraints": {
    "maxLength": 100,
    "required": true
  },
  "display_order": 0
}
```

**Changes**:
1. ❌ Removed `tempId` (client-only field)
2. ✅ Renamed `displayOrder` → `display_order` (snake_case)
3. ✅ Converted `height: "auto"` → `height: null`

---

## Validation Rules

### Frontend Validation (Before Sending)

```typescript
validateTextElements(elements: TextElement[]): {
  valid: boolean;
  errors: string[];
}
```

**Rules**:
1. **Headline Required**: At least one element with `type: 'headline'` and non-empty `content`
2. **Required Fields**: Elements with `constraints.required: true` must have `content.trim() !== ''`
3. **Max Length**: `content.length <= constraints.maxLength` (if defined)

**Examples**:

✅ Valid:
```json
[
  { "type": "headline", "content": "Hello", "constraints": { "required": true } },
  { "type": "subheadline", "content": "", "constraints": { "required": false } }
]
```

❌ Invalid - Missing Headline:
```json
[
  { "type": "subheadline", "content": "World", "constraints": { "required": false } }
]
// Error: "Headline is required"
```

❌ Invalid - Exceeds Max Length:
```json
[
  {
    "type": "headline",
    "content": "This is a very long headline that exceeds fifty characters",
    "constraints": { "maxLength": 50, "required": true }
  }
]
// Error: "Headline exceeds max length (57/50)"
```

❌ Invalid - Required Field Empty:
```json
[
  { "type": "headline", "content": "Hello", "constraints": { "required": true } },
  { "type": "cta", "content": "", "constraints": { "required": true } }
]
// Error: "Call to Action is required but empty"
```

### Backend Validation (Expected)

**Additional Rules** (Backend should enforce):
1. **Position Bounds**: `0 <= x < width`, `0 <= y < height`
2. **Font Size Range**: `min_font_size <= fontSize <= max_font_size`
3. **Letter Spacing Range**: `min_letter_spacing <= letterSpacing <= max_letter_spacing`
4. **Line Spacing Range**: `min_line_spacing <= lineSpacing <= max_line_spacing`
5. **QR Size Range**: `min_qr_size <= size <= max_qr_size`

---

## Field Reference

### text_elements[] Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `type` | string | Yes | Element type | `"headline"` |
| `label` | string | Yes | Display name | `"Headline"` |
| `content` | string | Yes | Text content | `"Summer Sale"` |
| `position.x` | number | Yes | X position (px) | `170` |
| `position.y` | number | Yes | Y position (px) | `726` |
| `position.width` | number | Yes | Width (px) | `2210` |
| `position.height` | number \| null | Yes | Height (px or null) | `null` |
| `styling.fontSize` | number | Yes | Font size (px) | `153` |
| `styling.fontWeight` | string | Yes | Font weight | `"bold"` |
| `styling.textAlign` | string | Yes | Text alignment | `"center"` |
| `styling.color` | string | Yes | Text color (hex) | `"#FFFFFF"` |
| `styling.italic` | boolean | Yes | Italic style | `false` |
| `styling.underline` | boolean | Yes | Underline style | `false` |
| `styling.letterSpacing` | number | Yes | Letter spacing (px) | `0` |
| `styling.lineSpacing` | number | Yes | Line spacing (px) | `10` |
| `constraints.maxLength` | number | No | Max character count | `100` |
| `constraints.required` | boolean | No | Required field | `true` |
| `display_order` | number | Yes | Layer order (0-based) | `0` |

### qr_position Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `x` | number | Yes | X position (px) | `850` |
| `y` | number | Yes | Y position (px) | `1283` |
| `size` | number | Yes | Width/height (px) | `850` |

---

## Common Patterns

### Multiple Locations, Same Text

```json
{
  "locations": ["loc_1", "loc_2", "loc_3"],
  "background_mode": "same",
  "background_id": "bg_xyz",
  "text_elements": [
    // Same text for all locations
  ]
}
```

### Multiple Locations, Custom Backgrounds

```json
{
  "locations": ["loc_1", "loc_2"],
  "background_mode": "custom",
  "location_backgrounds": {
    "loc_1": "bg_abc",
    "loc_2": "bg_def"
  },
  "text_elements": [
    // Same text, different backgrounds
  ]
}
```

### Dynamic Base URL (for QR codes)

```json
{
  "base_url": "https://promo.example.com/summer-sale",
  "text_elements": [...],
  "qr_position": {...}
}
```
The backend will generate unique QR codes for each location:
- Location 1: `https://promo.example.com/summer-sale?loc=loc_1`
- Location 2: `https://promo.example.com/summer-sale?loc=loc_2`

---

## Real-World Examples

### Example 1: Simple Flyer

```json
{
  "asset_type": "flyer",
  "message_theme": "Grand Opening",
  "locations": ["loc_downtown"],
  "background_id": "bg_confetti",
  "base_url": "https://shop.example.com",
  "text_elements": [
    {
      "type": "headline",
      "label": "Headline",
      "content": "Grand Opening!",
      "position": { "x": 200, "y": 800, "width": 2150, "height": null },
      "styling": {
        "fontSize": 180,
        "fontWeight": "bold",
        "textAlign": "center",
        "color": "#FF0000",
        "italic": false,
        "underline": false,
        "letterSpacing": 5,
        "lineSpacing": 15
      },
      "constraints": { "maxLength": 50, "required": true },
      "display_order": 0
    },
    {
      "type": "cta",
      "label": "Call to Action",
      "content": "Scan for Exclusive Deals",
      "position": { "x": 200, "y": 2500, "width": 2150, "height": null },
      "styling": {
        "fontSize": 90,
        "fontWeight": "bold",
        "textAlign": "center",
        "color": "#000000",
        "italic": false,
        "underline": true,
        "letterSpacing": 1,
        "lineSpacing": 10
      },
      "constraints": { "maxLength": 50, "required": true },
      "display_order": 1
    }
  ],
  "qr_position": { "x": 875, "y": 1400, "size": 800 }
}
```

### Example 2: Multi-Location Campaign

```json
{
  "asset_type": "flyer",
  "message_theme": "Holiday Sale",
  "locations": ["loc_ny", "loc_la", "loc_chicago"],
  "background_mode": "same",
  "background_id": "bg_snowflakes",
  "base_url": "https://holiday.example.com",
  "text_elements": [
    {
      "type": "headline",
      "content": "Holiday Sale - 40% Off!",
      "position": { "x": 170, "y": 726, "width": 2210, "height": null },
      "styling": {
        "fontSize": 153,
        "fontWeight": "bold",
        "textAlign": "center",
        "color": "#FFFFFF",
        "italic": false,
        "underline": false,
        "letterSpacing": 0,
        "lineSpacing": 10
      },
      "display_order": 0
    },
    {
      "type": "subheadline",
      "content": "December 15-25 at all locations",
      "position": { "x": 170, "y": 1188, "width": 2210, "height": null },
      "styling": {
        "fontSize": 93,
        "fontWeight": "normal",
        "textAlign": "center",
        "color": "#FFFFFF",
        "italic": true,
        "underline": false,
        "letterSpacing": 0,
        "lineSpacing": 10
      },
      "display_order": 1
    }
  ],
  "qr_position": { "x": 850, "y": 1500, "size": 850 }
}
```

### Example 3: Custom Styling Per Element

```json
{
  "text_elements": [
    {
      "type": "headline",
      "content": "BOLD & LOUD",
      "styling": {
        "fontSize": 200,
        "fontWeight": "bold",
        "textAlign": "center",
        "color": "#FF0000",
        "italic": false,
        "underline": false,
        "letterSpacing": 10,
        "lineSpacing": 20
      },
      "display_order": 0
    },
    {
      "type": "subheadline",
      "content": "Quiet elegance",
      "styling": {
        "fontSize": 60,
        "fontWeight": "normal",
        "textAlign": "center",
        "color": "#666666",
        "italic": true,
        "underline": false,
        "letterSpacing": 3,
        "lineSpacing": 8
      },
      "display_order": 1
    },
    {
      "type": "cta",
      "content": "CLICK HERE NOW",
      "styling": {
        "fontSize": 120,
        "fontWeight": "bold",
        "textAlign": "center",
        "color": "#00FF00",
        "italic": false,
        "underline": true,
        "letterSpacing": 5,
        "lineSpacing": 12
      },
      "display_order": 2
    }
  ]
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-11 | Initial release with text_elements support |
| 0.9.0 | 2025-11-10 | Legacy structure (headline/subheadline/cta) |

---

**Last Updated**: 2025-11-11
**API Version**: 1.0
**Status**: Production Ready
