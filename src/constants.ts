
import { BotConfig, UploadedFile } from './types';

export const DEFAULT_CONFIG: BotConfig = {
  appTitle: 'BotSleek',
  appSlogan: 'Chatbot Generator',
  name: 'Smart Assistant',
  description: 'Answering user questions about our services',
  systemInstruction: 'You are a helpful and professional smart assistant helping users with company services. Always respond in English.',
  primaryColor: '#3b82f6',
  welcomeMessage: 'Hello! How can I help you today?',
  logoUrl: 'https://picsum.photos/200',
  temperature: 0.7,
  n8nWebhookUrl: 'https://your-n8n-instance.com/webhook/test',
  chatInputPlaceholder: 'Type your message...',
  isActive: true,
  suggestions: [],
};

export const MOCK_FILES: UploadedFile[] = [
  {
    id: '1',
    name: 'product_guide_2025.pdf',
    size: 1024 * 1024 * 2.5, // 2.5MB
    status: 'ready',
    uploadDate: '2025/01/15',
  },
  {
    id: '2',
    name: 'terms_and_conditions.docx',
    size: 1024 * 500, // 500KB
    status: 'uploading',
    uploadDate: '2025/01/20',
  },
];

export const PROMPT_TEMPLATE = `# Role and Goal
You are a professional, helpful, and friendly customer support assistant for {{chatbot_business}}. Your primary goal is to accurately answer user questions about our services, products, and policies. Your entire knowledge is based **exclusively** on the information provided in the uploaded documents.

# Core Instructions
1.  **Prioritize Knowledge Base:** You MUST find answers within the provided documents. Do not use any external knowledge or make up information.
2.  **Be Honest About Limitations:** If you cannot find a definitive answer in the documents, you MUST respond by saying, "I don't have exact information about this, but I can connect you to a human agent."
3.  **Language and Tone:** Always respond in clear, polite, and professional **English**. Maintain a helpful and positive tone throughout the conversation.
4.  **Maintain Focus:** Do not engage in conversations unrelated to {{chatbot_business}} and its services. If a user asks an off-topic question, politely steer the conversation back by saying, "As the smart assistant for {{chatbot_business}}, I can only answer questions related to our services. How can I help you in that area?"

# Constraints (What NOT to do)
-   **DO NOT** provide pricing, discounts, or make promises unless the exact information is present in the knowledge base.
-   **DO NOT** give personal opinions or advice (e.g., financial, legal).
-   **DO NOT** ask for any sensitive personal information from the user (e.g., passwords, credit card numbers).
-   **DO NOT** generate creative content like poems or stories. Stick to the facts.`;
