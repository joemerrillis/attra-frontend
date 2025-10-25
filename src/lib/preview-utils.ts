/**
 * Preview Utility Functions
 *
 * Convert backend composition_map zones to CSS positioning for flyer preview
 */

import type { CompositionMap, Zone } from '@/types/background';
import type { LayoutType, RenderInstructions } from '@/types/campaign';

// Flyer dimensions (300 DPI for print quality)
const FLYER_WIDTH_PX = 2550;  // 8.5" × 300 DPI
const FLYER_HEIGHT_PX = 3300; // 11" × 300 DPI

// Font sizes at print resolution (match largest responsive size, scaled to 300 DPI)
const PRINT_FONT_SIZES = {
  headline: 120,      // lg:text-6xl (60px) * 2 = 120px @ 300 DPI
  subheadline: 48,    // md:text-2xl (24px) * 2 = 48px @ 300 DPI
  cta: 72,            // lg:text-4xl (36px) * 2 = 72px @ 300 DPI
};

const LINE_HEIGHT = 1.2; // Tailwind default for headings

/**
 * Convert absolute pixel zone to percentage-based CSS
 */
export function zoneToCSS(zone: Zone) {
  return {
    left: `${(zone.x / FLYER_WIDTH_PX) * 100}%`,
    top: `${(zone.y / FLYER_HEIGHT_PX) * 100}%`,
    width: `${(zone.width / FLYER_WIDTH_PX) * 100}%`,
    height: `${(zone.height / FLYER_HEIGHT_PX) * 100}%`,
  };
}

/**
 * Get headline text style based on composition map
 * Selects the largest safe zone for headline placement
 * If only one large zone exists, subdivides it into top 35% for headline
 */
export function getHeadlineStyle(compositionMap?: CompositionMap) {
  if (!compositionMap || !compositionMap.safe_zones.length) {
    // Fallback: center top
    return {
      position: 'absolute' as const,
      top: '15%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '80%',
      textAlign: 'center' as const,
    };
  }

  // Find largest safe zone by area
  const largestZone = compositionMap.safe_zones.reduce((largest, zone) => {
    const area = zone.width * zone.height;
    const largestArea = largest.width * largest.height;
    return area > largestArea ? zone : largest;
  });

  // If only one safe zone and it's tall (> 2000px), subdivide it
  // Use top 35% for headline, leaving 30% gap, bottom 35% for QR+CTA
  let headlineZone = largestZone;
  if (compositionMap.safe_zones.length === 1 && largestZone.height > 2000) {
    headlineZone = {
      x: largestZone.x,
      y: largestZone.y,
      width: largestZone.width,
      height: Math.floor(largestZone.height * 0.35), // Top 35%
    };
  }

  const css = zoneToCSS(headlineZone);

  // Determine text color based on zone brightness
  const isInBrightZone = compositionMap.bright_zones.some(brightZone =>
    zonesOverlap(headlineZone, brightZone)
  );

  return {
    position: 'absolute' as const,
    ...css,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center' as const,
    color: isInBrightZone ? '#000000' : '#FFFFFF',
    textShadow: isInBrightZone
      ? 'none'
      : '2px 2px 4px rgba(0, 0, 0, 0.8)',
  };
}

/**
 * Get QR code zone style
 * Selects a safe zone near the bottom for QR placement
 * If only one large zone exists, subdivides it to use bottom 35% for QR+CTA
 */
export function getQRZoneStyle(compositionMap?: CompositionMap) {
  if (!compositionMap || !compositionMap.safe_zones.length) {
    // Fallback: center bottom
    return {
      position: 'absolute' as const,
      bottom: '10%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '60%',
      textAlign: 'center' as const,
    };
  }

  // Find safe zone closest to bottom (highest Y coordinate)
  const bottomZone = compositionMap.safe_zones.reduce((bottom, zone) => {
    return zone.y > bottom.y ? zone : bottom;
  });

  // If only one safe zone and it's tall (> 2000px), subdivide it
  // Use bottom 35% for QR+CTA (skip top 35% for headline, 30% gap in middle)
  let qrZone = bottomZone;
  if (compositionMap.safe_zones.length === 1 && bottomZone.height > 2000) {
    const bottomHeight = Math.floor(bottomZone.height * 0.35); // Bottom 35%
    qrZone = {
      x: bottomZone.x,
      y: bottomZone.y + bottomZone.height - bottomHeight, // Start at bottom 35%
      width: bottomZone.width,
      height: bottomHeight,
    };
  }

  const css = zoneToCSS(qrZone);

  // Determine text color
  const isInBrightZone = compositionMap.bright_zones.some(brightZone =>
    zonesOverlap(qrZone, brightZone)
  );

  return {
    position: 'absolute' as const,
    ...css,
    display: 'flex',
    flexDirection: 'row' as const, // FIXED: Side-by-side layout (QR + CTA)
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    color: isInBrightZone ? '#000000' : '#FFFFFF',
    textShadow: isInBrightZone
      ? 'none'
      : '2px 2px 4px rgba(0, 0, 0, 0.8)',
  };
}

/**
 * Check if two zones overlap
 */
function zonesOverlap(zone1: Zone, zone2: Zone): boolean {
  return !(
    zone1.x + zone1.width < zone2.x ||
    zone2.x + zone2.width < zone1.x ||
    zone1.y + zone1.height < zone2.y ||
    zone2.y + zone2.height < zone1.y
  );
}

/**
 * Get layout-specific styles for classic templates
 */
export function getLayoutStyles(layout: LayoutType) {
  const styles = {
    classic: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'serif',
    },
    modern: {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      fontFamily: 'sans-serif',
    },
    minimal: {
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      fontFamily: 'sans-serif',
    },
  };

  return styles[layout];
}

/**
 * Calculate optimal font size based on text length and available space
 */
export function calculateFontSize(text: string, maxWidth: number, baseSize: number = 48): number {
  const avgCharWidth = baseSize * 0.6; // Approximate character width
  const requiredWidth = text.length * avgCharWidth;

  if (requiredWidth > maxWidth) {
    return Math.floor((maxWidth / requiredWidth) * baseSize);
  }

  return baseSize;
}

/**
 * Wrap text to fit within a given width
 */
export function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);

  return lines;
}

/**
 * Generate placeholder QR code data URL (for preview before QR is generated)
 */
export function generatePlaceholderQR(): string {
  // Simple SVG placeholder
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#000"/>
      <rect x="10" y="10" width="180" height="180" fill="#fff"/>
      <rect x="20" y="20" width="160" height="160" fill="#000"/>
      <rect x="40" y="40" width="40" height="40" fill="#fff"/>
      <rect x="120" y="40" width="40" height="40" fill="#fff"/>
      <rect x="40" y="120" width="40" height="40" fill="#fff"/>
      <rect x="80" y="80" width="40" height="40" fill="#fff"/>
      <text x="100" y="105" text-anchor="middle" fill="#fff" font-size="12" font-family="sans-serif">QR</text>
    </svg>
  `)}`;
}

/**
 * Convert CSS percentage string to absolute pixels
 */
function percentToPx(percentStr: string | undefined, totalPx: number): number {
  if (!percentStr) return 0;
  const percent = parseFloat(percentStr.replace('%', ''));
  return Math.floor((percent / 100) * totalPx);
}

/**
 * Calculate exact pixel coordinates for backend PDF generation
 * Uses same zone logic as preview to ensure WYSIWYG
 *
 * @param background - Background with composition_map (or null for classic templates)
 * @param copy - Campaign copy (headline, subheadline, cta)
 * @param layout - Classic template layout (if not using AI background)
 * @returns Absolute pixel coordinates at 300 DPI (2550x3300)
 */
export function calculateRenderInstructions(
  background: { composition_map?: CompositionMap } | null,
  copy: { headline: string; subheadline: string; cta: string },
  _layout?: LayoutType
): RenderInstructions {
  const compositionMap = background?.composition_map;

  // Get styles from existing functions (these already handle zone logic)
  const headlineStyle = getHeadlineStyle(compositionMap);
  const qrZoneStyle = getQRZoneStyle(compositionMap);

  // Convert CSS percentages to absolute pixels
  // Use 'as any' to handle different return types from style functions
  const headlineX = percentToPx((headlineStyle as any).left, FLYER_WIDTH_PX);
  const headlineY = percentToPx((headlineStyle as any).top, FLYER_HEIGHT_PX);
  const headlineWidth = percentToPx((headlineStyle as any).width, FLYER_WIDTH_PX);
  const headlineHeight = percentToPx((headlineStyle as any).height, FLYER_HEIGHT_PX);

  const qrZoneX = percentToPx((qrZoneStyle as any).left, FLYER_WIDTH_PX);
  const qrZoneY = percentToPx((qrZoneStyle as any).top, FLYER_HEIGHT_PX);
  const qrZoneWidth = percentToPx((qrZoneStyle as any).width, FLYER_WIDTH_PX);
  const qrZoneHeight = percentToPx((qrZoneStyle as any).height, FLYER_HEIGHT_PX);

  // Calculate vertical positioning for headline area (centered)
  const headlineFontSize = PRINT_FONT_SIZES.headline;
  const subheadlineFontSize = PRINT_FONT_SIZES.subheadline;
  const headlineLineHeight = headlineFontSize * LINE_HEIGHT;

  // Center headline vertically in its zone
  const headlineTextY = headlineY + (headlineHeight / 2) - headlineLineHeight - 20;
  const subheadlineTextY = headlineTextY + headlineLineHeight + 40;

  // Calculate QR + CTA positioning (horizontal layout with gap)
  const qrSize = 320;
  const qrPadding = 32;
  const gap = 64; // 1rem @ print resolution
  const ctaFontSize = PRINT_FONT_SIZES.cta;

  // Center the QR + CTA group horizontally in the zone
  const totalGroupWidth = (qrSize + qrPadding * 2) + gap + (qrZoneWidth * 0.4); // QR + gap + approximate CTA width
  const groupStartX = qrZoneX + (qrZoneWidth - totalGroupWidth) / 2;

  // Center vertically in zone
  const qrCenterY = qrZoneY + (qrZoneHeight / 2);
  const qrY = qrCenterY - (qrSize + qrPadding * 2) / 2;
  const ctaY = qrCenterY;

  return {
    headline: {
      text: copy.headline,
      x: headlineX + headlineWidth / 2, // Center X
      y: headlineTextY,
      width: headlineWidth,
      fontSize: headlineFontSize,
      lineHeight: LINE_HEIGHT,
      color: (headlineStyle as any).color || '#FFFFFF',
      textAlign: 'center',
      textShadow: (headlineStyle as any).textShadow
    },
    subheadline: {
      text: copy.subheadline,
      x: headlineX + headlineWidth / 2, // Center X
      y: subheadlineTextY,
      width: headlineWidth,
      fontSize: subheadlineFontSize,
      lineHeight: LINE_HEIGHT,
      color: (headlineStyle as any).color || '#FFFFFF',
      textAlign: 'center',
      textShadow: (headlineStyle as any).textShadow
    },
    qr: {
      x: groupStartX,
      y: qrY,
      size: qrSize,
      padding: qrPadding
    },
    cta: {
      text: copy.cta,
      x: groupStartX + qrSize + qrPadding * 2 + gap,
      y: ctaY,
      fontSize: ctaFontSize,
      color: (qrZoneStyle as any).color || '#FFFFFF',
      textShadow: (qrZoneStyle as any).textShadow
    }
  };
}
