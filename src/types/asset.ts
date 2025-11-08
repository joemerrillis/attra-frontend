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

export interface AssetGenerationRequest {
  asset_type: AssetType;
  message_theme: string;
  headline: string;
  subheadline?: string;
  cta?: string;
  locations: string[];
  background_mode: 'same' | 'custom';
  background_id?: string;
  location_backgrounds?: Record<string, string>;
  base_url: string;
  text_positions?: TextPositions;  // Optional custom text positions
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
