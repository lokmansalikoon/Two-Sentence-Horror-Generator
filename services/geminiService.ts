import { GoogleGenAI, Modality } from "@google/genai";

export function generatePromptForSentenceStream(sentence: string) {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Based on the following sentence, create a highly detailed and visually descriptive prompt for an AI image generator. The prompt should be a single paragraph. Do not include any introductory text like "Here is a prompt:". Just output the prompt itself.

Sentence: "${sentence}"`;
    try {
        return ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
    } catch (error) {
        console.error("Error generating prompt stream:", error);
        throw new Error("Failed to generate a descriptive prompt stream.");
    }
}

export async function generateImageFromPrompt(prompt: string, aspectRatio: string, style: string): Promise<string> {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const finalPrompt = `${style}. ${prompt}`;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: finalPrompt,
            config: {
                numberOfImages: 1,
                aspectRatio: aspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64Image = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64Image}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate an image.");
    }
}


export async function editImageWithNudge(base64Image: string, nudgePrompt: string, style: string): Promise<string> {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        // Strip the data URL prefix, e.g., "data:image/jpeg;base64,"
        const imageData = base64Image.split(',')[1];
        if (!imageData) {
            throw new Error("Invalid base64 image format.");
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: imageData,
                            mimeType: 'image/jpeg',
                        },
                    },
                    {
                        text: `${style}. ${nudgePrompt}`,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/jpeg;base64,${base64ImageBytes}`;
            }
        }
        
        throw new Error("No edited image was returned from the API.");

    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit the image.");
    }
}