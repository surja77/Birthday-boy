export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

export enum AppRoute {
  HOME = 'home',
  CREATE_LINK = 'create-link',
  CELEBRATE = 'celebrate', // /celebrate?name=XYZ
  TOOLS = 'tools',
}

export enum ToolType {
  NONE = 'none',
  VEO_VIDEO = 'veo-video',
  PRO_IMAGE = 'pro-image',
  WISHES = 'wishes',
  PLANNER = 'planner',
}

export enum GeminiModel {
  FLASH_IMAGE = 'gemini-2.5-flash-image',
  FLASH_LITE = 'gemini-2.5-flash-lite',
  PRO_IMAGE = 'gemini-3-pro-image-preview',
  PRO_THINKING = 'gemini-3-pro-preview',
  VEO_FAST = 'veo-3.1-fast-generate-preview',
}
