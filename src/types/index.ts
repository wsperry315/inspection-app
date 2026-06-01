export type Role = "landlord" | "tenant";
export type InspectionType = "move_in" | "move_out";
export type InspectionStatus = "pending" | "in_progress" | "completed";
export type Condition = "excellent" | "good" | "fair" | "poor" | "na";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Property {
  id: string;
  landlord_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  created_at: string;
}

export interface Inspection {
  id: string;
  property_id: string;
  landlord_id: string;
  tenant_id: string | null;
  tenant_email: string | null;
  tenant_name: string | null;
  type: InspectionType;
  status: InspectionStatus;
  signature_data_url: string | null;
  submitted_at: string | null;
  notes: string | null;
  created_at: string;
  property?: Property;
}

export interface InspectionRoom {
  id: string;
  inspection_id: string;
  name: string;
  sort_order: number;
  items?: InspectionItem[];
}

export interface InspectionItem {
  id: string;
  room_id: string;
  name: string;
  condition: Condition | null;
  notes: string | null;
  sort_order: number;
  photos?: InspectionPhoto[];
}

export interface InspectionPhoto {
  id: string;
  item_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export const DEFAULT_ROOMS = [
  {
    name: "Entry / Foyer",
    items: ["Front Door", "Locks", "Flooring", "Walls", "Ceiling", "Light Fixtures"],
  },
  {
    name: "Living Room",
    items: ["Flooring", "Walls", "Ceiling", "Windows", "Light Fixtures", "Outlets/Switches"],
  },
  {
    name: "Kitchen",
    items: [
      "Countertops",
      "Cabinets",
      "Sink & Faucet",
      "Refrigerator",
      "Stove/Oven",
      "Dishwasher",
      "Flooring",
      "Walls",
    ],
  },
  {
    name: "Primary Bedroom",
    items: ["Flooring", "Walls", "Ceiling", "Closet", "Windows", "Light Fixtures", "Outlets/Switches"],
  },
  {
    name: "Bathroom",
    items: ["Toilet", "Sink & Faucet", "Shower/Tub", "Mirror", "Flooring", "Walls", "Ventilation Fan"],
  },
  {
    name: "Laundry",
    items: ["Washer Hookup", "Dryer Hookup", "Flooring", "Walls"],
  },
  {
    name: "Garage / Parking",
    items: ["Garage Door", "Opener", "Flooring", "Walls"],
  },
  {
    name: "Exterior",
    items: ["Front Yard", "Backyard", "Driveway", "Fence", "Gutters"],
  },
];
