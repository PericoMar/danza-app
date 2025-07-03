import { User } from "@/app/types/user";


// Una constante que sea un objeto User pero con valores por defecto para un usuario de IA.
export const aiUser: User = {
  user_id: 'ai-user',
  name: 'AI Assistant',
  company: 'Danza AI',
  location: 'Virtual',
  gender: 'other',
  display_local_time: true,
  profile_img: require('@/assets/images/favicon.png'),
  instagram_url: 'https://instagram.com/ai_assistant',
  linkedin_url: 'https://linkedin.com/in/ai-assistant',
  website_url: 'https://danza.com/ai-assistant',
  created_at: new Date().toISOString()
}
