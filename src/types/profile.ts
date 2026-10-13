export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  avatar_url: string;
  default_currency: string;
  timezone: string;
  locale: string;
  updated_at?: string;
}

export interface UserProfileRow {
  id: string;
  name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  default_currency?: string | null;
  timezone?: string | null;
  locale?: string | null;
  updated_at?: string | null;
}

export interface UserProfileInput {
  name: string;
  phone: string;
  avatar_url: string;
  default_currency: string;
  timezone: string;
  locale: string;
}

export function normalizeProfile(row: UserProfileRow, fallbackName = "") : UserProfile {
  return {
    id: row.id,
    name: row.name?.trim() || fallbackName,
    phone: row.phone?.trim() || "",
    avatar_url: row.avatar_url?.trim() || "",
    default_currency: row.default_currency?.trim().toUpperCase() || "INR",
    timezone: row.timezone?.trim() || "Asia/Calcutta",
    locale: row.locale?.trim() || "en-IN",
    updated_at: row.updated_at ?? undefined,
  };
}

