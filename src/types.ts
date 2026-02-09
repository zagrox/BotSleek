
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'ready' | 'error';
  uploadDate: string;
}

export interface BotConfig {
  id?: number;
  appTitle?: string;
  appSlogan?: string;
  appLogoUrl?: string;
  name: string;
  description: string;
  systemInstruction: string;
  primaryColor: string;
  welcomeMessage: string;
  logoUrl: string;
  temperature: number;
  n8nWebhookUrl: string;
  chatInputPlaceholder: string;
  isActive?: boolean;
  suggestions: string[];
  phone?: string;
  instagram?: string;
  whatsapp?: string;
  telegram?: string;
  address?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface ChatbotActivityEntry {
  q: string;
  t: string;
}

export interface Chatbot {
  id: number;
  status: string;
  user_created: string;
  date_created: string;
  user_updated: string;
  date_updated: string;
  chatbot_name: string;
  chabot_title: string;
  chatbot_business?: string;
  chatbot_site?: string;
  chatbot_telegram?: string;
  chatbot_webhook?: string;
  chatbot_welcome?: string;
  chatbot_logo?: string;
  chatbot_prompt?: string;
  chatbot_active: boolean;
  chatbot_suggestion?: string[];
  chatbot_pro: boolean;
  chatbot_input?: string;
  chatbot_color?: string;
  chatbot_slug?: string;
  chatbot_llm?: number;
  chatbot_vector?: number;
  chatbot_human?: string;
  chatbot_folder?: string;
  chatbot_phone?: string;
  chatbot_instagram?: string;
  chatbot_whatsapp?: string;
  chatbot_address?: string;
  chatbot_location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  chatbot_messages: number;
  chatbot_storage: number;
  chatbot_activity?: ChatbotActivityEntry[];
}

export interface ContentItem {
  id: number;
  status: string;
  user_created: string;
  date_created: string;
  date_updated: string;
  content_type: 'faq' | 'product';
  content_chatbot: number;
  content_index?: boolean;
  content_link?: string;
  content_image?: string;
  content_question?: string;
  content_answer?: string;
  content_product?: string;
  content_price?: string;
  content_sku?: string;
  content_details?: string;
}

export interface UserProfile {
  id: number;
  status: string;
  user_created: string;
  date_created: string;
  date_updated: string;
  profile_official: boolean;
  profile_color?: string;
  profile_phone?: string;
  profile_instagram?: string;
  profile_telegram?: string;
  profile_website?: string;
  profile_company?: string;
  profile_plan?: string | number | any;
  profile_chatbots?: number;
  profile_messages: number;
  profile_storages: number;
  profile_llm?: number;
  profile_duration?: 'monthly' | 'yearly';
  profile_start?: string;
  profile_end?: string;
}

export interface Plan {
  id: number;
  plan_name: string;
  plan_messages: number;
  plan_llm: number;
  plan_storage: number;
  plan_monthly: number;
  plan_yearly: number;
  plan_bots: number;
  plan_contents?: number;
  plan_vector?: string;
  plan_copyright?: boolean;
}

export interface Transaction {
  id: number;
  status: string;
  date_created: string;
  trackid?: string;
  transaction_status?: string;
  transaction_result?: number;
  transaction_message?: string;
}

export interface Order {
  id: number;
  status: string;
  user_created: string;
  date_created: string;
  order_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  order_duration: 'monthly' | 'yearly';
  order_amount: string;
  order_profile: number;
  order_plan: number;
  order_transaction?: number | Transaction;
  profile_end?: string;
}

export interface LLMJob {
  id: number;
  llm_status: 'ready' | 'start' | 'building' | 'completed' | 'error';
  llm_file: string | DirectusFile;
  llm_chatbot: number | Chatbot;
  llm_error?: string | null;
  date_created: string;
}

export interface DirectusFile {
  id: string;
  filename_download: string;
  filesize: string;
  uploaded_on: string;
  type: string;
}

export interface SystemFAQ {
  id: number;
  status: string;
  faq_question: string;
  faq_answer: string;
}

export interface FAQItem {
  id: number;
  status: string;
  question: string;
  answer: string;
  chatbot: number;
  is_indexed: boolean;
  date_created: string;
}

export interface DirectusSchema {
  configuration: any;
  directus_files: DirectusFile;
  chatbot: Chatbot[];
  llm: LLMJob[];
  profile: UserProfile[];
  plan: Plan[];
  content: ContentItem[];
  order: Order[];
  transaction: Transaction[];
  faq: SystemFAQ[];
  faq_items: FAQItem[];
}

export type TabType = 'dashboard' | 'logs' | 'insights' | 'general' | 'appearance' | 'knowledge' | 'content-manager' | 'integrations' | 'deploy' | 'profile' | 'create-bot' | 'manage-bots' | 'pricing' | 'checkout' | 'orders' | 'payment_verify';

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type BuildStatus = 'idle' | 'ready' | 'start' | 'building' | 'completed' | 'error';

export interface ProcessedFile {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  type: string;
  buildStatus: BuildStatus;
  errorMessage?: string | null;
  llmJobId?: number;
}