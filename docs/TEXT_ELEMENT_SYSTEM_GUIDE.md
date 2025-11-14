# Dynamic Text Element System - Quick Reference Guide

**TL;DR**: Text fields are now stored as a `TextElement[]` array instead of separate state variables. Each element has full styling control and can be reordered in layers.

---

## Quick Start

### Basic Usage

```typescript
import { TextElement, QRCodePosition } from '@/types/asset';
import { transformTextElementsForAPI } from '@/utils/apiHelpers';

// 1. Create text elements
const textElements: TextElement[] = [
  {
    tempId: uuidv4(),
    type: 'headline',
    label: 'Headline',
    content: 'Your Headline Here',
    position: { x: 170, y: 726, width: 2210, height: 'auto' },
    styling: {
      fontSize: 153,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#FFFFFF',
      italic: false,
      underline: false,
      letterSpacing: 0,
      lineSpacing: 10
    },
    constraints: { maxLength: 100, required: true },
    displayOrder: 0
  }
];

// 2. Transform for API
const apiPayload = transformTextElementsForAPI(textElements);

// 3. Send to backend
await assetApi.generate({
  asset_type: 'flyer',
  text_elements: apiPayload,
  qr_position: { x: 850, y: 1283, size: 850 }
});
```

---

## Core Types

### TextElement Interface

```typescript
interface TextElement {
  // Identity
  tempId: string;              // Client-side UUID (removed before API call)
  type: 'headline' | 'subheadline' | 'body' | 'quote' | 'cta' | 'custom';
  label: string;               // Display name in UI

  // Content
  content: string;             // The actual text

  // Position (in asset coordinates, e.g., 2550×3300 for flyers)
  position: {
    x: number;                 // Pixels from left
    y: number;                 // Pixels from top
    width: number;             // Width in pixels
    height: number | 'auto';   // Height (usually 'auto' for text)
  };

  // Styling
  styling: {
    fontSize: number;          // Font size in px
    fontWeight: 'normal' | 'bold';
    textAlign: 'left' | 'center' | 'right' | 'justify';
    color: string;             // Hex color: '#FFFFFF'
    italic: boolean;
    underline: boolean;
    letterSpacing: number;     // In pixels
    lineSpacing: number;       // In pixels (added to fontSize for line-height)
  };

  // Validation
  constraints?: {
    maxLength: number;         // Max character count
    required: boolean;         // Must have content
  };

  // Layer ordering
  displayOrder: number;        // 0 = bottom, higher = top
}
```

### QRCodePosition Interface

```typescript
interface QRCodePosition {
  x: number;      // Pixels from left
  y: number;      // Pixels from top
  size: number;   // Width/height (QR is always square)
}
```

---

## Common Operations

### Update Text Content

```typescript
const updateTextElementContent = (id: string, content: string) => {
  setTextElements(prev => prev.map(el =>
    el.tempId === id ? { ...el, content } : el
  ));
};
```

### Update Position

```typescript
const updateTextElementPosition = (id: string, position: Partial<TextElement['position']>) => {
  setTextElements(prev => prev.map(el =>
    el.tempId === id
      ? { ...el, position: { ...el.position, ...position } }
      : el
  ));
};
```

### Update Styling

```typescript
const updateTextElementStyling = (id: string, styling: Partial<TextElement['styling']>) => {
  setTextElements(prev => prev.map(el =>
    el.tempId === id
      ? { ...el, styling: { ...el.styling, ...styling } }
      : el
  ));
};
```

### Layer Ordering

```typescript
// Move forward one layer
const moveElementForward = (id: string) => {
  setTextElements(prev => {
    const index = prev.findIndex(el => el.tempId === id);
    if (index === -1 || index === prev.length - 1) return prev;

    const newElements = [...prev];
    const currentOrder = newElements[index].displayOrder;
    const nextElement = newElements.find(el => el.displayOrder === currentOrder + 1);

    if (nextElement) {
      newElements[index].displayOrder = currentOrder + 1;
      nextElement.displayOrder = currentOrder;
    }

    return newElements.sort((a, b) => a.displayOrder - b.displayOrder);
  });
};

// Move backward one layer
const moveElementBackward = (id: string) => {
  setTextElements(prev => {
    const index = prev.findIndex(el => el.tempId === id);
    if (index === -1 || prev[index].displayOrder === 0) return prev;

    const newElements = [...prev];
    const currentOrder = newElements[index].displayOrder;
    const prevElement = newElements.find(el => el.displayOrder === currentOrder - 1);

    if (prevElement) {
      newElements[index].displayOrder = currentOrder - 1;
      prevElement.displayOrder = currentOrder;
    }

    return newElements.sort((a, b) => a.displayOrder - b.displayOrder);
  });
};

// Move to front (top layer)
const moveElementToFront = (id: string) => {
  setTextElements(prev => {
    const maxOrder = Math.max(...prev.map(el => el.displayOrder));
    return prev.map(el =>
      el.tempId === id ? { ...el, displayOrder: maxOrder + 1 } : el
    ).sort((a, b) => a.displayOrder - b.displayOrder)
    .map((el, idx) => ({ ...el, displayOrder: idx }));
  });
};

// Move to back (bottom layer)
const moveElementToBack = (id: string) => {
  setTextElements(prev => {
    return prev.map(el =>
      el.tempId === id ? { ...el, displayOrder: -1 } : el
    ).sort((a, b) => a.displayOrder - b.displayOrder)
    .map((el, idx) => ({ ...el, displayOrder: idx }));
  });
};
```

### Add New Element

```typescript
const addTextElement = (type: TextElement['type']) => {
  const newElement: TextElement = {
    tempId: uuidv4(),
    type,
    label: type.charAt(0).toUpperCase() + type.slice(1),
    content: '',
    position: { x: 100, y: 100, width: 500, height: 'auto' },
    styling: {
      fontSize: 50,
      fontWeight: 'normal',
      textAlign: 'center',
      color: '#000000',
      italic: false,
      underline: false,
      letterSpacing: 0,
      lineSpacing: 10
    },
    constraints: { maxLength: 200, required: false },
    displayOrder: textElements.length  // Add to top
  };

  setTextElements(prev => [...prev, newElement]);
};
```

### Remove Element

```typescript
const removeTextElement = (id: string) => {
  setTextElements(prev =>
    prev.filter(el => el.tempId !== id)
      .map((el, idx) => ({ ...el, displayOrder: idx }))  // Reorder
  );
};
```

---

## API Transformation

### Client → API

```typescript
import { transformTextElementsForAPI } from '@/utils/apiHelpers';

// Client format (has tempId and displayOrder)
const clientElements: TextElement[] = [...];

// API format (no tempId, uses display_order)
const apiElements = transformTextElementsForAPI(clientElements);
// Returns: Array with tempId removed, displayOrder → display_order, height: 'auto' → null
```

### What Gets Transformed?

| Client Property | API Property | Transformation |
|----------------|--------------|----------------|
| `tempId` | ❌ Removed | Not sent to backend |
| `displayOrder` | `display_order` | camelCase → snake_case |
| `height: 'auto'` | `height: null` | String → null |
| Empty `content` | ❌ Filtered | Elements with empty content removed |

---

## Validation

```typescript
import { validateTextElements } from '@/utils/apiHelpers';

const { valid, errors } = validateTextElements(textElements);

if (!valid) {
  console.error('Validation errors:', errors);
  // Example errors:
  // - "Headline is required"
  // - "Call to Action exceeds max length (55/50)"
}
```

### Validation Rules

1. **Required Headline**: At least one element with `type: 'headline'` and non-empty content
2. **Required Fields**: Elements with `constraints.required: true` must have content
3. **Max Length**: Content length must not exceed `constraints.maxLength`

---

## Overlap Detection

```typescript
import { detectOverlappingElements } from '@/utils/geometryHelpers';

const overlappingIds = detectOverlappingElements(textElements, qrPosition);
// Returns: Set<string> of tempIds that have overlaps

// Check if specific element overlaps
if (overlappingIds.has(element.tempId)) {
  console.warn('Element overlaps with another element or QR code');
}
```

---

## Component Usage

### DraggableTextBox

```typescript
import { DraggableTextBox } from '@/components/DraggableTextBox';

<DraggableTextBox
  textElement={element}
  isDragging={draggingElementId === element.tempId}
  isResizing={resizingElementId === element.tempId}
  isSelected={selectedElementId === element.tempId}
  hasOverlap={overlappingIds.has(element.tempId)}
  onDragStart={() => setDraggingElementId(element.tempId)}
  onDragEnd={(left, top) => {
    setDraggingElementId(null);
    updateTextElementPosition(element.tempId, { x: left, y: top });
  }}
  onResizeStart={() => setResizingElementId(element.tempId)}
  onResizeEnd={(width, height, left, top) => {
    setResizingElementId(null);
    updateTextElementPosition(element.tempId, { x: left, y: top, width, height });
  }}
  bounds={{ left: 0, top: 0, right: 2550, bottom: 3300 }}
  verticalGuidelines={[637.5, 850, 1275, 1700, 1912.5]}
  horizontalGuidelines={[825, 1100, 1650, 2200, 2475]}
/>
```

### LayerOrderingControls

```typescript
import { LayerOrderingControls } from '@/components/LayerOrderingControls';

<LayerOrderingControls
  currentOrder={element.displayOrder}
  totalLayers={textElements.length}
  onMoveForward={() => moveElementForward(element.tempId)}
  onMoveBackward={() => moveElementBackward(element.tempId)}
  onMoveToFront={() => moveElementToFront(element.tempId)}
  onMoveToBack={() => moveElementToBack(element.tempId)}
/>
```

---

## Coordinate Systems

### Asset Coordinates (Absolute)
Used for `TextElement.position` and `QRCodePosition`:
- Flyer: 2550×3300 (8.5"×11" at 300 DPI)
- Business Card: 1050×600 (3.5"×2" at 300 DPI)
- Door Hanger: 1200×3000 (4"×10" at 300 DPI)

### Display Coordinates (Scaled)
Used in UI preview:
- Scale: `DISPLAY_SCALE = 600 / ASSET_DIMENSIONS.width`
- Flyer display: 600×900 (scaled down from 2550×3300)

**Important**: Always store positions in **asset coordinates**, not display coordinates.

---

## Styling Controls

### Available Controls

| Control | Property | Values |
|---------|----------|--------|
| Text Alignment | `textAlign` | left, center, right, justify |
| Bold | `fontWeight` | normal, bold |
| Italic | `italic` | true, false |
| Underline | `underline` | true, false |
| Font Size | `fontSize` | 20-200px (configurable) |
| Letter Spacing | `letterSpacing` | -5 to 20px (configurable) |
| Line Spacing | `lineSpacing` | 0 to 30px (configurable) |
| Color | `color` | Hex string (#FFFFFF) |

### Dynamic Constraints (from assetSpec)

```typescript
import { useAssetTypeSpecs } from '@/hooks/useAssetTypeSpecs';

const { spec, loading, error } = useAssetTypeSpecs('flyer');

// Use spec for dynamic ranges
<Slider
  min={spec?.min_font_size || 20}
  max={spec?.max_font_size || 200}
  value={[element.styling.fontSize]}
/>
```

---

## Best Practices

### 1. Always Use UUIDs for tempId
```typescript
import { v4 as uuidv4 } from 'uuid';

const newElement: TextElement = {
  tempId: uuidv4(),  // ✅ Good
  // tempId: Math.random().toString(),  // ❌ Bad - collisions possible
  ...
};
```

### 2. Validate Before Sending to API
```typescript
const handleGenerate = () => {
  const { valid, errors } = validateTextElements(textElements);

  if (!valid) {
    toast({ title: 'Validation Error', description: errors.join(', ') });
    return;  // ✅ Don't send invalid data
  }

  onGenerate({ text_elements: textElements, qr_position: qrPosition });
};
```

### 3. Filter Empty Elements
```typescript
const nonEmptyElements = textElements.filter(el => el.content.trim() !== '');
// Only send elements with actual content
```

### 4. Maintain displayOrder Sequence
```typescript
// After removing element, reindex displayOrder
const reindexedElements = elements.map((el, idx) => ({ ...el, displayOrder: idx }));
```

### 5. Clamp Positions to Bounds
```typescript
const clampPosition = (x: number, y: number, width: number, height: number | 'auto') => {
  const h = height === 'auto' ? 100 : height;
  return {
    x: Math.max(0, Math.min(x, ASSET_DIMENSIONS.width - width)),
    y: Math.max(0, Math.min(y, ASSET_DIMENSIONS.height - h))
  };
};
```

---

## Troubleshooting

### Text Not Appearing in Preview

**Problem**: Text element rendered but not visible

**Solutions**:
1. Check `color` matches background (white on white = invisible)
2. Verify `position.x/y` is within bounds (not negative or off-canvas)
3. Check `fontSize` is reasonable (not 0 or 10000)
4. Ensure `displayOrder` allows visibility (not behind other elements)

### TypeScript Errors on height Property

**Problem**: `Type 'string' is not assignable to type 'number'`

**Solution**: Use union type `number | 'auto'`
```typescript
const height: number | 'auto' = 'auto';  // ✅ Correct
const height: number = 'auto';  // ❌ Error
```

### Elements Not Dragging

**Problem**: Click doesn't initiate drag

**Solutions**:
1. Check `bounds` prop is set correctly
2. Verify parent container has `position: relative`
3. Ensure no CSS `pointer-events: none` on parent
4. Check react-moveable is properly imported

### API Returns 400 Error

**Problem**: Backend rejects payload

**Solutions**:
1. Verify `transformTextElementsForAPI()` was called
2. Check `tempId` was removed from payload
3. Ensure `displayOrder` → `display_order` transformation
4. Validate `height: 'auto'` → `height: null`

---

## Migration Examples

### Before (Old System)

```typescript
// InteractiveEditor.tsx
const [headline, setHeadline] = useState('');
const [subheadline, setSubheadline] = useState('');
const [cta, setCta] = useState('');
const [textPositions, setTextPositions] = useState<TextPositions>({
  headline: { x: 100, y: 100, width: 500, fontSize: 50, fontWeight: 'bold' },
  subheadline: { x: 100, y: 200, width: 500, fontSize: 30, fontWeight: 'normal' },
  cta: { x: 100, y: 300, width: 500, fontSize: 40, fontWeight: 'bold' }
});

// Generate.tsx
await assetApi.generate({
  headline,
  subheadline,
  cta,
  text_positions: textPositions
});
```

### After (New System)

```typescript
// InteractiveEditor.tsx
const [textElements, setTextElements] = useState<TextElement[]>([
  {
    tempId: uuidv4(),
    type: 'headline',
    label: 'Headline',
    content: '',
    position: { x: 100, y: 100, width: 500, height: 'auto' },
    styling: {
      fontSize: 50,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#000000',
      italic: false,
      underline: false,
      letterSpacing: 0,
      lineSpacing: 10
    },
    constraints: { maxLength: 100, required: true },
    displayOrder: 0
  },
  // ... subheadline and cta
]);

// Generate.tsx
await assetApi.generate({
  text_elements: transformTextElementsForAPI(textElements),
  qr_position: qrPosition
});
```

---

## FAQ

### Q: Why tempId instead of array index?

**A**: Array indices change when elements are reordered or removed. `tempId` provides stable identity for React keys and state updates.

---

### Q: Can I set height to a fixed number?

**A**: Yes, but it's not recommended for text. Use `height: 'auto'` to prevent clipping. Fixed height is useful for image placeholders.

---

### Q: How do I add a new text type?

**A**: Update the type union:
```typescript
type: 'headline' | 'subheadline' | 'body' | 'quote' | 'cta' | 'custom' | 'YOUR_NEW_TYPE';
```

---

### Q: What happens if two elements have the same displayOrder?

**A**: Rendering order becomes undefined. Always ensure unique displayOrder values (use array index when initializing).

---

### Q: Can I use CSS transforms for positioning?

**A**: No, backend renders using absolute positions. Use `position.x/y` only.

---

### Q: How do I apply gradients or shadows?

**A**: Not supported yet. Currently limited to solid `color`. Future enhancement planned.

---

## Resources

- **Full Report**: `DYNAMIC_TEXT_REFACTOR_REPORT.md`
- **Type Definitions**: `src/types/asset.ts`
- **API Helpers**: `src/utils/apiHelpers.ts`
- **Geometry Utilities**: `src/utils/geometryHelpers.ts`
- **Example Component**: `src/components/InteractiveEditor.tsx`

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0
**Maintainer**: Frontend Team
