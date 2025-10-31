export type AssetType =
  | 'flyer'
  | 'door_hanger'
  | 'table_tent'
  | 'business_card'
  | 'menu_board';

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
