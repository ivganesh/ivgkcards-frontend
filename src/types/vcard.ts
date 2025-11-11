export interface VcardSummary {
  id: string;
  urlAlias: string;
  name: string;
  occupation?: string | null;
  company?: string | null;
  template?: {
    id: number;
    name: string;
    previewUrl?: string | null;
  } | null;
  status?: number;
  createdAt: string;
  updatedAt: string;
}

