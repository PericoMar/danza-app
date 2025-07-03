export interface User {
  user_id: string;
  name: string;
  bio?: string;
  company?: string;
  location?: string;
  gender?: 'male' | 'female' | 'other'; // Puedes dejarlo como string si prefieres más abierto
  display_local_time?: boolean;
  profile_img: string | null;
  instagram_url?: string;
  linkedin_url?: string;
  website_url?: string;
  created_at: string;
}