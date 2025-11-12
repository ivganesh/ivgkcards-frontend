'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import type {
  CurrencyInfo,
  VcardAppointmentItem,
  VcardBusinessHourItem,
  VcardCustomLinkItem,
  VcardDetail,
  VcardGalleryItem,
  VcardProductItem,
  VcardSections,
  VcardServiceItem,
  VcardSocialLinkItem,
  VcardTestimonialItem,
} from '@/types/vcard';

interface CardEditorProps {
  card: VcardDetail;
  onClose: () => void;
  onUpdated: (card: VcardDetail) => void;
}

interface GeneralState {
  urlAlias: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  occupation: string;
  regionCode: string;
  description: string;
  location: string;
  locationUrl: string;
  locationEmbedTag: string;
  profileImage: string;
  coverImage: string;
  favicon: string;
  branding: boolean;
}

type SectionToggleKey = keyof Omit<
  VcardSections,
  'header' | 'contactList'
>;

const SECTION_TOGGLES: Array<{
  key: SectionToggleKey;
  label: string;
  description: string;
}> = [
  {
    key: 'services',
    label: 'Services',
    description: 'Showcase your service offerings with pricing or CTAs.',
  },
  {
    key: 'products',
    label: 'Products',
    description: 'List products or packages available for purchase.',
  },
  {
    key: 'galleries',
    label: 'Gallery',
    description: 'Share photos of your work, events, or storefront.',
  },
  {
    key: 'testimonials',
    label: 'Testimonials',
    description: 'Highlight client stories and feedback.',
  },
  {
    key: 'businessHours',
    label: 'Business hours',
    description: 'Display when customers can reach you.',
  },
  {
    key: 'appointments',
    label: 'Appointments',
    description: 'Allow booking of time slots for consultations.',
  },
  {
    key: 'blogs',
    label: 'Blog & updates',
    description: 'Publish articles, news, or announcements.',
  },
  {
    key: 'map',
    label: 'Map embed',
    description: 'Embed a map to help visitors find your location.',
  },
  {
    key: 'instaEmbed',
    label: 'Instagram embed',
    description: 'Showcase Instagram content directly on the card.',
  },
  {
    key: 'banner',
    label: 'Hero banner',
    description: 'Display promotional banners or seasonal offers.',
  },
  {
    key: 'iframe',
    label: 'Custom iframe',
    description: 'Embed booking widgets or external forms.',
  },
  {
    key: 'newsletterPopup',
    label: 'Newsletter popup',
    description: 'Collect leads with a newsletter signup popup.',
  },
  {
    key: 'oneSignalNotification',
    label: 'Push notifications',
    description: 'Enable OneSignal notifications for repeat engagement.',
  },
];

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const extractGeneralState = (card: VcardDetail): GeneralState => {
  const fullName = card.name?.trim();
  const derivedName = fullName && fullName.length > 0
    ? fullName
    : [card.firstName, card.lastName].filter(Boolean).join(' ').trim();

  return {
    urlAlias: card.urlAlias,
    firstName: card.firstName ?? '',
    lastName: card.lastName ?? '',
    displayName: derivedName ?? '',
    email: card.email ?? '',
    phone: card.phone ?? '',
    company: card.company ?? '',
    jobTitle: card.jobTitle ?? '',
    occupation: card.occupation ?? '',
    regionCode: card.regionCode ?? '',
    description: card.description ?? '',
    location: card.location ?? '',
    locationUrl: card.locationUrl ?? '',
    locationEmbedTag: card.locationEmbedTag ?? '',
    profileImage: card.profileImage ?? '',
    coverImage: card.coverImage ?? '',
    favicon: card.favicon ?? '',
    branding: card.branding ?? true,
  };
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const normalizeServices = (items: VcardServiceItem[] = []): VcardServiceItem[] =>
  items.map((item, index) => ({
    id: item.id,
    title: item.title ?? '',
    description: item.description ?? '',
    icon: item.icon ?? '',
    image: item.image ?? '',
    price:
      item.price === undefined || item.price === null
        ? null
        : toNumber(item.price, 0),
    order: item.order ?? index,
  }));

const normalizeProducts = (items: VcardProductItem[] = []): VcardProductItem[] =>
  items.map((item, index) => ({
    id: item.id,
    name: item.name ?? '',
    description: item.description ?? '',
    price: toNumber(item.price, 0),
    currencyId: item.currencyId,
    currency: item.currency ?? null,
    image: item.image ?? '',
    inStock: item.inStock ?? true,
    order: item.order ?? index,
  }));

const normalizeGalleries = (items: VcardGalleryItem[] = []): VcardGalleryItem[] =>
  items.map((item, index) => ({
    id: item.id,
    title: item.title ?? '',
    imageUrl: item.imageUrl ?? '',
    order: item.order ?? index,
  }));

const normalizeTestimonials = (items: VcardTestimonialItem[] = []): VcardTestimonialItem[] =>
  items.map((item, index) => ({
    id: item.id,
    name: item.name ?? '',
    position: item.position ?? '',
    company: item.company ?? '',
    content: item.content ?? '',
    imageUrl: item.imageUrl ?? '',
    rating:
      item.rating === undefined || item.rating === null
        ? null
        : toNumber(item.rating, 0),
    order: item.order ?? index,
  }));

const normalizeBusinessHours = (items: VcardBusinessHourItem[] = []): VcardBusinessHourItem[] => {
  const defaults: VcardBusinessHourItem[] = Array.from({ length: 7 }, (_, day) => ({
    dayOfWeek: day,
    isOpen: false,
    openTime: '09:00',
    closeTime: '18:00',
  }));

  items.forEach((item) => {
    if (item.dayOfWeek < 0 || item.dayOfWeek > 6) {
      return;
    }
    defaults[item.dayOfWeek] = {
      dayOfWeek: item.dayOfWeek,
      isOpen: item.isOpen ?? true,
      openTime: item.openTime ?? '09:00',
      closeTime: item.closeTime ?? '18:00',
    };
  });

  return defaults;
};

const normalizeAppointments = (items: VcardAppointmentItem[] = []): VcardAppointmentItem[] =>
  items.map((item) => ({
    id: item.id,
    title: item.title ?? '',
    description: item.description ?? '',
    duration: toNumber(item.duration, 30),
    price:
      item.price === undefined || item.price === null
        ? null
        : toNumber(item.price, 0),
    available: item.available ?? true,
  }));

const normalizeSocialLinks = (items: VcardSocialLinkItem[] = []): VcardSocialLinkItem[] =>
  items.map((item, index) => ({
    id: item.id,
    platform: item.platform ?? '',
    url: item.url ?? '',
    order: item.order ?? index,
  }));

const normalizeCustomLinks = (items: VcardCustomLinkItem[] = []): VcardCustomLinkItem[] =>
  items.map((item, index) => ({
    id: item.id,
    label: item.label ?? '',
    url: item.url ?? '',
    icon: item.icon ?? '',
    order: item.order ?? index,
  }));

const sanitizeString = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const DEFAULT_SECTIONS_STATE: VcardSections = {
  header: true,
  contactList: true,
  services: false,
  products: false,
  galleries: false,
  blogs: false,
  map: false,
  testimonials: false,
  businessHours: false,
  appointments: false,
  instaEmbed: false,
  banner: false,
  iframe: false,
  newsletterPopup: false,
  oneSignalNotification: false,
};

const normalizeSectionsState = (
  sections?: Partial<VcardSections> | null,
): VcardSections => {
  const keys = Object.keys(DEFAULT_SECTIONS_STATE) as (keyof VcardSections)[];
  const normalized: Partial<VcardSections> = {};

  keys.forEach((key) => {
    const value = sections?.[key];
    normalized[key] =
      typeof value === 'boolean' ? value : DEFAULT_SECTIONS_STATE[key];
  });

  return normalized as VcardSections;
};

const filterEmpty = <T extends { title?: string; name?: string; label?: string; platform?: string; url?: string }>(
  items: T[],
  key: 'title' | 'name' | 'label' | 'platform' | 'url',
) =>
  items.filter((item) => {
    const candidate = (item as Record<string, string | undefined>)[key];
    return candidate && candidate.toString().trim().length > 0;
  });

export function CardEditor({ card, onClose, onUpdated }: CardEditorProps) {
  const [general, setGeneral] = useState<GeneralState>(() => extractGeneralState(card));
  const [sectionsState, setSectionsState] = useState<VcardSections>(() =>
    normalizeSectionsState(card.sections),
  );
  const [services, setServices] = useState<VcardServiceItem[]>(() =>
    normalizeServices(card.services),
  );
  const [products, setProducts] = useState<VcardProductItem[]>(() =>
    normalizeProducts(card.products),
  );
  const [galleries, setGalleries] = useState<VcardGalleryItem[]>(() =>
    normalizeGalleries(card.galleries),
  );
  const [testimonials, setTestimonials] = useState<VcardTestimonialItem[]>(() =>
    normalizeTestimonials(card.testimonials),
  );
  const [businessHours, setBusinessHours] = useState<VcardBusinessHourItem[]>(() =>
    normalizeBusinessHours(card.businessHours),
  );
  const [appointments, setAppointments] = useState<VcardAppointmentItem[]>(() =>
    normalizeAppointments(card.appointments),
  );
  const [socialLinks, setSocialLinks] = useState<VcardSocialLinkItem[]>(() =>
    normalizeSocialLinks(card.socialLinks),
  );
  const [customLinks, setCustomLinks] = useState<VcardCustomLinkItem[]>(() =>
    normalizeCustomLinks(card.customLinks),
  );

  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(false);
  const [currenciesError, setCurrenciesError] = useState<string | null>(null);

  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalStatus, setGeneralStatus] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalUploading, setGeneralUploading] = useState<
    'profileImage' | 'coverImage' | 'favicon' | null
  >(null);

  const [sectionsSaving, setSectionsSaving] = useState(false);
  const [sectionsStatus, setSectionsStatus] = useState<string | null>(null);
  const [sectionsError, setSectionsError] = useState<string | null>(null);

  const [servicesSaving, setServicesSaving] = useState(false);
  const [servicesStatus, setServicesStatus] = useState<string | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [productsSaving, setProductsSaving] = useState(false);
  const [productsStatus, setProductsStatus] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [galleriesSaving, setGalleriesSaving] = useState(false);
  const [galleriesStatus, setGalleriesStatus] = useState<string | null>(null);
  const [galleriesError, setGalleriesError] = useState<string | null>(null);

  const [testimonialsSaving, setTestimonialsSaving] = useState(false);
  const [testimonialsStatus, setTestimonialsStatus] = useState<string | null>(null);
  const [testimonialsError, setTestimonialsError] = useState<string | null>(null);

  const [hoursSaving, setHoursSaving] = useState(false);
  const [hoursStatus, setHoursStatus] = useState<string | null>(null);
  const [hoursError, setHoursError] = useState<string | null>(null);

  const [appointmentsSaving, setAppointmentsSaving] = useState(false);
  const [appointmentsStatus, setAppointmentsStatus] = useState<string | null>(null);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);

  const [socialSaving, setSocialSaving] = useState(false);
  const [socialStatus, setSocialStatus] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  const [customSaving, setCustomSaving] = useState(false);
  const [customStatus, setCustomStatus] = useState<string | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  const planWarningsMessage = useMemo(() => {
    if (!card.planWarnings || card.planWarnings.length === 0) {
      return null;
    }
    return card.planWarnings.join(' ');
  }, [card.planWarnings]);

  const hydrateFromCard = (nextCard: VcardDetail) => {
    setGeneral(extractGeneralState(nextCard));
    setSectionsState(normalizeSectionsState(nextCard.sections));
    setServices(normalizeServices(nextCard.services));
    setProducts(normalizeProducts(nextCard.products));
    setGalleries(normalizeGalleries(nextCard.galleries));
    setTestimonials(normalizeTestimonials(nextCard.testimonials));
    setBusinessHours(normalizeBusinessHours(nextCard.businessHours));
    setAppointments(normalizeAppointments(nextCard.appointments));
    setSocialLinks(normalizeSocialLinks(nextCard.socialLinks));
    setCustomLinks(normalizeCustomLinks(nextCard.customLinks));
    onUpdated(nextCard);
  };

  useEffect(() => {
    hydrateFromCard(card);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  useEffect(() => {
    const fetchCurrencies = async () => {
      setCurrenciesLoading(true);
      setCurrenciesError(null);
      try {
        const response = await api.get<CurrencyInfo[]>('/plans/currencies/active');
        setCurrencies(response.data);
      } catch (error) {
        console.error('Failed to load currencies', error);
        setCurrenciesError('Unable to load currencies. Defaulting to USD.');
        setCurrencies([
          { id: 'USD', code: 'USD', name: 'US Dollar', symbol: '$' },
          { id: 'INR', code: 'INR', name: 'Indian Rupee', symbol: '₹' },
        ]);
      } finally {
        setCurrenciesLoading(false);
      }
    };

    void fetchCurrencies();
  }, []);

  const uploadAsset = async (file: File, subCategory: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'VCARD');
    formData.append('subCategory', subCategory);
    formData.append('relatedEntityId', card.id);

    const response = await api.post<{
      file: { url: string };
    }>('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.file.url;
  };

  const handleGeneralUpload =
    (field: 'profileImage' | 'coverImage' | 'favicon') =>
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setGeneralUploading(field);
      setGeneralError(null);
      try {
        const subCategory =
          field === 'profileImage'
            ? 'profile'
            : field === 'coverImage'
              ? 'cover'
              : 'favicon';
        const url = await uploadAsset(file, subCategory);
        setGeneral((prev) => ({
          ...prev,
          [field]: url,
        }));
        setGeneralStatus('Image uploaded. Save changes to publish.');
      } catch (error) {
        console.error('Failed to upload asset', error);
        setGeneralError('Unable to upload image. Please try again.');
      } finally {
        setGeneralUploading(null);
        event.target.value = '';
      }
    };

  const handleGeneralChange = (field: keyof GeneralState, value: string | boolean) => {
    setGeneral((prev) => ({
      ...prev,
      [field]: value as never,
    }));
  };

  const handleServicesChange = (
    index: number,
    field: keyof VcardServiceItem,
    value: string | number | null,
  ) => {
    setServices((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      if (field === 'price') {
        current.price =
          value === '' || value === null ? null : toNumber(value, 0);
      } else if (field === 'order') {
        current.order = value === '' || value === null ? null : toNumber(value, index);
      } else {
        current[field] = value as never;
      }
      next[index] = current;
      return next;
    });
  };

  const handleProductsChange = (
    index: number,
    field: keyof VcardProductItem,
    value: string | number | boolean | null,
  ) => {
    setProducts((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      if (field === 'price') {
        current.price = toNumber(value, 0);
      } else if (field === 'order') {
        current.order = value === '' || value === null ? null : toNumber(value, index);
      } else if (field === 'inStock') {
        current.inStock = Boolean(value);
      } else {
        current[field] = value as never;
      }
      next[index] = current;
      return next;
    });
  };

  const handleGalleriesChange = (
    index: number,
    field: keyof VcardGalleryItem,
    value: string | number | null,
  ) => {
    setGalleries((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      if (field === 'order') {
        current.order = value === '' || value === null ? null : toNumber(value, index);
      } else {
        current[field] = value as never;
      }
      next[index] = current;
      return next;
    });
  };

  const handleTestimonialsChange = (
    index: number,
    field: keyof VcardTestimonialItem,
    value: string | number | null,
  ) => {
    setTestimonials((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      if (field === 'rating') {
        current.rating =
          value === '' || value === null ? null : Math.min(Math.max(toNumber(value, 0), 1), 5);
      } else if (field === 'order') {
        current.order = value === '' || value === null ? null : toNumber(value, index);
      } else {
        current[field] = value as never;
      }
      next[index] = current;
      return next;
    });
  };

  const handleBusinessHoursChange = (
    index: number,
    field: keyof VcardBusinessHourItem,
    value: string | boolean,
  ) => {
    setBusinessHours((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      if (field === 'isOpen') {
        current.isOpen = Boolean(value);
      } else if (field === 'openTime' || field === 'closeTime') {
        current[field] = value as string;
      }
      next[index] = current;
      return next;
    });
  };

  const handleAppointmentsChange = (
    index: number,
    field: keyof VcardAppointmentItem,
    value: string | number | boolean | null,
  ) => {
    setAppointments((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      if (field === 'duration') {
        current.duration = Math.max(5, toNumber(value, 30));
      } else if (field === 'price') {
        current.price =
          value === '' || value === null ? null : toNumber(value, 0);
      } else if (field === 'available') {
        current.available = Boolean(value);
      } else {
        current[field] = value as never;
      }
      next[index] = current;
      return next;
    });
  };

  const handleSocialLinksChange = (
    index: number,
    field: keyof VcardSocialLinkItem,
    value: string | number | null,
  ) => {
    setSocialLinks((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      if (field === 'order') {
        current.order = value === '' || value === null ? null : toNumber(value, index);
      } else {
        current[field] = value as never;
      }
      next[index] = current;
      return next;
    });
  };

  const handleCustomLinksChange = (
    index: number,
    field: keyof VcardCustomLinkItem,
    value: string | number | null,
  ) => {
    setCustomLinks((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      if (field === 'order') {
        current.order = value === '' || value === null ? null : toNumber(value, index);
      } else {
        current[field] = value as never;
      }
      next[index] = current;
      return next;
    });
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      {
        title: '',
        description: '',
        icon: '',
        image: '',
        price: null,
        order: prev.length,
      },
    ]);
  };

  const addProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        price: 0,
        currencyId: currencies[0]?.id ?? 'USD',
        image: '',
        inStock: true,
        order: prev.length,
      },
    ]);
  };

  const addGalleryItem = () => {
    setGalleries((prev) => [
      ...prev,
      {
        title: '',
        imageUrl: '',
        order: prev.length,
      },
    ]);
  };

  const addTestimonial = () => {
    setTestimonials((prev) => [
      ...prev,
      {
        name: '',
        position: '',
        company: '',
        content: '',
        imageUrl: '',
        rating: 5,
        order: prev.length,
      },
    ]);
  };

  const addAppointment = () => {
    setAppointments((prev) => [
      ...prev,
      {
        title: '',
        description: '',
        duration: 30,
        price: null,
        available: true,
      },
    ]);
  };

  const addSocialLink = () => {
    setSocialLinks((prev) => [
      ...prev,
      {
        platform: '',
        url: '',
        order: prev.length,
      },
    ]);
  };

  const addCustomLink = () => {
    setCustomLinks((prev) => [
      ...prev,
      {
        label: '',
        url: '',
        icon: '',
        order: prev.length,
      },
    ]);
  };

  const removeItem = <T,>(setter: (value: T[]) => void, list: T[], index: number) => {
    setter(list.filter((_, i) => i !== index));
  };

  const sanitizeServicesPayload = () =>
    filterEmpty(services, 'title').map((service, index) => ({
      title: service.title.trim(),
      description: sanitizeString(service.description ?? ''),
      icon: sanitizeString(service.icon ?? ''),
      image: sanitizeString(service.image ?? ''),
      price:
        service.price === undefined || service.price === null
          ? undefined
          : Number(service.price),
      order: service.order ?? index,
    }));

  const sanitizeProductsPayload = () => {
    const payload = filterEmpty(products, 'name').map((product, index) => ({
      name: product.name.trim(),
      description: sanitizeString(product.description ?? ''),
      price: Number(product.price ?? 0),
      currencyId: product.currencyId ?? 'USD',
      image: sanitizeString(product.image ?? ''),
      inStock: product.inStock ?? true,
      order: product.order ?? index,
    }));

    payload.forEach((product) => {
      if (!product.currencyId) {
        product.currencyId = 'USD';
      }
    });

    return payload;
  };

  const sanitizeGalleriesPayload = () =>
    filterEmpty(galleries, 'imageUrl').map((gallery, index) => ({
      title: sanitizeString(gallery.title ?? ''),
      imageUrl: gallery.imageUrl.trim(),
      order: gallery.order ?? index,
    }));

  const sanitizeTestimonialsPayload = () =>
    filterEmpty(testimonials, 'name').map((testimonial, index) => ({
      name: testimonial.name.trim(),
      position: sanitizeString(testimonial.position ?? ''),
      company: sanitizeString(testimonial.company ?? ''),
      content: sanitizeString(testimonial.content ?? ''),
      imageUrl: sanitizeString(testimonial.imageUrl ?? ''),
      rating:
        testimonial.rating === undefined || testimonial.rating === null
          ? undefined
          : Math.min(Math.max(Number(testimonial.rating), 1), 5),
      order: testimonial.order ?? index,
    }));

  const sanitizeBusinessHoursPayload = () =>
    businessHours.map((slot) => ({
      dayOfWeek: slot.dayOfWeek,
      isOpen: !!slot.isOpen,
      openTime: slot.isOpen ? slot.openTime ?? '09:00' : undefined,
      closeTime: slot.isOpen ? slot.closeTime ?? '18:00' : undefined,
    }));

  const sanitizeAppointmentsPayload = () =>
    filterEmpty(appointments, 'title').map((appointment) => ({
      title: appointment.title.trim(),
      description: sanitizeString(appointment.description ?? ''),
      duration: Math.max(5, Number(appointment.duration ?? 30)),
      price:
        appointment.price === undefined || appointment.price === null
          ? undefined
          : Number(appointment.price),
      available: appointment.available ?? true,
    }));

  const sanitizeSocialLinksPayload = () =>
    filterEmpty(socialLinks, 'platform')
      .filter((item) => item.url && item.url.trim().length > 0)
      .map((link, index) => ({
        platform: link.platform.trim(),
        url: link.url.trim(),
        order: link.order ?? index,
      }));

  const sanitizeCustomLinksPayload = () =>
    filterEmpty(customLinks, 'label')
      .filter((item) => item.url && item.url.trim().length > 0)
      .map((link, index) => ({
        label: link.label.trim(),
        url: link.url.trim(),
        icon: sanitizeString(link.icon ?? ''),
        order: link.order ?? index,
      }));

  const handleServiceUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setServicesError(null);
    try {
      const url = await uploadAsset(file, 'service');
      setServices((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], image: url };
        return next;
      });
      setServicesStatus('Image uploaded. Save services to publish.');
    } catch (error) {
      console.error('Failed to upload service image', error);
      setServicesError('Unable to upload image. Please try again.');
    } finally {
      event.target.value = '';
    }
  };

  const handleProductUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProductsError(null);
    try {
      const url = await uploadAsset(file, 'product');
      setProducts((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], image: url };
        return next;
      });
      setProductsStatus('Image uploaded. Save products to publish.');
    } catch (error) {
      console.error('Failed to upload product image', error);
      setProductsError('Unable to upload image. Please try again.');
    } finally {
      event.target.value = '';
    }
  };

  const handleGalleryUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setGalleriesError(null);
    try {
      const url = await uploadAsset(file, 'gallery');
      setGalleries((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], imageUrl: url };
        return next;
      });
      setGalleriesStatus('Image uploaded. Save gallery to publish.');
    } catch (error) {
      console.error('Failed to upload gallery image', error);
      setGalleriesError('Unable to upload image. Please try again.');
    } finally {
      event.target.value = '';
    }
  };

  const handleTestimonialUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setTestimonialsError(null);
    try {
      const url = await uploadAsset(file, 'testimonial');
      setTestimonials((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], imageUrl: url };
        return next;
      });
      setTestimonialsStatus('Image uploaded. Save testimonials to publish.');
    } catch (error) {
      console.error('Failed to upload testimonial image', error);
      setTestimonialsError('Unable to upload image. Please try again.');
    } finally {
      event.target.value = '';
    }
  };

  const handleSaveGeneral = async () => {
    setGeneralSaving(true);
    setGeneralStatus(null);
    setGeneralError(null);

    try {
      const name =
        general.displayName.trim().length > 0
          ? general.displayName.trim()
          : [general.firstName, general.lastName].filter(Boolean).join(' ').trim();

      const payload: Record<string, unknown> = {
        urlAlias: general.urlAlias.trim(),
        firstName: general.firstName.trim(),
        lastName: general.lastName.trim(),
        name,
        email: sanitizeString(general.email),
        phone: sanitizeString(general.phone),
        company: sanitizeString(general.company),
        jobTitle: sanitizeString(general.jobTitle),
        occupation: sanitizeString(general.occupation),
        regionCode: sanitizeString(general.regionCode),
        description: sanitizeString(general.description),
        location: sanitizeString(general.location),
        locationUrl: sanitizeString(general.locationUrl),
        locationEmbedTag: sanitizeString(general.locationEmbedTag),
        profileImage: sanitizeString(general.profileImage),
        coverImage: sanitizeString(general.coverImage),
        favicon: sanitizeString(general.favicon),
        branding: general.branding,
      };

      const response = await api.patch<VcardDetail & { planWarnings?: string[] }>(
        `/vcards/${card.id}`,
        payload,
      );

      hydrateFromCard(response.data);

      const warnings = response.data.planWarnings?.length
        ? response.data.planWarnings.join(' ')
        : null;

      setGeneralStatus(warnings ?? 'Card details updated successfully.');
    } catch (error) {
      console.error('Failed to update card', error);
      setGeneralError('Unable to update card details. Please try again.');
    } finally {
      setGeneralSaving(false);
    }
  };

  const handleSaveSections = async () => {
    setSectionsSaving(true);
    setSectionsStatus(null);
    setSectionsError(null);

    try {
      const response = await api.patch<VcardDetail & { planWarnings?: string[] }>(
        `/vcards/${card.id}`,
        {
          sections: normalizeSectionsState(sectionsState),
        },
      );
      hydrateFromCard(response.data);
      const warnings = response.data.planWarnings?.length
        ? response.data.planWarnings.join(' ')
        : null;
      setSectionsStatus(warnings ?? 'Section visibility updated.');
    } catch (error) {
      console.error('Failed to update sections', error);
      setSectionsError('Unable to update sections. Please review your plan permissions.');
    } finally {
      setSectionsSaving(false);
    }
  };

  const handleSaveServices = async () => {
    setServicesSaving(true);
    setServicesStatus(null);
    setServicesError(null);

    try {
      const payload = sanitizeServicesPayload();
      const response = await api.patch<VcardDetail & { planWarnings?: string[] }>(
        `/vcards/${card.id}`,
        {
          services: payload,
        },
      );
      hydrateFromCard(response.data);
      const warnings = response.data.planWarnings?.length
        ? response.data.planWarnings.join(' ')
        : null;
      setServicesStatus(warnings ?? 'Services updated successfully.');
    } catch (error) {
      console.error('Failed to update services', error);
      setServicesError(
        'Unable to update services. Review your plan limits or try again later.',
      );
    } finally {
      setServicesSaving(false);
    }
  };

  const handleSaveProducts = async () => {
    setProductsSaving(true);
    setProductsStatus(null);
    setProductsError(null);
    try {
      const payload = sanitizeProductsPayload();
      const response = await api.patch<VcardDetail & { planWarnings?: string[] }>(
        `/vcards/${card.id}`,
        {
          products: payload,
        },
      );
      hydrateFromCard(response.data);
      const warnings = response.data.planWarnings?.length
        ? response.data.planWarnings.join(' ')
        : null;
      setProductsStatus(warnings ?? 'Products updated successfully.');
    } catch (error) {
      console.error('Failed to update products', error);
      setProductsError(
        'Unable to update products. Ensure currency and price are provided.',
      );
    } finally {
      setProductsSaving(false);
    }
  };

  const handleSaveGalleries = async () => {
    setGalleriesSaving(true);
    setGalleriesStatus(null);
    setGalleriesError(null);
    try {
      const payload = sanitizeGalleriesPayload();
      const response = await api.patch<VcardDetail & { planWarnings?: string[] }>(
        `/vcards/${card.id}`,
        {
          galleries: payload,
        },
      );
      hydrateFromCard(response.data);
      const warnings = response.data.planWarnings?.length
        ? response.data.planWarnings.join(' ')
        : null;
      setGalleriesStatus(warnings ?? 'Gallery updated successfully.');
    } catch (error) {
      console.error('Failed to update galleries', error);
      setGalleriesError('Unable to update gallery. Please try again.');
    } finally {
      setGalleriesSaving(false);
    }
  };

  const handleSaveTestimonials = async () => {
    setTestimonialsSaving(true);
    setTestimonialsStatus(null);
    setTestimonialsError(null);
    try {
      const payload = sanitizeTestimonialsPayload();
      const response = await api.patch<VcardDetail & { planWarnings?: string[] }>(
        `/vcards/${card.id}`,
        {
          testimonials: payload,
        },
      );
      hydrateFromCard(response.data);
      const warnings = response.data.planWarnings?.length
        ? response.data.planWarnings.join(' ')
        : null;
      setTestimonialsStatus(warnings ?? 'Testimonials updated successfully.');
    } catch (error) {
      console.error('Failed to update testimonials', error);
      setTestimonialsError('Unable to update testimonials. Please try again.');
    } finally {
      setTestimonialsSaving(false);
    }
  };

  const handleSaveBusinessHours = async () => {
    setHoursSaving(true);
    setHoursStatus(null);
    setHoursError(null);
    try {
      const payload = sanitizeBusinessHoursPayload();
      const response = await api.patch<VcardDetail & { planWarnings?: string[] }>(
        `/vcards/${card.id}`,
        {
          businessHours: payload,
        },
      );
      hydrateFromCard(response.data);
      const warnings = response.data.planWarnings?.length
        ? response.data.planWarnings.join(' ')
        : null;
      setHoursStatus(warnings ?? 'Business hours updated successfully.');
    } catch (error) {
      console.error('Failed to update business hours', error);
      setHoursError('Unable to update business hours. Please try again.');
    } finally {
      setHoursSaving(false);
    }
  };

  const handleSaveAppointments = async () => {
    setAppointmentsSaving(true);
    setAppointmentsStatus(null);
    setAppointmentsError(null);
    try {
      const payload = sanitizeAppointmentsPayload();
      const response = await api.patch<VcardDetail & { planWarnings?: string[] }>(
        `/vcards/${card.id}`,
        {
          appointments: payload,
        },
      );
      hydrateFromCard(response.data);
      const warnings = response.data.planWarnings?.length
        ? response.data.planWarnings.join(' ')
        : null;
      setAppointmentsStatus(warnings ?? 'Appointments updated successfully.');
    } catch (error) {
      console.error('Failed to update appointments', error);
      setAppointmentsError('Unable to update appointments. Please try again.');
    } finally {
      setAppointmentsSaving(false);
    }
  };

  const handleSaveSocial = async () => {
    setSocialSaving(true);
    setSocialStatus(null);
    setSocialError(null);
    try {
      const payload = sanitizeSocialLinksPayload();
      const response = await api.patch<VcardDetail & { planWarnings?: string[] }>(
        `/vcards/${card.id}`,
        {
          socialLinks: payload,
        },
      );
      hydrateFromCard(response.data);
      const warnings = response.data.planWarnings?.length
        ? response.data.planWarnings.join(' ')
        : null;
      setSocialStatus(warnings ?? 'Social links updated successfully.');
    } catch (error) {
      console.error('Failed to update social links', error);
      setSocialError('Unable to update social links. Please check the URLs provided.');
    } finally {
      setSocialSaving(false);
    }
  };

  const handleSaveCustomLinks = async () => {
    setCustomSaving(true);
    setCustomStatus(null);
    setCustomError(null);
    try {
      const payload = sanitizeCustomLinksPayload();
      const response = await api.patch<VcardDetail & { planWarnings?: string[] }>(
        `/vcards/${card.id}`,
        {
          customLinks: payload,
        },
      );
      hydrateFromCard(response.data);
      const warnings = response.data.planWarnings?.length
        ? response.data.planWarnings.join(' ')
        : null;
      setCustomStatus(warnings ?? 'Custom links updated successfully.');
    } catch (error) {
      console.error('Failed to update custom links', error);
      setCustomError('Unable to update custom links. Please verify the URLs.');
    } finally {
      setCustomSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="hidden flex-1 bg-slate-900/60 md:block" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-5xl flex-col overflow-y-auto bg-white shadow-xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Editing card
            </p>
            <h2 className="text-xl font-semibold text-slate-900">{card.name}</h2>
            <p className="text-sm text-slate-600">Customize sections, content, and branding.</p>
            {planWarningsMessage && (
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {planWarningsMessage}
              </p>
            )}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </header>

        <div className="flex-1 space-y-8 px-6 py-6">
          <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  General information
                </h3>
                <p className="text-sm text-slate-600">
                  Update headline details, contact info, and branding.
                </p>
              </div>
              <Button
                onClick={handleSaveGeneral}
                disabled={generalSaving}
              >
                {generalSaving ? 'Saving…' : 'Save details'}
              </Button>
            </div>

            {generalStatus && (
              <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {generalStatus}
              </p>
            )}
            {generalError && (
              <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {generalError}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={general.displayName}
                  onChange={(event) =>
                    handleGeneralChange('displayName', event.target.value)
                  }
                  placeholder="IVGK Digital Cards"
                />
              </div>
              <div>
                <Label htmlFor="urlAlias">Public alias</Label>
                <Input
                  id="urlAlias"
                  value={general.urlAlias}
                  onChange={(event) =>
                    handleGeneralChange('urlAlias', event.target.value.replace(/\s+/g, '-'))
                  }
                  placeholder="your-brand-name"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Changing the alias updates the public URL.
                </p>
              </div>
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={general.firstName}
                  onChange={(event) =>
                    handleGeneralChange('firstName', event.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={general.lastName}
                  onChange={(event) =>
                    handleGeneralChange('lastName', event.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="jobTitle">Role / Job title</Label>
                <Input
                  id="jobTitle"
                  value={general.jobTitle}
                  onChange={(event) =>
                    handleGeneralChange('jobTitle', event.target.value)
                  }
                  placeholder="Founder & CEO"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={general.company}
                  onChange={(event) =>
                    handleGeneralChange('company', event.target.value)
                  }
                  placeholder="IVGK Digital Cards"
                />
              </div>
              <div>
                <Label htmlFor="email">Primary email</Label>
                <Input
                  id="email"
                  value={general.email}
                  onChange={(event) =>
                    handleGeneralChange('email', event.target.value)
                  }
                  placeholder="hello@ivgk.in"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  value={general.phone}
                  onChange={(event) =>
                    handleGeneralChange('phone', event.target.value)
                  }
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <Label htmlFor="regionCode">Region code</Label>
                <Input
                  id="regionCode"
                  value={general.regionCode}
                  onChange={(event) =>
                    handleGeneralChange('regionCode', event.target.value)
                  }
                  placeholder="IN"
                />
              </div>
              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={general.occupation}
                  onChange={(event) =>
                    handleGeneralChange('occupation', event.target.value)
                  }
                  placeholder="Brand Strategist"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Bio / description</Label>
                <textarea
                  id="description"
                  value={general.description}
                  onChange={(event) =>
                    handleGeneralChange('description', event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  rows={4}
                  placeholder="Tell visitors about your expertise, story, and mission."
                />
              </div>
              <div>
                <Label htmlFor="location">Address / location</Label>
                <Input
                  id="location"
                  value={general.location}
                  onChange={(event) =>
                    handleGeneralChange('location', event.target.value)
                  }
                  placeholder="HSR Layout, Bengaluru"
                />
              </div>
              <div>
                <Label htmlFor="locationUrl">Location / website URL</Label>
                <Input
                  id="locationUrl"
                  value={general.locationUrl}
                  onChange={(event) =>
                    handleGeneralChange('locationUrl', event.target.value)
                  }
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="locationEmbedTag">Map or iframe embed</Label>
                <textarea
                  id="locationEmbedTag"
                  value={general.locationEmbedTag}
                  onChange={(event) =>
                    handleGeneralChange('locationEmbedTag', event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  rows={3}
                  placeholder='<iframe src="https://maps.google.com/..."></iframe>'
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-4 rounded-md border border-slate-200 bg-white p-4">
                <div className="flex flex-col">
                  <Label>Profile image</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <Input
                      value={general.profileImage}
                      onChange={(event) =>
                        handleGeneralChange('profileImage', event.target.value)
                      }
                      placeholder="https://..."
                    />
                    <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleGeneralUpload('profileImage')}
                        disabled={generalUploading === 'profileImage'}
                      />
                      {generalUploading === 'profileImage' ? 'Uploading…' : 'Upload'}
                    </label>
                  </div>
                </div>
                <div className="flex flex-col">
                  <Label>Cover image</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <Input
                      value={general.coverImage}
                      onChange={(event) =>
                        handleGeneralChange('coverImage', event.target.value)
                      }
                      placeholder="https://..."
                    />
                    <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleGeneralUpload('coverImage')}
                        disabled={generalUploading === 'coverImage'}
                      />
                      {generalUploading === 'coverImage' ? 'Uploading…' : 'Upload'}
                    </label>
                  </div>
                </div>
                <div className="flex flex-col">
                  <Label>Favicon</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <Input
                      value={general.favicon}
                      onChange={(event) =>
                        handleGeneralChange('favicon', event.target.value)
                      }
                      placeholder="https://..."
                    />
                    <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleGeneralUpload('favicon')}
                        disabled={generalUploading === 'favicon'}
                      />
                      {generalUploading === 'favicon' ? 'Uploading…' : 'Upload'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  id="branding"
                  checked={general.branding}
                  onChange={(event) =>
                    handleGeneralChange('branding', event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="branding" className="text-sm text-slate-700">
                  Show IVGK branding on the public card
                </Label>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Section visibility
                </h3>
                <p className="text-sm text-slate-600">
                  Enable the sections you want to display on the public digital card.
                </p>
              </div>
              <Button onClick={handleSaveSections} disabled={sectionsSaving}>
                {sectionsSaving ? 'Saving…' : 'Save sections'}
              </Button>
            </div>

            {sectionsStatus && (
              <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {sectionsStatus}
              </p>
            )}
            {sectionsError && (
              <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {sectionsError}
              </p>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={sectionsState.header}
                  onChange={(event) =>
                    setSectionsState((prev) => ({
                      ...prev,
                      header: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">Hero header</p>
                  <p className="text-xs text-slate-500">
                    Display the hero section with name, title, and CTA buttons.
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={sectionsState.contactList}
                  onChange={(event) =>
                    setSectionsState((prev) => ({
                      ...prev,
                      contactList: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">Contact actions</p>
                  <p className="text-xs text-slate-500">
                    Show phone, email, WhatsApp, and save-contact buttons.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {SECTION_TOGGLES.map((toggle) => (
                <label
                  key={toggle.key}
                  className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={sectionsState[toggle.key]}
                    onChange={(event) =>
                      setSectionsState((prev) => ({
                        ...prev,
                        [toggle.key]: event.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{toggle.label}</p>
                    <p className="text-xs text-slate-500">{toggle.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Services
                </h3>
                <p className="text-sm text-slate-600">
                  Present your signature services with pricing and visuals.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={addService}>
                  Add service
                </Button>
                <Button onClick={handleSaveServices} disabled={servicesSaving}>
                  {servicesSaving ? 'Saving…' : 'Save services'}
                </Button>
              </div>
            </div>

            {servicesStatus && (
              <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {servicesStatus}
              </p>
            )}
            {servicesError && (
              <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {servicesError}
              </p>
            )}

            {services.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No services added yet. Create your first service to highlight offerings.
              </p>
            ) : (
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div
                    key={`service-${index}`}
                    className="rounded-md border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        Service #{index + 1}
                      </p>
                      <Button
                        variant="ghost"
                        onClick={() => removeItem(setServices, services, index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={service.title}
                          onChange={(event) =>
                            handleServicesChange(index, 'title', event.target.value)
                          }
                          placeholder="Brand identity design"
                        />
                      </div>
                      <div>
                        <Label>Icon (optional)</Label>
                        <Input
                          value={service.icon ?? ''}
                          onChange={(event) =>
                            handleServicesChange(index, 'icon', event.target.value)
                          }
                          placeholder="ph-sparkle"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Description</Label>
                        <textarea
                          value={service.description ?? ''}
                          onChange={(event) =>
                            handleServicesChange(index, 'description', event.target.value)
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          rows={2}
                          placeholder="Outline deliverables, approach, or unique value."
                        />
                      </div>
                      <div>
                        <Label>Price</Label>
                        <Input
                          type="number"
                          value={service.price ?? ''}
                          onChange={(event) =>
                            handleServicesChange(index, 'price', event.target.value === '' ? null : Number(event.target.value))
                          }
                          placeholder="149"
                        />
                      </div>
                      <div>
                        <Label>Display order</Label>
                        <Input
                          type="number"
                          value={service.order ?? index}
                          onChange={(event) =>
                            handleServicesChange(index, 'order', event.target.value)
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Service image</Label>
                        <div className="mt-1 flex items-center gap-3">
                          <Input
                            value={service.image ?? ''}
                            onChange={(event) =>
                              handleServicesChange(index, 'image', event.target.value)
                            }
                            placeholder="https://..."
                          />
                          <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => void handleServiceUpload(event, index)}
                            />
                            Upload
                          </label>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Upload a feature image or paste an hosted URL.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Products & Packages
                </h3>
                <p className="text-sm text-slate-600">
                  Showcase products, signature packages, or pricing tiers.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={addProduct}>
                  Add product
                </Button>
                <Button onClick={handleSaveProducts} disabled={productsSaving}>
                  {productsSaving ? 'Saving…' : 'Save products'}
                </Button>
              </div>
            </div>

          {productsStatus && (
              <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {productsStatus}
              </p>
            )}
            {productsError && (
              <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {productsError}
              </p>
            )}

            {products.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No products added yet. Add products to upsell offerings from your card.
              </p>
            ) : (
              <div className="space-y-4">
                {products.map((product, index) => (
                  <div
                    key={`product-${index}`}
                    className="rounded-md border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        Product #{index + 1}
                      </p>
                      <Button
                        variant="ghost"
                        onClick={() => removeItem(setProducts, products, index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={product.name}
                          onChange={(event) =>
                            handleProductsChange(index, 'name', event.target.value)
                          }
                          placeholder="Premium NFC Card Kit"
                        />
                      </div>
                      <div>
                        <Label>Currency</Label>
                        <select
                          value={product.currencyId}
                          onChange={(event) =>
                            handleProductsChange(index, 'currencyId', event.target.value)
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {currenciesLoading && <option>Loading…</option>}
                          {currencies.map((currency) => (
                            <option key={currency.id} value={currency.id}>
                              {currency.code} {currency.symbol ? `(${currency.symbol})` : ''}
                            </option>
                          ))}
                        </select>
                        {currenciesError && (
                          <p className="mt-1 text-xs text-amber-600">{currenciesError}</p>
                        )}
                      </div>
                      <div>
                        <Label>Price</Label>
                        <Input
                          type="number"
                          value={product.price}
                          onChange={(event) =>
                            handleProductsChange(index, 'price', Number(event.target.value))
                          }
                          placeholder="499"
                        />
                      </div>
                      <div>
                        <Label>In stock</Label>
                        <div className="mt-2 flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={product.inStock}
                            onChange={(event) =>
                              handleProductsChange(index, 'inStock', event.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-slate-600">
                            Allow customers to order or enquire.
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label>Display order</Label>
                        <Input
                          type="number"
                          value={product.order ?? index}
                          onChange={(event) =>
                            handleProductsChange(index, 'order', event.target.value)
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Description</Label>
                        <textarea
                          value={product.description ?? ''}
                          onChange={(event) =>
                            handleProductsChange(index, 'description', event.target.value)
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          rows={2}
                          placeholder="Describe product features, materials, or inclusions."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Product image</Label>
                        <div className="mt-1 flex items-center gap-3">
                          <Input
                            value={product.image ?? ''}
                            onChange={(event) =>
                              handleProductsChange(index, 'image', event.target.value)
                            }
                            placeholder="https://..."
                          />
                          <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => void handleProductUpload(event, index)}
                            />
                            Upload
                          </label>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Upload product imagery or share hosted assets.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Gallery
                </h3>
                <p className="text-sm text-slate-600">
                  Share your work, team culture, or behind-the-scenes visuals.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={addGalleryItem}>
                  Add image
                </Button>
                <Button onClick={handleSaveGalleries} disabled={galleriesSaving}>
                  {galleriesSaving ? 'Saving…' : 'Save gallery'}
                </Button>
              </div>
            </div>

            {galleriesStatus && (
              <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {galleriesStatus}
              </p>
            )}
            {galleriesError && (
              <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {galleriesError}
              </p>
            )}

            {galleries.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No gallery images added yet. Add image URLs or upload assets to create a visual
                gallery.
              </p>
            ) : (
              <div className="space-y-4">
                {galleries.map((item, index) => (
                  <div
                    key={`gallery-${index}`}
                    className="rounded-md border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        Gallery item #{index + 1}
                      </p>
                      <Button
                        variant="ghost"
                        onClick={() => removeItem(setGalleries, galleries, index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Title / caption</Label>
                        <Input
                          value={item.title ?? ''}
                          onChange={(event) =>
                            handleGalleriesChange(index, 'title', event.target.value)
                          }
                          placeholder="New store launch"
                        />
                      </div>
                      <div>
                        <Label>Display order</Label>
                        <Input
                          type="number"
                          value={item.order ?? index}
                          onChange={(event) =>
                            handleGalleriesChange(index, 'order', event.target.value)
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Gallery image</Label>
                        <div className="mt-1 flex items-center gap-3">
                          <Input
                            value={item.imageUrl}
                            onChange={(event) =>
                              handleGalleriesChange(index, 'imageUrl', event.target.value)
                            }
                            placeholder="https://..."
                          />
                          <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => void handleGalleryUpload(event, index)}
                            />
                            Upload
                          </label>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Use high-resolution imagery to make your gallery pop.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Testimonials
                </h3>
                <p className="text-sm text-slate-600">
                  Build credibility with real client success stories.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={addTestimonial}>
                  Add testimonial
                </Button>
                <Button onClick={handleSaveTestimonials} disabled={testimonialsSaving}>
                  {testimonialsSaving ? 'Saving…' : 'Save testimonials'}
                </Button>
              </div>
            </div>

            {testimonialsStatus && (
              <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {testimonialsStatus}
              </p>
            )}
            {testimonialsError && (
              <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {testimonialsError}
              </p>
            )}

            {testimonials.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No testimonials yet. Share quotes to highlight trust and impact.
              </p>
            ) : (
              <div className="space-y-4">
                {testimonials.map((item, index) => (
                  <div
                    key={`testimonial-${index}`}
                    className="rounded-md border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        Testimonial #{index + 1}
                      </p>
                      <Button
                        variant="ghost"
                        onClick={() => removeItem(setTestimonials, testimonials, index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={item.name}
                          onChange={(event) =>
                            handleTestimonialsChange(index, 'name', event.target.value)
                          }
                          placeholder="Priya Sharma"
                        />
                      </div>
                      <div>
                        <Label>Role / company</Label>
                        <Input
                          value={item.company ?? ''}
                          onChange={(event) =>
                            handleTestimonialsChange(index, 'company', event.target.value)
                          }
                          placeholder="Marketing Director, Brightwave Media"
                        />
                      </div>
                      <div>
                        <Label>Rating</Label>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={item.rating ?? ''}
                          onChange={(event) =>
                            handleTestimonialsChange(index, 'rating', event.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Display order</Label>
                        <Input
                          type="number"
                          value={item.order ?? index}
                          onChange={(event) =>
                            handleTestimonialsChange(index, 'order', event.target.value)
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Quote</Label>
                        <textarea
                          value={item.content ?? ''}
                          onChange={(event) =>
                            handleTestimonialsChange(index, 'content', event.target.value)
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          rows={2}
                          placeholder="Share tangible results or impact achieved."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Headshot (optional)</Label>
                        <div className="mt-1 flex items-center gap-3">
                          <Input
                            value={item.imageUrl ?? ''}
                            onChange={(event) =>
                              handleTestimonialsChange(index, 'imageUrl', event.target.value)
                            }
                            placeholder="https://..."
                          />
                          <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => void handleTestimonialUpload(event, index)}
                            />
                            Upload
                          </label>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Add a friendly face to reinforce authenticity.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Business hours
                </h3>
                <p className="text-sm text-slate-600">
                  Clarify your availability for walk-ins, calls, or support.
                </p>
              </div>
              <Button onClick={handleSaveBusinessHours} disabled={hoursSaving}>
                {hoursSaving ? 'Saving…' : 'Save hours'}
              </Button>
            </div>

            {hoursStatus && (
              <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {hoursStatus}
              </p>
            )}
            {hoursError && (
              <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {hoursError}
              </p>
            )}

            <div className="space-y-3">
              {businessHours.map((slot, index) => (
                <div
                  key={`hours-${index}`}
                  className="grid gap-3 rounded-md border border-slate-200 bg-slate-50/60 p-3 md:grid-cols-4"
                >
                  <div className="md:col-span-1">
                    <p className="text-sm font-medium text-slate-700">
                      {DAY_NAMES[slot.dayOfWeek]}
                    </p>
                    <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={slot.isOpen}
                        onChange={(event) =>
                          handleBusinessHoursChange(index, 'isOpen', event.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Open
                    </label>
                  </div>
                  <div className="md:col-span-1">
                    <Label>Opens</Label>
                    <Input
                      type="time"
                      value={slot.openTime ?? ''}
                      disabled={!slot.isOpen}
                      onChange={(event) =>
                        handleBusinessHoursChange(index, 'openTime', event.target.value)
                      }
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label>Closes</Label>
                    <Input
                      type="time"
                      value={slot.closeTime ?? ''}
                      disabled={!slot.isOpen}
                      onChange={(event) =>
                        handleBusinessHoursChange(index, 'closeTime', event.target.value)
                      }
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <p className="text-xs text-slate-500">
                      Leave times blank for fully closed days.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Appointments
                </h3>
                <p className="text-sm text-slate-600">
                  Offer bookable sessions such as consultations or demos.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={addAppointment}>
                  Add slot
                </Button>
                <Button onClick={handleSaveAppointments} disabled={appointmentsSaving}>
                  {appointmentsSaving ? 'Saving…' : 'Save appointments'}
                </Button>
              </div>
            </div>

            {appointmentsStatus && (
              <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {appointmentsStatus}
              </p>
            )}
            {appointmentsError && (
              <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {appointmentsError}
              </p>
            )}

            {appointments.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No appointment slots defined yet. Add slots to accept bookings directly from the
                card.
              </p>
            ) : (
              <div className="space-y-4">
                {appointments.map((item, index) => (
                  <div
                    key={`appointment-${index}`}
                    className="rounded-md border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        Appointment #{index + 1}
                      </p>
                      <Button
                        variant="ghost"
                        onClick={() => removeItem(setAppointments, appointments, index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={item.title}
                          onChange={(event) =>
                            handleAppointmentsChange(index, 'title', event.target.value)
                          }
                          placeholder="Strategy consultation"
                        />
                      </div>
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          min={5}
                          value={item.duration}
                          onChange={(event) =>
                            handleAppointmentsChange(index, 'duration', Number(event.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label>Price (optional)</Label>
                        <Input
                          type="number"
                          value={item.price ?? ''}
                          onChange={(event) =>
                            handleAppointmentsChange(
                              index,
                              'price',
                              event.target.value === '' ? null : Number(event.target.value),
                            )
                          }
                          placeholder="199"
                        />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={item.available}
                            onChange={(event) =>
                              handleAppointmentsChange(index, 'available', event.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Available for booking
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <Label>Description</Label>
                        <textarea
                          value={item.description ?? ''}
                          onChange={(event) =>
                            handleAppointmentsChange(index, 'description', event.target.value)
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          rows={2}
                          placeholder="Add session agenda, preparation steps, or meeting mode."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Social links
                </h3>
                <p className="text-sm text-slate-600">
                  Drive traffic to your primary social media channels.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={addSocialLink}>
                  Add link
                </Button>
                <Button onClick={handleSaveSocial} disabled={socialSaving}>
                  {socialSaving ? 'Saving…' : 'Save social links'}
                </Button>
              </div>
            </div>

            {socialStatus && (
              <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {socialStatus}
              </p>
            )}
            {socialError && (
              <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {socialError}
              </p>
            )}

            {socialLinks.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No social links added yet. Add your most important social touchpoints.
              </p>
            ) : (
              <div className="space-y-4">
                {socialLinks.map((item, index) => (
                  <div
                    key={`social-${index}`}
                    className="rounded-md border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        Link #{index + 1}
                      </p>
                      <Button
                        variant="ghost"
                        onClick={() => removeItem(setSocialLinks, socialLinks, index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Platform</Label>
                        <Input
                          value={item.platform}
                          onChange={(event) =>
                            handleSocialLinksChange(index, 'platform', event.target.value)
                          }
                          placeholder="LinkedIn"
                        />
                      </div>
                      <div>
                        <Label>Display order</Label>
                        <Input
                          type="number"
                          value={item.order ?? index}
                          onChange={(event) =>
                            handleSocialLinksChange(index, 'order', event.target.value)
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>URL</Label>
                        <Input
                          value={item.url}
                          onChange={(event) =>
                            handleSocialLinksChange(index, 'url', event.target.value)
                          }
                          placeholder="https://linkedin.com/company/ivgk"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Custom links
                </h3>
                <p className="text-sm text-slate-600">
                  Add resource links, downloadables, or booking pages.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={addCustomLink}>
                  Add link
                </Button>
                <Button onClick={handleSaveCustomLinks} disabled={customSaving}>
                  {customSaving ? 'Saving…' : 'Save custom links'}
                </Button>
              </div>
            </div>

            {customStatus && (
              <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {customStatus}
              </p>
            )}
            {customError && (
              <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {customError}
              </p>
            )}

            {customLinks.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No custom links added yet. Add important calls to action or downloads.
              </p>
            ) : (
              <div className="space-y-4">
                {customLinks.map((item, index) => (
                  <div
                    key={`custom-${index}`}
                    className="rounded-md border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        Link #{index + 1}
                      </p>
                      <Button
                        variant="ghost"
                        onClick={() => removeItem(setCustomLinks, customLinks, index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Label</Label>
                        <Input
                          value={item.label}
                          onChange={(event) =>
                            handleCustomLinksChange(index, 'label', event.target.value)
                          }
                          placeholder="Portfolio"
                        />
                      </div>
                      <div>
                        <Label>Icon (optional)</Label>
                        <Input
                          value={item.icon ?? ''}
                          onChange={(event) =>
                            handleCustomLinksChange(index, 'icon', event.target.value)
                          }
                          placeholder="ph-briefcase"
                        />
                      </div>
                      <div>
                        <Label>Display order</Label>
                        <Input
                          type="number"
                          value={item.order ?? index}
                          onChange={(event) =>
                            handleCustomLinksChange(index, 'order', event.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>URL</Label>
                        <Input
                          value={item.url}
                          onChange={(event) =>
                            handleCustomLinksChange(index, 'url', event.target.value)
                          }
                          placeholder="https://ivgk.in/portfolio"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

