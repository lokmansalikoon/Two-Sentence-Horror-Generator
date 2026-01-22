
import React, { useState, useCallback } from 'react';
import { Scene } from './types';
import { generatePromptForSentenceStream, generateImageFromPrompt, generateVideoFromPrompt } from './services/geminiService';
import { SceneCard } from './components/SceneCard';
import { ErrorAlert } from './components/ErrorAlert';

const styleOptions = [
    { name: 'Cinematic Movie', prompt: 'High-budget 35mm film photography, cinematic lighting, dramatic atmosphere, highly detailed textures, shallow depth of field.' },
    { name: 'Cyberpunk Neon', prompt: 'Neon-lit cyberpunk aesthetic, rainy city streets, vibrant blues and pinks, futuristic technology, high contrast.' },
    { name: 'Claymation / Stop-Motion', prompt: 'Handcrafted claymation style, tactile clay textures, miniature sets, visible fingerprints, quirky stop-motion movement.' },
    { name: 'Noir Graphic Novel', prompt: 'High-contrast black and white ink drawing, deep shadows, gritty atmosphere, Mike Mignola style.' }
];

const App: React.FC = () => {
    const [sentence1, setSentence1] = useState<string>('');
    const [sentence2, setSentence2] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('16:9');
    const [style, setStyle] = useState<string>(styleOptions[0].prompt);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handlePromptChange = (sceneId: number, newPrompt: string) => {
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, generatedPrompt: newPrompt } : s));
    };

    const handleGenerate = useCallback(async () => {
        const s1 = sentence1.trim();
        const s2 = sentence2.trim();
        if (!s1 || !s2) {
            setError("Both sentences are required for the text-to-video workflow.");
            return;
        }

        setError(null);
        setIsLoading(true);

        const initialScenes: Scene[] = [s1, s2].map((text, i) => ({
            id: i + 1,
            originalSentence: text,
            generatedPrompt: null,
            nudgePrompt: '',
            imageUrl: null,
            videoUrl: null,
            isLoading: true,
            isVideoLoading: false,
            error: null,
        }));
        setScenes(initialScenes);

        try {
            for (const scene of initialScenes) {
                let fullPrompt = "";
                const stream = await generatePromptForSentenceStream(scene.originalSentence, style);
                for await (const chunk of stream) {
                    fullPrompt += chunk.text || "";
                    setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, generatedPrompt: fullPrompt } : s));
                }
                const imageUrl = await generateImageFromPrompt(fullPrompt, aspectRatio, style);
                setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, imageUrl, isLoading: false } : s));
            }
        } catch (e: any) {
            setError(e.message || "Failed to complete generation flow.");
        } finally {
            setIsLoading(false);
        }
    }, [sentence1, sentence2, style, aspectRatio]);

    const handleGenerateVideo = async (sceneId: number) => {
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene || !scene.generatedPrompt) return;

        // Ensure key is selected for Veo
        if (!(await (window as any).aistudio.hasSelectedApiKey())) {
            await (window as any).aistudio.openSelectKey();
        }

        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isVideoLoading: true, error: null } : s));

        try {
            const videoUrl = await generateVideoFromPrompt(scene.generatedPrompt, aspectRatio);
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, videoUrl, isVideoLoading: false } : s));
        } catch (e: any) {
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isVideoLoading: false, error: e.message } : s));
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-gray-100 font-sans p-6 sm:p-12">
            <div className="max-w-6xl mx-auto space-y-12">
                <header className="text-center space-y-4">
                    <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-500">
                        DIRECTOR.AI
                    </h1>
                    <p className="text-gray-400 text-lg">Automate your 2-sentence story into cinematic video clips.</p>
                </header>

                <div className="grid lg:grid-cols-[400px_1fr] gap-12 items-start">
                    <aside className="space-y-6 bg-gray-900/50 p-6 rounded-2xl border border-gray-800 sticky top-12">
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400">1. Scriptwriter</h2>
                            <textarea 
                                placeholder="First sentence (The setup)..."
                                value={sentence1}
                                onChange={e => setSentence1(e.target.value)}
                                className="w-full h-24 bg-black border border-gray-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                            />
                            <textarea 
                                placeholder="Second sentence (The twist)..."
                                value={sentence2}
                                onChange={e => setSentence2(e.target.value)}
                                className="w-full h-24 bg-black border border-gray-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                            />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-purple-400">2. Visual Design</h2>
                            <select 
                                value={style}
                                onChange={e => setStyle(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500"
                            >
                                {styleOptions.map(o => <option key={o.name} value={o.prompt}>{o.name}</option>)}
                            </select>
                            <select 
                                value={aspectRatio}
                                onChange={e => setAspectRatio(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="16:9">Landscape (16:9)</option>
                                <option value="9:16">Portrait (9:16)</option>
                                <option value="1:1">Square (1:1)</option>
                            </select>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50"
                        >
                            {isLoading ? "PRODUCING..." : "START PRODUCTION"}
                        </button>
                        {error && <ErrorAlert message={error} />}
                    </aside>

                    <section className="grid md:grid-cols-2 gap-8">
                        {scenes.length > 0 ? scenes.map(scene => (
                            <SceneCard 
                                key={scene.id} 
                                scene={scene}
                                isGenerating={isLoading}
                                onPromptChange={handlePromptChange}
                                onRegenerate={() => {}} 
                                onNudge={() => {}}
                                onNudgePromptChange={() => {}}
                                onGenerateVideo={handleGenerateVideo}
                            />
                        )) : (
                            <div className="md:col-span-2 h-96 border-2 border-dashed border-gray-800 rounded-3xl flex items-center justify-center text-gray-600 font-medium">
                                Your scenes will appear here...
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default App;
