
import { GoogleGenAI } from "@google/genai";

function getApiKey() {
    const key = process.env.API_KEY;
    if (!key) {
        throw new Error("API_KEY not found.");
    }
    return key;
}

export async function generateExpandedPrompt(sentence: string, style: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Expand this sentence into a single paragraph of dense visual descriptions for a high-end cinema camera. 
Style: ${style}. 
Avoid forbidden content. Focus on texture, lighting, and specific camera movement.
Sentence: "${sentence}"`,
    });
    return response.text || "";
}

export async function generateVideoFromPrompt(prompt: string, aspectRatio: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio as any
        }
    });

    // Poll for completion
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed to return a link.");

    // Append API Key to the download link as per documentation
    return `${downloadLink}&key=${getApiKey()}`;
}
