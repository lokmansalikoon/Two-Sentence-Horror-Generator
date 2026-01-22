
import { GoogleGenAI } from "@google/genai";

export function generatePromptForSentenceStream(sentence: string, style: string) {
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

export async function generateImageFromPrompt(prompt: string, aspectRatio: string, style: string): Promise<string> {
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

    const part = candidate?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) return `data:image/jpeg;base64,${part.inlineData.data}`;
    
    const textResponse = candidate?.content?.parts.find(p => p.text)?.text;
    if (textResponse) {
        throw new Error(`Asset creation failed: ${textResponse.substring(0, 80)}`);
    }

    throw new Error("Image generation failed.");
}

export async function editImageWithNudge(base64Image: string, nudgePrompt: string, style: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imageData = base64Image.split(',')[1];
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: imageData, mimeType: 'image/jpeg' } },
                { text: `${style}. ${nudgePrompt}` },
            ],
        },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') {
        throw new Error("Blocked by filters. Try a simpler request.");
    }

    const part = candidate?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) return `data:image/jpeg;base64,${part.inlineData.data}`;
    throw new Error("Refinement failed.");
}
