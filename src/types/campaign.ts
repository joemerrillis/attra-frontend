import type { GoalSuggestion } from '@/lib/goal-suggestions';

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

export interface LocationAsset {
  location_id: string;
  layout?: LayoutType;
  background_id?: string; // NEW: AI background selection
  copy: CampaignCopy;
}

export interface WizardData {
  // Step 1
  name?: string;
  description?: string;
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
  background_id?: string; // NEW: AI background selection
  copy?: CampaignCopy;

  // Steps 4-6 (Per-location mode)
  locationAssets?: LocationAsset[];

  // Internal: Goal suggestion for pre-population (not sent to backend)
  _goalSuggestion?: GoalSuggestion;
}

export interface RenderInstructions {
  headline: {
    text: string;
    x: number;
    y: number;
    width: number;
    fontSize: number;
    lineHeight: number;
    color: string;
    textAlign: 'center';
    textShadow?: string;
  };
  subheadline: {
    text: string;
    x: number;
    y: number;
    width: number;
    fontSize: number;
    lineHeight: number;
    color: string;
    textAlign: 'center';
    textShadow?: string;
  };
  qr: {
    x: number;
    y: number;
    size: number;
    padding: number;
  };
  cta: {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    textShadow?: string;
  };
}

export interface GenerateAssetsRequest {
  asset_type: AssetType;
  base_url: string;

  // NEW: Background selection (mutually exclusive with layout)
  background_id?: string;
  generate_new_background?: boolean;

  // Shared mode
  location_ids?: string[];
  layout?: LayoutType;
  copy?: CampaignCopy;

  // Per-location mode
  assets?: Array<{
    location_id: string;
    layout?: LayoutType;
    background_id?: string;
    copy: CampaignCopy;
  }>;
}
