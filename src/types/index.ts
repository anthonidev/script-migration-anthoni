export interface ScrapedDoctor {
  fullName: string;
  specialty: string;
  city: string;
  address: string;
  phoneCountryCode: string;
  phoneNumber: string;
  rating: number;
  reviewCount: number;
  sourceProfileUrl: string;
  treatments: { name: string; price?: number; currency?: string }[];
  availability: { startAt: string; endAt: string; modality: 'in_person' | 'online' }[];
}

export interface GeneratedPatient {
  fullName: string;
  documentNumber: string;
  phoneNumber: string;
  email: string;
}
