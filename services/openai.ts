import Constants from 'expo-constants';
import OpenAI from 'openai';

const openaiApiKey = Constants.expoConfig?.extra?.openaiApiKey;
if (!openaiApiKey) {
  throw new Error('Falta la clave de OpenAI en expoConfig.extra');
}

// ahora puedes usar openaiApiKey para inicializar tu cliente de OpenAI, por ejemplo:
export const openai = new OpenAI({ apiKey: openaiApiKey, dangerouslyAllowBrowser: true });  