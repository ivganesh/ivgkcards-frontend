export interface VcardSections {
  header: boolean;
  contactList: boolean;
  services: boolean;
  products: boolean;
  galleries: boolean;
  blogs: boolean;
  map: boolean;
  testimonials: boolean;
  businessHours: boolean;
  appointments: boolean;
  instaEmbed: boolean;
  banner: boolean;
  iframe: boolean;
  newsletterPopup: boolean;
  oneSignalNotification: boolean;
}

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
  sections?: VcardSections | null;
  createdAt: string;
  updatedAt: string;
}

export interface VcardServiceItem {
  id?: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  price?: number | null;
  order?: number | null;
}

export interface CurrencyInfo {
  id: string;
  code: string;
  name: string;
  symbol?: string | null;
}

export interface VcardProductItem {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  currencyId: string;
  currency?: CurrencyInfo | null;
  image?: string | null;
  inStock: boolean;
  order?: number | null;
}

export interface VcardGalleryItem {
  id?: string;
  title?: string | null;
  imageUrl: string;
  order?: number | null;
}

export interface VcardTestimonialItem {
  id?: string;
  name: string;
  position?: string | null;
  company?: string | null;
  content: string;
  imageUrl?: string | null;
  rating?: number | null;
  order?: number | null;
}

export interface VcardBusinessHourItem {
  id?: string;
  dayOfWeek: number;
  isOpen: boolean;
  openTime?: string | null;
  closeTime?: string | null;
}

export interface VcardAppointmentItem {
  id?: string;
  title: string;
  description?: string | null;
  duration: number;
  price?: number | null;
  available: boolean;
}

export interface VcardSocialLinkItem {
  id?: string;
  platform: string;
  url: string;
  order?: number | null;
}

export interface VcardCustomLinkItem {
  id?: string;
  label: string;
  url: string;
  icon?: string | null;
  order?: number | null;
}

export interface VcardDetail extends VcardSummary {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  regionCode?: string | null;
  occupation?: string | null;
  description?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  location?: string | null;
  locationUrl?: string | null;
  locationType?: string | null;
  locationEmbedTag?: string | null;
  profileImage?: string | null;
  coverImage?: string | null;
  favicon?: string | null;
  branding?: boolean | null;
  sections: VcardSections;
  services: VcardServiceItem[];
  products: VcardProductItem[];
  galleries: VcardGalleryItem[];
  testimonials: VcardTestimonialItem[];
  businessHours: VcardBusinessHourItem[];
  appointments: VcardAppointmentItem[];
  socialLinks: VcardSocialLinkItem[];
  customLinks: VcardCustomLinkItem[];
  planWarnings?: string[];
}

export interface RenderedCardData {
  id: string;
  slug: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  title: string;
  company: string;
  email: string;
  phone: string;
  regionCode: string;
  website: string;
  address: string;
  bio: string;
  profileImage: string;
  coverImage: string;
  favicon: string;
  branding: boolean | null;
  location: string;
  locationUrl: string;
  locationEmbedTag: string | null;
  socialLinks: Array<{
    platform: string;
    url: string;
    order: number;
  }>;
  customLinks: Array<{
    label: string;
    url: string;
    icon: string | null;
    order: number;
  }>;
  services: Array<{
    title: string;
    description: string | null;
    icon: string | null;
    image: string | null;
    price: number | null;
    order: number;
  }>;
  products: Array<{
    name: string;
    description: string | null;
    price: number;
    currency: {
      id: string;
      code: string;
      symbol: string | null;
      name: string;
    };
    image: string | null;
    inStock: boolean;
    order: number;
  }>;
  galleries: Array<{
    title: string | null;
    imageUrl: string;
    order: number;
  }>;
  testimonials: Array<{
    name: string;
    position: string | null;
    company: string | null;
    content: string;
    imageUrl: string | null;
    rating: number | null;
    order: number;
  }>;
  businessHours: Array<{
    dayOfWeek: number;
    isOpen: boolean;
    openTime: string | null;
    closeTime: string | null;
  }>;
  appointments: Array<{
    title: string;
    description: string | null;
    duration: number;
    price: number | null;
    available: boolean;
  }>;
  sections: VcardSections | null;
  qrCode?: {
    url: string;
    imageDataUrl: string;
    downloadFileName: string;
  };
}
