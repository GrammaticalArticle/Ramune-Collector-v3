export interface Flavor {
  id: number;
  japaneseName: string;
  name: string;
  barcode: string | null;
  color: string;
  brand: string;
  category: string;
  sortOrder: number;
  description: string | null;
  imageUrl: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
}

export interface FlavorBarcode {
  id: number;
  flavor_id: number;
  barcode: string;
  region: string;
  added_by: string | null;
  added_at: string;
}

export interface CaughtFlavor {
  id: number;
  user_id: string;
  flavor_id: number;
  caught_at: string;
}

export interface FriendProfile {
  id: string;
  username: string;
  displayName: string;
}

export function mapFlavor(row: Record<string, unknown>): Flavor {
  return {
    id: row.id as number,
    japaneseName: row.japanese_name as string,
    name: row.name as string,
    barcode: (row.barcode as string | null) ?? null,
    color: row.color as string,
    brand: row.brand as string,
    category: row.category as string,
    sortOrder: row.sort_order as number,
    description: (row.description as string | null) ?? null,
    imageUrl: (row.image_url as string | null) ?? null,
    availableFrom: (row.available_from as string | null) ?? null,
    availableUntil: (row.available_until as string | null) ?? null,
  };
}
