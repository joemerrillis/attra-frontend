export interface ThemeVocabulary {
  id: string;
  tenant_id: string;
  theme_name: string;
  keywords: string[];
  mood?: string;
  created_at: string;
  updated_at: string;
}

export interface ThemeVocabularyListResponse {
  themes: ThemeVocabulary[];
  count: number;
}
