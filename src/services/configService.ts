import { BotConfig, Plan } from '../types';
import { directus, getAssetUrl } from './directus';
import { readSingleton, readItems } from '@directus/sdk';

export const fetchCrmConfig = async (): Promise<Partial<BotConfig>> => {
  try {
    // Use the SDK to fetch the singleton 'configuration' collection
    // We cast to any here because the SDK's inferred types for singletons can sometimes conflict with our expected schema
    const configData = await directus.request(readSingleton('configuration')) as any;

    if (!configData) return {};

    // Map CMS fields (snake_case) to App Config (camelCase)
    const mappedConfig: Partial<BotConfig> = {};

    if (configData.app_title) mappedConfig.appTitle = String(configData.app_title);
    if (configData.app_slogan) mappedConfig.appSlogan = String(configData.app_slogan);
    if (configData.name) mappedConfig.name = String(configData.name);
    if (configData.description) mappedConfig.description = String(configData.description);
    if (configData.system_instruction) mappedConfig.systemInstruction = String(configData.system_instruction);
    if (configData.primary_color) mappedConfig.primaryColor = String(configData.primary_color);
    if (configData.welcome_message) mappedConfig.welcomeMessage = String(configData.welcome_message);
    if (configData.n8n_webhook_url) mappedConfig.n8nWebhookUrl = String(configData.n8n_webhook_url);
    if (configData.temperature) mappedConfig.temperature = Number(configData.temperature);

    // Handle App Logo (Sidebar)
    if (configData.app_logo) {
      const logoId = typeof configData.app_logo === 'object' && configData.app_logo !== null 
        ? (configData.app_logo as any).id 
        : configData.app_logo;
          
      mappedConfig.appLogoUrl = getAssetUrl(String(logoId));
    }

    // Handle Bot Avatar Logo
    if (configData.logo) {
      const logoId = typeof configData.logo === 'object' && configData.logo !== null 
        ? (configData.logo as any).id 
        : configData.logo;

      mappedConfig.logoUrl = getAssetUrl(String(logoId));
    }

    return mappedConfig;

  } catch (error) {
    console.error('Error loading CRM configuration:', error);
    return {};
  }
};

export const fetchPricingPlans = async (): Promise<Plan[]> => {
  try {
    // @ts-ignore
    const result = await directus.request(readItems('plan', {
        sort: ['id']
    }));
    
    // Normalize data: ensure numeric fields are numbers, even if DB returns strings
    return result.map((item: any) => ({
        ...item,
        plan_messages: Number(item.plan_messages),
        plan_storage: Number(item.plan_storage),
        plan_monthly: Number(item.plan_monthly),
        plan_yearly: Number(item.plan_yearly),
        plan_bots: Number(item.plan_bots),
        plan_llm: Number(item.plan_llm),
        plan_contents: Number(item.plan_contents || 0)
    })) as Plan[];
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    return [];
  }
};