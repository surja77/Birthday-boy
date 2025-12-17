import { GoogleGenAI, Type } from "@google/genai";
import { GeminiModel } from "../types";

// Helper to get the AI instance.
// For Veo and Pro models, we need to ensure the user has selected a key.
const getAI = async (requireUserKey = false) => {
  if (requireUserKey) {
    if (window.aistudio && window.aistudio.openSelectKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
             await window.aistudio.openSelectKey();
        }
    }
  }
  // If we are in an environment where process.env.API_KEY is automatically injected (like Project IDX or similar),
  // it might be available. If the user selected a key via window.aistudio, it updates the environment.
  // We recreate the instance to pick up any key changes.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateBirthdayImagesFromFace = async (faceBase64: string): Promise<string[]> => {
  const ai = await getAI(false);
  const prompt = "A festive, happy birthday photo featuring this person. They are wearing a party hat, surrounded by colorful balloons, confetti, and a birthday cake. High quality, photorealistic, 4k.";
  
  // We need 4 images. We'll run 4 requests in parallel as `numberOfImages` config varies by model/backend availability 
  // and loop is safer for ensuring independent variations.
  const promises = Array(4).fill(0).map(async () => {
    try {
        const response = await ai.models.generateContent({
            model: GeminiModel.FLASH_IMAGE,
            contents: {
              parts: [
                { inlineData: { mimeType: 'image/jpeg', data: faceBase64 } },
                { text: prompt }
              ]
            }
          });
          
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
          return null;
    } catch (e) {
        console.error("Error generating image part:", e);
        return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((url): url is string => url !== null);
};

export const editImage = async (imageBase64: string, instruction: string): Promise<string | null> => {
  const ai = await getAI(false);
  try {
    const response = await ai.models.generateContent({
        model: GeminiModel.FLASH_IMAGE,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: imageBase64.split(',')[1] } }, // strip prefix if present
            { text: instruction }
          ]
        }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
  } catch (e) {
      console.error("Error editing image:", e);
      throw e;
  }
};

export const generateProImage = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string | null> => {
  const ai = await getAI(true); // Requires user key
  try {
    const response = await ai.models.generateContent({
        model: GeminiModel.PRO_IMAGE,
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: {
                imageSize: size,
                aspectRatio: "1:1"
            }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
  } catch (e) {
    console.error("Error generating pro image", e);
    throw e;
  }
}

export const generateVeoVideo = async (imageBase64: string, prompt: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string | null> => {
    const ai = await getAI(true); // Requires user key
    try {
        let operation = await ai.models.generateVideos({
            model: GeminiModel.VEO_FAST,
            prompt: prompt,
            image: {
                imageBytes: imageBase64,
                mimeType: 'image/png' // Assuming PNG for simplicity in this app context
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }
        
        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!uri) return null;

        // Fetch with API key
        return `${uri}&key=${process.env.API_KEY}`;
    } catch (e) {
        console.error("Error generating video", e);
        throw e;
    }
}

export const generateWishes = async (topic: string): Promise<string> => {
    const ai = await getAI(false);
    try {
        const response = await ai.models.generateContent({
            model: GeminiModel.FLASH_LITE,
            contents: `Write a short, heartwarming birthday wish about: ${topic}`,
        });
        return response.text || "Happy Birthday!";
    } catch (e) {
        console.error("Error generating wishes", e);
        return "Wishing you a fantastic day!";
    }
}

export const planParty = async (requirements: string): Promise<string> => {
    const ai = await getAI(false);
    try {
        const response = await ai.models.generateContent({
            model: GeminiModel.PRO_THINKING,
            contents: `Plan a detailed birthday party itinerary based on these requirements: ${requirements}`,
            config: {
                thinkingConfig: {
                    thinkingBudget: 32768
                }
            }
        });
        return response.text || "Could not generate plan.";
    } catch (e) {
        console.error("Error planning party", e);
        return "Error generating plan. Please try again.";
    }
}
