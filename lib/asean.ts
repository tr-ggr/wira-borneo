/**
 * ASEAN member states — coordinates, country codes, and bounding box.
 * Includes all 11 member states:
 * Brunei, Cambodia, Indonesia, Laos, Malaysia, Myanmar,
 * Philippines, Singapore, Thailand, Timor-Leste, Vietnam.
 */

export const ASEAN_COUNTRY_CODES = [
  "BN", // Brunei
  "KH", // Cambodia
  "ID", // Indonesia
  "LA", // Laos
  "MY", // Malaysia
  "MM", // Myanmar
  "PH", // Philippines
  "SG", // Singapore
  "TH", // Thailand
  "TL", // Timor-Leste
  "VN", // Vietnam
] as const;

export type AseanCountryCode = (typeof ASEAN_COUNTRY_CODES)[number];

export interface AseanCountry {
  code: AseanCountryCode;
  name: string;
  capital: string;
  lat: number;
  lon: number;
  emoji: string;
}

export const ASEAN_COUNTRIES: AseanCountry[] = [
  { code: "BN", name: "Brunei",       capital: "Bandar Seri Begawan", lat: 4.9031,  lon: 114.9398, emoji: "🇧🇳" },
  { code: "KH", name: "Cambodia",     capital: "Phnom Penh",          lat: 11.5449, lon: 104.8922, emoji: "🇰🇭" },
  { code: "ID", name: "Indonesia",    capital: "Jakarta",             lat: -6.2088, lon: 106.8456, emoji: "🇮🇩" },
  { code: "LA", name: "Laos",         capital: "Vientiane",           lat: 17.9757, lon: 102.6331, emoji: "🇱🇦" },
  { code: "MY", name: "Malaysia",     capital: "Kuala Lumpur",        lat: 3.1390,  lon: 101.6869, emoji: "🇲🇾" },
  { code: "MM", name: "Myanmar",      capital: "Naypyidaw",           lat: 19.7633, lon: 96.0785,  emoji: "🇲🇲" },
  { code: "PH", name: "Philippines",  capital: "Manila",              lat: 14.5995, lon: 120.9842, emoji: "🇵🇭" },
  { code: "SG", name: "Singapore",    capital: "Singapore",           lat: 1.3521,  lon: 103.8198, emoji: "🇸🇬" },
  { code: "TH", name: "Thailand",     capital: "Bangkok",             lat: 13.7563, lon: 100.5018, emoji: "🇹🇭" },
  { code: "TL", name: "Timor-Leste",  capital: "Dili",                lat: -8.5569, lon: 125.5762, emoji: "🇹🇱" },
  { code: "VN", name: "Vietnam",      capital: "Hanoi",               lat: 21.0285, lon: 105.8542, emoji: "🇻🇳" },
];

/**
 * ASEAN bounding box in WGS84 degrees.
 * Covers all 11 member states from Myanmar west coast to Philippines east,
 * and from Vietnam north to Indonesia south.
 */
export const ASEAN_BBOX_WGS84 = {
  west:  92.0,
  south: -11.5,
  east:  141.0,
  north:  28.5,
} as const;

/** Centre of the ASEAN region for initial map view */
export const ASEAN_CENTER_WGS84 = { lat: 10.0, lon: 115.0 } as const;

/** Default zoom level for the initial map view */
export const ASEAN_DEFAULT_ZOOM = 4.5;
export const ASEAN_MIN_ZOOM = 3.5;
export const ASEAN_MAX_ZOOM = 14;
