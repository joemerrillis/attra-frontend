/**
 * AI Background Generation Types
 *
 * Supports three modes:
 * - Personalized: AI backgrounds based on tenant branding
 * - Generic: AI backgrounds without branding context
 * - Classic: HTML template fallback
 */

export interface CompositionMap {
  bright_zones: Zone[];
  dark_zones: Zone[];
  safe_zones: Zone[];
  subject_region?: Zone;
}

export interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Background {
  id: string;
  tenant_id: string;
  image_url: string;
  thumbnail_url: string;
  composition_map: CompositionMap;
  flux_prompt: string;
  style_keywords: string[];
  is_favorite: boolean;
  times_used: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandAnalysis {
  color_palette: string[];
  style_keywords: string[];
  industry: string;
  mood: string;
  target_audience?: string;
  brand_personality?: string;
  premium_analysis?: boolean;
}

export interface BrandingContext {
  website_url?: string;
  website_screenshot_url?: string;
  instagram_screenshots?: string[];
  product_images?: string[];
  brand_analysis?: BrandAnalysis;
  captured_at?: string;
}

export type BackgroundMode = 'personalized' | 'generic' | 'classic';

export interface BackgroundGenerationRequest {
  prompt_override?: string;
  style_keywords?: string[];
  generate_count?: number;
}

export interface BackgroundGenerationResponse {
  message: string;
  job_id: string;
  estimated_time_seconds: number;
}

export interface BackgroundStatusResponse {
  status: 'processing' | 'completed' | 'failed';
  background?: Background;
  error?: string;
  progress?: number;
  estimated_seconds_remaining?: number;
}

export interface BackgroundsListResponse {
  backgrounds: Background[];
  total: number;
  limit: number;
  offset: number;
  has_more?: boolean;
}

export interface BrandingCaptureRequest {
  website_url: string;
  instagram_screenshots?: File[];
  product_images?: File[];
}

export interface BrandingCaptureResponse {
  message: string;
  analysis: BrandAnalysis;
  images_stored: {
    website_screenshot?: string;
    instagram_screenshots?: string[];
    product_images?: string[];
  };
}
