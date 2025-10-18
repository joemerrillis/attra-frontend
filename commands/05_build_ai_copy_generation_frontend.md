# Build AI Copy Generation Frontend

## Objective
Create frontend components for AI-powered copy generation. This integrates with the backend AI service to generate marketing headlines and subheadlines based on campaign goals. Users see 3 variations, can regenerate, and can edit manually. Emphasizes "starting points, not final copy."

## Dependencies
- ✅ 14_ai_copy_generation.md (from backend build)
- ✅ `04_build_campaign_wizard.md` (uses this within wizard)
- ✅ OpenAI or Anthropic API configured on backend

## Philosophy
**"AI writes the first draft. You make it yours."**
- Generate 3 variations automatically
- User can pick one and edit
- Regenerate button for new options
- No pixel-perfect design control - just good copy fast

---

## Tech Stack
- **React + TypeScript**
- **React Query** for API calls
- **Tailwind + Shadcn/ui** for styling
- **Framer Motion** (optional) for smooth transitions

---

## File Structure

```
src/
├── hooks/
│   └── useAICopy.ts (already created in 04)
├── components/
│   └── ai/
│       ├── CopyGenerator.tsx
│       ├── CopyVariations.tsx
│       ├── RegenerateButton.tsx
│       └── EditableField.tsx
└── lib/
    └── copy-utils.ts
```

---

## API Contract

### Generate Copy Endpoint

**Request:**
```typescript
POST /api/ai/generate-copy
{
  "tenant_id": "uuid",
  "goal": "open_house",
  "vertical": "real_estate",
  "location_name": "The Hamilton",
  "additional_context": "Luxury 3BR condo"
}
```

**Response:**
```typescript
{
  "variations": [
    {
      "headline": "Your Dream Home Awaits at The Hamilton",
      "subheadline": "Join us for an exclusive open house this Saturday. Luxury living in the heart of Brooklyn."
    },
    {
      "headline": "Experience Luxury Living at The Hamilton",
      "subheadline": "Tour our stunning 3BR condos this weekend. Premium finishes, unbeatable location."
    },
    {
      "headline": "Open House: The Hamilton",
      "subheadline": "This Saturday. See why The Hamilton is Brooklyn's most sought-after address."
    }
  ],
  "generatedAt": "2025-10-15T10:30:00Z"
}
```

---

## Implementation

### 1. Copy Generator Component

**File:** `src/components/ai/CopyGenerator.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useAICopy } from '@/hooks/useAICopy';
import { CopyVariations } from './CopyVariations';
import { EditableField } from './EditableField';

interface CopyGeneratorProps {
  goal: string;
  vertical: string;
  locationName?: string;
  initialHeadline?: string;
  initialSubheadline?: string;
  onCopyChange: (headline: string, subheadline: string) => void;
  autoGenerate?: boolean;
}

export const CopyGenerator: React.FC<CopyGeneratorProps> = ({
  goal,
  vertical,
  locationName,
  initialHeadline = '',
  initialSubheadline = '',
  onCopyChange,
  autoGenerate = true
}) => {
  const { generateCopy, isGenerating, variations } = useAICopy();
  const [headline, setHeadline] = useState(initialHeadline);
  const [subheadline, setSubheadline] = useState(initialSubheadline);
  const [showVariations, setShowVariations] = useState(false);

  useEffect(() => {
    if (autoGenerate && !headline && goal) {
      handleGenerate();
    }
  }, [goal, autoGenerate]);

  const handleGenerate = () => {
    generateCopy(
      {
        goal,
        vertical,
        location_name: locationName
      },
      {
        onSuccess: (data) => {
          if (data.variations && data.variations.length > 0) {
            const firstVariation = data.variations[0];
            setHeadline(firstVariation.headline);
            setSubheadline(firstVariation.subheadline);
            onCopyChange(firstVariation.headline, firstVariation.subheadline);
            setShowVariations(true);
          }
        }
      }
    );
  };

  const handleVariationSelect = (variation: any) => {
    setHeadline(variation.headline);
    setSubheadline(variation.subheadline);
    onCopyChange(variation.headline, variation.subheadline);
  };

  const handleHeadlineChange = (value: string) => {
    setHeadline(value);
    onCopyChange(value, subheadline);
  };

  const handleSubheadlineChange = (value: string) => {
    setSubheadline(value);
    onCopyChange(headline, value);
  };

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center py-12 border-2 border-dashed rounded-lg">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-1">
            AI is writing your copy...
          </p>
          <p className="text-sm text-gray-500">
            This takes about 3-5 seconds
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Editable Fields */}
      <EditableField
        label="Headline"
        value={headline}
        onChange={handleHeadlineChange}
        placeholder="Your attention-grabbing headline"
        maxLength={60}
        helpText="Keep it short and punchy"
      />

      <EditableField
        label="Subheadline"
        value={subheadline}
        onChange={handleSubheadlineChange}
        placeholder="Supporting details that drive action"
        maxLength={140}
        helpText="Expand on your headline with key details"
        multiline
      />

      {/* Regenerate Button */}
      <Button
        onClick={handleGenerate}
        variant="outline"
        disabled={isGenerating}
        className="w-full"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {headline ? 'Regenerate with AI' : 'Generate Copy'}
      </Button>

      {/* Show other variations */}
      {showVariations && variations.length > 1 && (
        <CopyVariations
          variations={variations.slice(1)}
          onSelect={handleVariationSelect}
        />
      )}
    </div>
  );
};
```

---

### 2. Copy Variations Component

**File:** `src/components/ai/CopyVariations.tsx`

```typescript
import React from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface Variation {
  headline: string;
  subheadline: string;
}

interface CopyVariationsProps {
  variations: Variation[];
  onSelect: (variation: Variation) => void;
}

export const CopyVariations: React.FC<CopyVariationsProps> = ({
  variations,
  onSelect
}) => {
  if (!variations || variations.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <h3 className="font-semibold mb-3 flex items-center text-blue-900">
        <Sparkles className="w-4 h-4 mr-2" />
        Other AI Variations
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        Click any variation to use it
      </p>
      <div className="space-y-2">
        {variations.map((variation, idx) => (
          <Card
            key={idx}
            className="p-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all bg-white"
            onClick={() => onSelect(variation)}
          >
            <p className="font-medium text-sm mb-1">
              {variation.headline}
            </p>
            <p className="text-xs text-gray-600">
              {variation.subheadline}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

---

### 3. Editable Field Component

**File:** `src/components/ai/EditableField.tsx`

```typescript
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength: number;
  helpText?: string;
  multiline?: boolean;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  helpText,
  multiline = false
}) => {
  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label htmlFor={label.toLowerCase()}>
          {label}
        </Label>
        <span 
          className={`text-xs ${
            isOverLimit ? 'text-red-600 font-semibold' :
            isNearLimit ? 'text-orange-600' :
            'text-gray-500'
          }`}
        >
          {characterCount}/{maxLength}
        </span>
      </div>

      {multiline ? (
        <Textarea
          id={label.toLowerCase()}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className={isOverLimit ? 'border-red-500' : ''}
        />
      ) : (
        <Input
          id={label.toLowerCase()}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={isOverLimit ? 'border-red-500' : ''}
        />
      )}

      {helpText && (
        <p className="text-xs text-gray-500 mt-1">
          {helpText}
        </p>
      )}
    </div>
  );
};
```

---

### 4. Copy Utils

**File:** `src/lib/copy-utils.ts`

```typescript
/**
 * Validate headline length and quality
 */
export function validateHeadline(headline: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (headline.length < 10) {
    errors.push('Headline is too short (minimum 10 characters)');
  }

  if (headline.length > 60) {
    errors.push('Headline is too long (maximum 60 characters)');
  }

  // Check for all caps
  if (headline === headline.toUpperCase() && headline.length > 5) {
    errors.push('Avoid using all caps');
  }

  // Check for excessive punctuation
  if ((headline.match(/!/g) || []).length > 1) {
    errors.push('Too many exclamation marks');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format copy for display
 */
export function formatCopy(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Remove extra whitespace
    .replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
}

/**
 * Extract keywords from copy
 */
export function extractKeywords(text: string): string[] {
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 5);
}

/**
 * Calculate copy strength score (0-100)
 */
export function calculateCopyScore(headline: string, subheadline: string): number {
  let score = 50; // Base score

  // Length scoring
  if (headline.length >= 30 && headline.length <= 50) score += 10;
  if (subheadline.length >= 80 && subheadline.length <= 120) score += 10;

  // Action words
  const actionWords = ['get', 'join', 'discover', 'experience', 'see', 'learn'];
  const hasActionWord = actionWords.some(word => 
    headline.toLowerCase().includes(word) || subheadline.toLowerCase().includes(word)
  );
  if (hasActionWord) score += 10;

  // Numbers (specificity)
  if (/\d/.test(headline) || /\d/.test(subheadline)) score += 10;

  // Questions (engagement)
  if (headline.includes('?') || subheadline.includes('?')) score += 10;

  return Math.min(score, 100);
}
```

---

## Usage Example

```typescript
// In CampaignWizard (Step 2)
import { CopyGenerator } from '@/components/ai/CopyGenerator';

const CampaignWizardStep2 = () => {
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');

  const handleCopyChange = (newHeadline: string, newSubheadline: string) => {
    setHeadline(newHeadline);
    setSubheadline(newSubheadline);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Your Marketing Copy</h2>
      
      <CopyGenerator
        goal={campaignGoal}
        vertical={tenantVertical}
        locationName={selectedLocation?.name}
        onCopyChange={handleCopyChange}
        autoGenerate={true}
      />
      
      {/* Preview */}
      <div className="mt-8 p-6 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-500 mb-2">Preview:</p>
        <h3 className="text-2xl font-bold mb-2">{headline}</h3>
        <p className="text-gray-700">{subheadline}</p>
      </div>
    </div>
  );
};
```

---

## Testing

### Manual Tests

1. **Auto-generation:**
   - Navigate to campaign wizard step 2
   - Wait 3-5 seconds
   - Verify 3 variations appear
   - Verify first variation is auto-selected

2. **Manual editing:**
   - Edit headline text
   - Verify character counter updates
   - Verify copy change callback fires
   - Try exceeding character limit

3. **Regeneration:**
   - Click "Regenerate with AI"
   - Verify loading state shows
   - Verify new variations appear
   - Verify different from first generation

4. **Variation selection:**
   - Click on variation #2
   - Verify headline + subheadline update
   - Verify fields remain editable

5. **Error handling:**
   - Disconnect internet
   - Try to generate
   - Verify error message shows
   - Verify retry button works

---

## Loading States

```typescript
// Different loading messages for personality
const loadingMessages = [
  "Crafting the perfect headline...",
  "Finding just the right words...",
  "Making your campaign irresistible...",
  "Writing copy that converts...",
  "Channeling our inner Don Draper..."
];

const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
```

---

## Acceptance Criteria

- [ ] Copy generator component renders
- [ ] Auto-generates on mount (if autoGenerate=true)
- [ ] Shows loading state during generation
- [ ] Displays 3 variations from API
- [ ] First variation auto-selected
- [ ] User can click other variations
- [ ] Headline field is editable
- [ ] Subheadline field is editable
- [ ] Character counters work
- [ ] Regenerate button works
- [ ] Generates different copy each time
- [ ] Copy change callback fires
- [ ] Error handling for failed API calls
- [ ] Works with keyboard navigation
- [ ] Mobile responsive

---

## Performance

```typescript
// Debounce copy changes to avoid excessive re-renders
import { useDebouncedCallback } from 'use-debounce';

const debouncedCopyChange = useDebouncedCallback(
  (headline, subheadline) => {
    onCopyChange(headline, subheadline);
  },
  300
);
```

---

## Estimated Build Time

**4 hours**

## Priority

**High** - Key differentiator ("AI writes the first draft")
