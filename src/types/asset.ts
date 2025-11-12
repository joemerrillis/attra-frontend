export type AssetType =
  | 'flyer'
  | 'door_hanger'
  | 'table_tent'
  | 'business_card'
  | 'menu_board';

export interface TextPosition {
  x: number;         // Pixels from left
  y: number;         // Pixels from top
  width: number;     // Width in pixels
  height?: number | 'auto';  // Height in pixels or auto-fit to content
  fontSize: number;  // Font size in px
  fontWeight: 'normal' | 'bold';
}

export interface QRCodePosition {
  x: number;         // Pixels from left
  y: number;         // Pixels from top
  size: number;      // Size in pixels (QR is square)
}

export interface TextPositions {
  headline: TextPosition;
  subheadline: TextPosition;
  cta: TextPosition;
  qrCode: QRCodePosition;
}

// New dynamic text element system
export interface TextElement {
  tempId: string;  // Client-side ID (not persisted to database)
  type: 'headline' | 'subheadline' | 'body' | 'quote' | 'cta' | 'custom';
  label: string;  // Display name: "Headline", "Customer Quote", etc.
  content: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number | 'auto';
  };
  styling: {
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    textAlign: 'left' | 'center' | 'right' | 'justify';
    color: string;  // Hex: '#FFFFFF'
    italic: boolean;
    underline: boolean;
    letterSpacing: number;
    lineSpacing: number;
  };
  constraints?: {
    maxLength: number;
    required: boolean;
  };
  displayOrder: number;  // For layering (0 = bottom, higher = top)
}

// Asset type specifications from backend
export interface AssetTypeSpec {
  asset_type: string;
  display_name: string;
  width: number;
  height: number;
  aspect_ratio: string;
  min_font_size: number;
  max_font_size: number;
  min_text_width: number;
  min_text_height: number;
  min_letter_spacing: number;
  max_letter_spacing: number;
  min_line_spacing: number;
  max_line_spacing: number;
  min_qr_size: number;
  max_qr_size: number;
}

export interface AssetGenerationRequest {
  asset_type: AssetType;
  message_theme?: string;
  locations: string[];
  background_mode: 'same' | 'custom';
  background_id: string;
  location_backgrounds?: Record<string, string>;
  base_url?: string;

  // New dynamic text elements structure
  text_elements?: any[];  // Transformed format (tempId and displayOrder removed)
  qr_position?: QRCodePosition;

  // Legacy fields (keep for backward compatibility during transition)
  headline?: string;
  subheadline?: string;
  cta?: string;
  text_positions?: TextPositions;
  text_colors?: {
    headline: string;
    subheadline: string;
    cta: string;
  };
}

export interface AssetGenerationResponse {
  success: boolean;
  assets: Array<{
    id: string;
    location_id: string;
    asset_type: AssetType;
    message_theme: string;
    qr_link_id: string;
    status: string;
  }>;
  message: string;
}
