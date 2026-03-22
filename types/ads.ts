export interface Ad {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  destination_url: string | null;
  active_from: string | null;
  active_until: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}
