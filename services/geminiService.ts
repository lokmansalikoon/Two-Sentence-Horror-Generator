
import { GoogleGenAI } from "@google/genai";

/**
 * Generates an expanded visual directive based on a script sentence.
 * Uses gemini-3-flash-preview for text generation tasks.
 */
export function generatePromptForSentenceStream(sentence: string, style: string) {
    // Initializing the AI client with the API key from environment variables.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Based on the following sentence, create a highly detailed visual directive for an AI image generator.
Visual style: "${style}".
Safety Guidelines (CRITICAL):
- Strictly avoid any terms related to: biological trauma, graphic violence, medical procedures, excessive gore, or explicit anatomical details.
- Use artistic metaphors (e.g., "surreal distortions", "ethereal melting", "obsessive patterns") instead of literal scary or graphic words.
- Focus on: lighting, atmospheric dread, and cinematic composition.
- The directive must be evocative but "PG-13" in its vocabulary to pass safety filters.
Output a single descriptive paragraph. No intro.
Sentence: "${sentence}"`;

    return ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    });
}

/**
 * Generates a visual asset from an expanded prompt.
 * Uses gemini-2.5-flash-image for general image generation.
 */
export async function generateImageFromPrompt(prompt: string, aspectRatio: string, style: string): Promise<string> {
    // Creating a new instance right before the call to ensure the latest API key is used.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `${style}. ${prompt}` }] },
        config: { imageConfig: { aspectRatio: aspectRatio as any } },
    });

    const candidate = response.candidates?.[0];
    
    if (candidate?.finishReason === 'SAFETY') {
        throw new Error("The visual asset was blocked by safety filters. Please simplify the text.");
    }

    // Iterating through all parts to find the image part as per guidelines.
    for (const part of candidate?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    
    const textResponse = candidate?.content?.parts.find(p => p.text)?.text;
    if (textResponse) {
        throw new Error(`Asset creation failed: ${textResponse.substring(0, 80)}`);
    }

    throw new Error("Image generation failed.");
}

/**
 * Refines an existing image using a "nudge" prompt.
 */
export async function editImageWithNudge(base64Image: string, nudgePrompt: string, style: string): Promise<string> {
    // Creating a new instance right before the call.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const mimeType = base64Image.match(/data:([^;]+);/)?.[1] || 'image/png';
    const imageData = base64Image.split(',')[1];
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: imageData, mimeType: mimeType } },
                { text: `${style}. ${nudgePrompt}` },
            ],
        },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') {
        throw new Error("Blocked by filters. Try a simpler request.");
    }

    // Iterating through parts to find the resulting image.
    for (const part of candidate?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Refinement failed.");
}
