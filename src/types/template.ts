export interface TemplateSummary {
  id: number;
  name: string;
  category?: string | null;
  description?: string | null;
  previewUrl?: string | null;
  r2Path: string;
  isActive: boolean;
  _count?: {
    vcards: number;
  };
}

