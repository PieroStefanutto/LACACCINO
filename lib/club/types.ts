export type Member = {
  id: string;
  member_number: string;
  card_identifier: string;
  status: "active" | "suspended" | "closed";
  joined_at: string;
  preferred_location: string | null;
  order_notifications: boolean;
  revision: number;
};
export type Location = {
  id: string;
  name: string;
  status: string;
  confirmed: boolean;
  address: string;
  latitude: number | null;
  longitude: number | null;
  hours: string;
  exceptions: string;
  amenities: string;
  contact: string;
};
export type Variant = {
  id: string;
  drink: string;
  size: string;
  temperature: string;
  milk: string;
  extras: string;
};
export type Favourite = Variant & {
  nickname: string;
  variant_id: string;
  available: boolean;
};
export type Reward = {
  id: string;
  title: string;
  description: string;
  points: number;
  conditions: string;
  location_id: string | null;
  starts_at: string;
  ends_at: string | null;
  active: boolean;
};
export type Redemption = {
  id: string;
  title: string;
  points: number;
  conditions: string;
  location_id: string | null;
  expires_at: string | null;
  status: "reserved" | "fulfilled" | "cancelled";
  created_at: string;
};
export type Content = {
  id: string;
  title: string;
  body: string;
  kind: "news" | "event" | "promotion";
  image_path: string;
  location_id: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
};
export type ClubSnapshot = {
  initial_password: string | null;
  member: Member | null;
  profile: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  } | null;
  balance: number;
  newsletter: boolean;
  entries: {
    id: string;
    amount: number;
    reason: string;
    kind: string;
    created_at: string;
  }[];
  favourites: Favourite[];
  variants: Variant[];
  rewards: Reward[];
  redemptions: Redemption[];
  locations: Location[];
  content: Content[];
  events: string[];
  notifications: {
    id: string;
    category: string;
    title: string;
    body: string;
    read_at: string | null;
    created_at: string;
  }[];
  deletion: { id: string; status: string; created_at: string } | null;
  role: "customer" | "employee" | "manager" | "administrator";
  privileged: boolean;
  work_locations: Location[];
};
export type AdminRecord = Record<string, string | number | boolean | null>;
export type AdminSnapshot = {
  locations: AdminRecord[];
  drinks: AdminRecord[];
  variants: AdminRecord[];
  rewards: AdminRecord[];
  rules: AdminRecord[];
  content: AdminRecord[];
  staff: AdminRecord[];
  roles: AdminRecord[];
  members: AdminRecord[];
  deletions: AdminRecord[];
  audit: AdminRecord[];
  metrics: {
    active_members: number;
    awarded_30_days: number;
    fulfilled_30_days: number;
    since: string;
    until: string;
  };
};
