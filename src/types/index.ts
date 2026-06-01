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
  bedrooms: number;
  bathrooms: number;
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

const BEDROOM_ITEMS = ["Flooring", "Walls", "Ceiling", "Closet", "Windows", "Light Fixtures", "Outlets/Switches", "Ceiling Fan"];
const BATHROOM_ITEMS = ["Toilet", "Sink & Faucet", "Shower/Tub", "Mirror", "Flooring", "Walls", "Ventilation Fan", "Towel Bars"];

export function buildTARRooms(bedrooms = 3, bathrooms = 2) {
  const beds = Math.max(1, Math.round(bedrooms));
  const baths = Math.max(1, Math.round(bathrooms));

  const rooms: { name: string; items: string[] }[] = [];

  // Exterior
  rooms.push({
    name: "Exterior",
    items: ["Lawn/Trees/Shrubs", "Driveway/Walkways", "Fences/Gates", "Exterior Walls/Paint", "Roof/Gutters", "Mailbox", "Garage Door/Opener"],
  });

  // Entry
  rooms.push({
    name: "Entry / Foyer",
    items: ["Front Door", "Locks/Deadbolt", "Flooring", "Walls", "Ceiling", "Light Fixtures", "Coat Closet"],
  });

  // Living / Dining
  rooms.push({
    name: "Living Room",
    items: ["Flooring", "Walls", "Ceiling", "Windows/Screens", "Light Fixtures", "Outlets/Switches", "Ceiling Fan", "Fireplace"],
  });
  rooms.push({
    name: "Dining Room",
    items: ["Flooring", "Walls", "Ceiling", "Windows/Screens", "Light Fixtures", "Outlets/Switches"],
  });

  // Kitchen
  rooms.push({
    name: "Kitchen",
    items: ["Countertops", "Cabinets", "Sink & Faucet", "Disposal", "Refrigerator", "Stove/Oven", "Microwave", "Dishwasher", "Flooring", "Walls", "Light Fixtures"],
  });

  // Bedrooms
  for (let i = 1; i <= beds; i++) {
    rooms.push({
      name: i === 1 ? "Primary Bedroom" : `Bedroom ${i}`,
      items: BEDROOM_ITEMS,
    });
  }

  // Bathrooms
  for (let i = 1; i <= baths; i++) {
    rooms.push({
      name: i === 1 ? "Primary Bathroom" : `Bathroom ${i}`,
      items: BATHROOM_ITEMS,
    });
  }

  // Utility / Other
  rooms.push({
    name: "Laundry Room",
    items: ["Washer Hookup", "Dryer Hookup", "Flooring", "Walls", "Shelving"],
  });
  rooms.push({
    name: "Utility / Mechanical",
    items: ["Water Heater", "HVAC/Filters", "Smoke Detectors", "CO Detectors", "Electrical Panel"],
  });
  rooms.push({
    name: "Garage",
    items: ["Garage Door", "Opener/Remotes", "Flooring", "Walls", "Lighting"],
  });

  return rooms;
}

// Fallback default (3bed/2bath)
export const DEFAULT_ROOMS = buildTARRooms(3, 2);
