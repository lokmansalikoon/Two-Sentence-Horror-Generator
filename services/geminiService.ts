
import { GoogleGenAI } from "@google/genai";

/**
 * Validates that an API key is present before continuing.
 */
function getClient() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key missing. Please connect to AI Studio using the button on the dashboard.");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Expands a simple sentence into a rich visual prompt based on a specific style protocol.
 */
export async function expandPrompt(sentence: string, style: string): Promise<string> {
  const ai = getClient();
  
  const styleInstructions: Record<string, string> = {
    "Noir Horror": "high-contrast film noir horror, deep shadows, dramatic chiaroscuro lighting, grainy monochrome or heavily desaturated tones, rainy urban atmosphere.",
    "Found Footage": "grainy VHS found footage horror aesthetic, shaky camera, surveillance camera quality, low-light digital noise, eerie realism, timestamp on screen.",
    "Junji Ito Manga": "intricate black and white ink manga art in the style of Junji Ito, fine line work, body horror elements, spirals, dramatic hatching, uncanny facial expressions.",
    "Psychological/Surreal Horror": "surreal psychological horror, distorted reality, dreamlike uncanny atmosphere, symbolic imagery, vibrant but unsettling color palette, melting environments."
  };

  const instruction = styleInstructions[style] || "cinematic cinematic visual description.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Task: Create a visual description for an image generator.
    Style Protocol: ${style}
    Visual Directives: ${instruction}
    Source Sentence: "${sentence}"
    
    Constraint: Keep the description under 60 words and focus on textures and lighting.`,
  });
  return response.text || "";
}

/**
 * Generates a 1:1 image using the budget-friendly gemini-2.5-flash-image model.
 */
export async function generateImage(prompt: string): Promise<string> {
  const ai = getClient();
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
  if (!part?.inlineData) throw new Error("Image generation failed: No image data returned.");
  
  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
}

/**
 * Edits an existing image based on a nudge prompt using gemini-2.5-flash-image.
 */
export async function editImageWithNudge(base64Image: string, nudge: string): Promise<string> {
  const ai = getClient();
  const base64Data = base64Image.split(',')[1];
  const mimeType = base64Image.split(';')[0].split(':')[1];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: `Apply these changes to the image: ${nudge}` }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    },
  });

  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  if (!part?.inlineData) throw new Error("Image edit failed: No image data returned.");
  
  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
}
