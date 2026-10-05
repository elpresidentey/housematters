const API_BASE = '/api';

type ApiOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new ApiError(
      json?.error?.message || `Request failed (${res.status})`,
      json?.error?.code || 'UNKNOWN_ERROR',
    );
  }

  return json.data as T;
}

// Auth helpers
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

export function setToken(token: string) {
  localStorage.setItem('authToken', token);
}

export function clearToken() {
  localStorage.removeItem('authToken');
}

// Property types
export type ApiProperty = {
  id: string;
  title: string;
  description: string;
  rent: number;
  price?: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area: number | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  amenities: string[] | string;
  images: string[] | string;
  landlord_id: string;
  landlord_name?: string;
  landlord_phone?: string;
  landlord_email?: string;
  landlord_verified?: number | boolean;
  moderation_status?: string;
  expires_at?: string | null;
  active: boolean | number;
  created_at: string;
  updated_at?: string;
};

export type PaginatedProperties = {
  properties: ApiProperty[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProperties: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

// Auth types
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  userType: string;
  createdAt?: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

// Upload property photos. Returns the URLs to store on the listing.
export async function uploadImages(files: File[], token: string): Promise<string[]> {
  const form = new FormData();
  for (const file of files) form.append('images', file);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/uploads/multiple`, {
    method: 'POST',
    headers,
    body: form,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new ApiError(
      json?.error?.message || `Upload failed (${res.status})`,
      json?.error?.code || 'UPLOAD_ERROR',
    );
  }

  return (json.data.files as { url: string; key: string }[]).map(f => f.url);
}

// New trust / transaction types
export type SavedSearch = {
  id: string;
  name: string;
  filters: Record<string, string | number>;
  alerts_enabled: number;
  last_alerted_at?: string | null;
  created_at: string;
};

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  is_read: number;
  created_at: string;
};

export type Agreement = {
  id: string;
  booking_id: string;
  tenant_id: string;
  landlord_id: string;
  property_id: string;
  property_title?: string;
  annual_rent: number;
  service_charge: number;
  caution_deposit: number;
  duration_months: number;
  start_date: string;
  terms?: string;
  status: 'draft' | 'sent' | 'signed' | 'void';
  tenant_name?: string;
  landlord_name?: string;
  created_at: string;
};

export type Payment = {
  id: string;
  amount: number;
  currency: string;
  payment_type: string;
  reference?: string;
  status: string;
  property_title?: string;
  paid_at?: string;
  created_at: string;
};

export type PublicProfile = {
  id: string;
  name: string;
  role: string;
  phone?: string;
  is_verified: boolean;
  member_since: string;
  listingCount: number;
  rating: number | null;
  reviewCount: number;
};
