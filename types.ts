export enum AppView {
  VINTED_STUDIO = 'vinted_studio',
  VEO_VIDEO = 'veo_video',
  LIVE_ASSISTANT = 'live_assistant',
  SMART_CHAT = 'smart_chat',
  IMAGE_GEN = 'image_gen'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  images?: string[]; // base64
  timestamp: number;
  groundingMetadata?: any;
}

export interface VeoConfig {
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
}

export interface ImageGenConfig {
  aspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
  imageSize: '1K' | '2K' | '4K';
}

// Helper for Audio processing
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};