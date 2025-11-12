import type { TextElement } from '@/types/asset';

/**
 * Transform client TextElement to API format
 * - Removes tempId (client-only field)
 * - Converts displayOrder → display_order (camelCase → snake_case)
 * - Ensures height is null instead of 'auto' string
 */
export function transformTextElementForAPI(element: TextElement) {
  const { tempId, displayOrder, ...rest } = element;

  return {
    ...rest,
    display_order: displayOrder,
    position: {
      ...element.position,
      height: element.position.height === 'auto' ? null : element.position.height
    }
  };
}

/**
 * Transform array of text elements for API
 */
export function transformTextElementsForAPI(elements: TextElement[]) {
  return elements
    .filter(el => el.content.trim() !== '')  // Remove empty elements
    .map(transformTextElementForAPI)
    .sort((a, b) => a.display_order - b.display_order);  // Ensure sorted
}

/**
 * Validate text elements before sending
 * @returns { valid: boolean, errors: string[] }
 */
export function validateTextElements(elements: TextElement[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required elements
  const hasHeadline = elements.some(el =>
    el.type === 'headline' && el.content.trim() !== ''
  );

  if (!hasHeadline) {
    errors.push('Headline is required');
  }

  // Check for empty content in required elements
  for (const el of elements) {
    if (el.constraints?.required && el.content.trim() === '') {
      errors.push(`${el.label} is required but empty`);
    }
  }

  // Check max length constraints
  for (const el of elements) {
    if (el.constraints?.maxLength && el.content.length > el.constraints.maxLength) {
      errors.push(`${el.label} exceeds max length (${el.content.length}/${el.constraints.maxLength})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
