import { directus } from './directus';
import { readItems, readItem, createItem, updateItem, readFolders, createFolder, readFiles, readSingleton } from '@directus/sdk';
import { Chatbot } from '../types';

export const fetchUserChatbots = async (): Promise<Chatbot[]> => {
  try {
    // @ts-ignore
    const result = await directus.request(readItems('chatbot', {
      sort: ['-date_created'],
    }));
    return result as Chatbot[];
  } catch (error) {
    console.error('Error fetching chatbots:', error);
    return [];
  }
};

/**
 * Aggregates stats from all user chatbots and updates the global profile.
 * Now strictly uses Numbers to match Integer field types.
 */
export const syncProfileStats = async (userId: string): Promise<void> => {
  try {
    // @ts-ignore
    const bots = await directus.request(readItems('chatbot', {
      filter: { user_created: { _eq: userId } },
      fields: ['chatbot_llm', 'chatbot_messages', 'chatbot_storage']
    })) as Chatbot[];

    let totalLlm = 0;
    let totalMessages = 0;
    let totalStorage = 0;

    bots.forEach(bot => {
      totalLlm += Number(bot.chatbot_llm || 0);
      totalMessages += Number(bot.chatbot_messages || 0);
      totalStorage += Number(bot.chatbot_storage || 0);
    });

    // @ts-ignore
    const profiles = await directus.request(readItems('profile', {
      filter: { user_created: { _eq: userId } },
      limit: 1,
      fields: ['id']
    }));

    if (profiles && (profiles as any[]).length > 0) {
      const profileId = (profiles as any[])[0].id;
      // @ts-ignore
      await directus.request(updateItem('profile', profileId, {
        profile_chatbots: bots.length,
        profile_llm: totalLlm,
        profile_messages: totalMessages,
        profile_storages: totalStorage
      }));
    }
  } catch (error) {
    console.error("Failed to sync profile stats:", error);
  }
};

export const recalculateChatbotStats = async (chatbotId: number): Promise<Chatbot | null> => {
  try {
    // @ts-ignore
    const chatbot = await directus.request(readItem('chatbot', chatbotId)) as Chatbot;
    if (!chatbot) return null;

    let folderId = chatbot.chatbot_folder;
    if (!folderId && chatbot.chatbot_slug) {
        // @ts-ignore
        const llmFolders = await directus.request(readFolders({ filter: { name: { _eq: 'llm' } } }));
        const llmFolderId = (llmFolders as any[])[0]?.id;
        if (llmFolderId) {
            // @ts-ignore
            const botFolders = await directus.request(readFolders({ 
                filter: { _and: [ { parent: { _eq: llmFolderId } }, { name: { _eq: chatbot.chatbot_slug } } ] } 
            }));
            if ((botFolders as any[]) && (botFolders as any[]).length > 0) {
                folderId = (botFolders as any[])[0].id;
                // @ts-ignore
                await directus.request(updateItem('chatbot', chatbotId, { chatbot_folder: folderId }));
            }
        }
    }

    let updatedBot = chatbot;

    if (folderId) {
        // @ts-ignore
        const files = await directus.request(readFiles({
            filter: { folder: { _eq: folderId } },
            limit: -1,
            fields: ['id', 'filesize']
        })) as { id: string, filesize: string }[];
        
        const fileCount = files.length;
        const totalBytes = files.reduce((acc, f) => acc + (Number(f.filesize) || 0), 0);
        const totalMB = Math.ceil(totalBytes / (1024 * 1024));

        if (chatbot.chatbot_llm !== fileCount || Number(chatbot.chatbot_storage || 0) !== totalMB) {
            // @ts-ignore
            updatedBot = await directus.request(updateItem('chatbot', chatbotId, {
                chatbot_llm: fileCount,
                chatbot_storage: totalMB
            })) as Chatbot;
        }
    }

    await syncProfileStats(chatbot.user_created);
    return updatedBot;
  } catch (error) {
    console.error("Error recalculating chatbot stats:", error);
    return null;
  }
};

export const createChatbot = async (name: string, slug: string, businessName: string): Promise<Chatbot | null> => {
  try {
    let defaultAvatar = null;
    try {
        // @ts-ignore
        const config = await directus.request(readSingleton('configuration', { fields: ['app_avatar'] })) as any;
        if (config && config.app_avatar) {
            defaultAvatar = typeof config.app_avatar === 'object' ? config.app_avatar.id : config.app_avatar;
        }
    } catch (e) { /* ignore */ }

    // Create with English defaults
    // @ts-ignore
    const result = await directus.request(createItem('chatbot', {
      chatbot_name: name,
      chabot_title: `AI Assistant for ${name}`,
      chatbot_slug: slug,
      chatbot_business: businessName,
      chatbot_active: false,
      status: 'published',
      chatbot_messages: 0,
      chatbot_storage: 0,
      chatbot_llm: 0,
      chatbot_logo: defaultAvatar
    })) as Chatbot;

    try {
      // @ts-ignore
      const folders = await directus.request(readFolders({ filter: { name: { _eq: 'llm' } }, limit: 1 })) as any[];
      if (folders && folders.length > 0) {
        const parentId = folders[0].id;
        // @ts-ignore
        const newFolder = await directus.request(createFolder({ name: slug, parent: parentId })) as any;
        if (newFolder && newFolder.id) {
            // @ts-ignore
            await directus.request(updateItem('chatbot', result.id, { chatbot_folder: newFolder.id }));
            // @ts-ignore
            result.chatbot_folder = newFolder.id;
        }
      }
    } catch (fErr) { /* ignore */ }

    return result as Chatbot;
  } catch (error) {
    console.error('Error creating chatbot:', error);
    throw error;
  }
};

export const updateChatbot = async (id: number, data: Partial<Chatbot>): Promise<Chatbot | null> => {
  try {
    // @ts-ignore
    const result = await directus.request(updateItem('chatbot', id, data, { fields: ['*'] }));
    return result as Chatbot;
  } catch (error) {
    console.error('Error updating chatbot:', error);
    return null;
  }
};