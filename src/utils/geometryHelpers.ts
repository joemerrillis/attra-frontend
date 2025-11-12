import type { TextElement, QRCodePosition } from '@/types/asset';

/**
 * Check if two rectangles overlap
 */
export function rectanglesOverlap(
  rect1: { x: number; y: number; width: number; height: number | 'auto' },
  rect2: { x: number; y: number; width: number; height: number | 'auto' }
): boolean {
  // Treat 'auto' height as 100px for overlap detection
  const h1 = rect1.height === 'auto' ? 100 : rect1.height;
  const h2 = rect2.height === 'auto' ? 100 : rect2.height;

  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + h1 < rect2.y ||
    rect2.y + h2 < rect1.y
  );
}

/**
 * Detect which text elements are overlapping
 * @returns Set of tempIds for overlapping elements
 */
export function detectOverlappingElements(
  textElements: TextElement[],
  qrPosition: QRCodePosition
): Set<string> {
  const overlapping = new Set<string>();

  // Check text-to-text overlaps
  for (let i = 0; i < textElements.length; i++) {
    for (let j = i + 1; j < textElements.length; j++) {
      if (rectanglesOverlap(textElements[i].position, textElements[j].position)) {
        overlapping.add(textElements[i].tempId);
        overlapping.add(textElements[j].tempId);
      }
    }

    // Check text-to-QR overlap
    const qrRect = { x: qrPosition.x, y: qrPosition.y, width: qrPosition.size, height: qrPosition.size };
    if (rectanglesOverlap(textElements[i].position, qrRect)) {
      overlapping.add(textElements[i].tempId);
    }
  }

  return overlapping;
}
