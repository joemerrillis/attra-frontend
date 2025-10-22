export interface Campaign {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  goal: string;
  asset_type?: string;
  copy?: CampaignCopy;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CampaignCopy {
  headline: string;
  subheadline: string;
  cta: string;
}

export type CampaignGoal =
  | 'new_clients'
  | 'retention'
  | 'event_promo'
  | 'seasonal'
  | 'awareness';

export type AssetType =
  | 'flyer'
  | 'door_hanger'
  | 'table_tent'
  | 'menu_board'
  | 'business_card';

export type LayoutType = 'classic' | 'modern' | 'minimal';

export interface LocationCopy {
  location_id: string;
  layout: LayoutType;
  copy: CampaignCopy;
}

export interface WizardData {
  // Step 1
  goal?: CampaignGoal;

  // Step 2
  selectedLocations: string[];

  // Step 3
  assetType?: AssetType;

  // Step 3.5
  customizePerLocation: boolean;

  // Steps 4-6 (Shared mode)
  destinationUrl?: string;
  layout?: LayoutType;
  copy?: CampaignCopy;

  // Steps 4-6 (Per-location mode)
  locationAssets?: LocationCopy[];
}

export interface GenerateAssetsRequest {
  asset_type: AssetType;
  base_url: string;

  // Shared mode
  location_ids?: string[];
  layout?: LayoutType;
  copy?: CampaignCopy;

  // Per-location mode
  assets?: Array<{
    location_id: string;
    layout: LayoutType;
    copy: CampaignCopy;
  }>;
}
