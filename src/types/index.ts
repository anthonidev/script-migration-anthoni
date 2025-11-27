export interface Treatment {
  name: string;
  price?: number;
  currency?: string;
}

export interface Availability {
  startAt: string;
  endAt: string;
  modality: 'in_person' | 'online';
}

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
  treatments: Treatment[];
  availability: Availability[];
}

export interface GeneratedPatient {
  fullName: string;
  documentNumber: string;
  phoneNumber: string;
  email: string;
}
