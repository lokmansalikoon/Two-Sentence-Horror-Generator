
import { GoogleGenAI } from "@google/genai";

function createAIClient() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key missing. Please connect to AI Studio.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function expandPrompt(sentence: string, style: string): Promise<string> {
  const ai = createAIClient();
  
  const styleInstructions: Record<string, string> = {
    "Noir Horror": "high-contrast film noir horror, deep shadows, dramatic lighting, grainy monochrome or desaturated tones.",
    "Found Footage": "grainy VHS horror, shaky camera, surveillance quality, low-light digital noise, timestamp.",
    "Junji Ito Manga": "intricate black and white ink manga art, body horror, spirals, dramatic hatching, uncanny.",
    "Psychological/Surreal Horror": "surreal horror, distorted reality, dreamlike uncanny atmosphere, unsettling color palette."
  };

  const instruction = styleInstructions[style] || "cinematic visual description.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Task: Create a visual description for an image generator.
    Style Protocol: ${style}
    Visual Directives: ${instruction}
    Source Sentence: "${sentence}"
    Constraint: Keep it under 60 words. Focus on textures and atmosphere.`,
  });
  return response.text || "";
}

export async function generateImage(prompt: string): Promise<string> {
  const ai = createAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    },
  });

  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  if (!part?.inlineData) throw new Error("Image generation failed.");
  
  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
}

export async function editImageWithNudge(base64Image: string, nudge: string): Promise<string> {
  const ai = createAIClient();
  const base64Data = base64Image.split(',')[1];
  const mimeType = base64Image.split(';')[0].split(':')[1];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: `Edit this image according to this nudge: ${nudge}` }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    },
  });

  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  if (!part?.inlineData) throw new Error("Image edit failed.");
  
  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
}
