
import { GoogleGenAI } from "@google/genai";

export function generatePromptForSentenceStream(sentence: string, style: string) {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Based on the following sentence, create a highly detailed and visually descriptive prompt for an AI image/video generator.

The visual style description is: "${style}".

Ensure the generated description strictly adheres to this style. The output should be a single paragraph. Do not include any introductory text.

Sentence: "${sentence}"`;
    try {
        return ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
    } catch (error) {
        console.error("Error generating prompt stream:", error);
        throw new Error("Failed to generate a descriptive prompt stream.");
    }
}

export async function generateImageFromPrompt(prompt: string, aspectRatio: string, style: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const finalPrompt = `${style}. ${prompt}`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: finalPrompt }] },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio as any,
                },
            },
        });

        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (part?.inlineData) {
            return `data:image/jpeg;base64,${part.inlineData.data}`;
        }
        throw new Error("No image was generated.");
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate an image.");
    }
}

export async function generateVideoFromPrompt(prompt: string, aspectRatio: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: (aspectRatio === '16:9' || aspectRatio === '9:16') ? aspectRatio : '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation failed - no URI returned.");

        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Error generating video:", error);
        throw error;
    }
}

export async function editImageWithNudge(base64Image: string, nudgePrompt: string, style: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
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

        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (part?.inlineData) return `data:image/jpeg;base64,${part.inlineData.data}`;
        throw new Error("No edited image was returned.");
    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit the image.");
    }
}
