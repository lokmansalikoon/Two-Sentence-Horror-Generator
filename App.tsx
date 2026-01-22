
import React, { useState, useCallback, useEffect } from 'react';
import { Scene } from './types';
import { 
    generatePromptForSentenceStream, 
    generateImageFromPrompt, 
    editImageWithNudge
} from './services/geminiService';
import { SceneCard } from './components/SceneCard';
import { ErrorAlert } from './components/ErrorAlert';

// Removed local declaration of window.aistudio to avoid conflict with the environment's predefined AIStudio type.

const styleOptions = [
    { name: 'Cinematic Movie', prompt: 'High-budget 35mm film photography, cinematic lighting, dramatic atmosphere, highly detailed textures, shallow depth of field.' },
    { name: 'Grainy Found Footage', prompt: 'Grainy low-quality found footage, VHS artifacts, high ISO noise, handheld camera shake, flashlight-only lighting, raw horror aesthetic.' },
    { name: 'Dark Surrealism', prompt: 'Dark surrealist art style, biomechanical textures, haunting desolate landscapes, organic decay, muted earthy and sickly tones, ethereal fog.' },
    { name: 'Surreal Horror', prompt: 'Surreal horror aesthetic, unsettling dreamlike imagery, distorted perspectives, liminal spaces, uncanny faces, muted color palette, psychological dread, abstract terrors.' },
    { name: 'Junji Ito Manga', prompt: 'Detailed black and white manga art style, intricate linework, body horror elements, high contrast, traditional ink drawing, grotesque patterns, haunting atmosphere, Junji Ito aesthetic.' }
];

const App: React.FC = () => {
    const [sentence1, setSentence1] = useState<string>('');
    const [sentence2, setSentence2] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('16:9');
    const [style, setStyle] = useState<string>(styleOptions[0].prompt);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isKeyReady, setIsKeyReady] = useState<boolean>(false);
    const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);

    useEffect(() => {
        const checkKey = async () => {
            try {
                // Relying on the globally available aistudio object.
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                setIsKeyReady(hasKey);
            } catch (e) {
                console.error("Key check failed", e);
            } finally {
                setIsCheckingKey(false);
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        try {
            await (window as any).aistudio.openSelectKey();
            // Assume success as per guidelines to avoid race conditions.
            setIsKeyReady(true);
        } catch (e) {
            setError("Failed to open API key selection dialog.");
        }
    };

    const handlePromptChange = (sceneId: number, newPrompt: string) => {
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, generatedPrompt: newPrompt } : s));
    };

    const handleNudgePromptChange = (sceneId: number, nudge: string) => {
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, nudgePrompt: nudge } : s));
    };

    const handleGenerate = useCallback(async () => {
        const s1 = sentence1.trim();
        const s2 = sentence2.trim();
        if (!s1 || !s2) {
            setError("Please enter two sentences for your storyboards.");
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
            isLoading: true,
            error: null,
        }));
        setScenes(initialScenes);

        try {
            for (const scene of initialScenes) {
                let fullPrompt = "";
                const stream = await generatePromptForSentenceStream(scene.originalSentence, style);
                for await (const chunk of stream) {
                    // Accessing .text getter from the stream chunk.
                    fullPrompt += chunk.text || "";
                    setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, generatedPrompt: fullPrompt } : s));
                }
                const imageUrl = await generateImageFromPrompt(fullPrompt, aspectRatio, style);
                setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, imageUrl, isLoading: false } : s));
            }
        } catch (e: any) {
            const msg = e.message || "";
            // Reset key selection if the project is not found as per instructions.
            if (msg.includes("Requested entity was not found")) {
                setIsKeyReady(false);
                setError("API Project configuration error. Please re-select your key.");
            } else {
                setError(msg || "Failed to generate visual assets.");
            }
            setScenes(prev => prev.map(s => s.isLoading ? { ...s, isLoading: false, error: 'Production Delayed' } : s));
        } finally {
            setIsLoading(false);
        }
    }, [sentence1, sentence2, style, aspectRatio]);

    const handleRegenerateImage = async (sceneId: number) => {
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene || !scene.generatedPrompt) return;
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isLoading: true, error: null } : s));
        try {
            const imageUrl = await generateImageFromPrompt(scene.generatedPrompt, aspectRatio, style);
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, imageUrl, isLoading: false } : s));
        } catch (e: any) {
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isLoading: false, error: e.message } : s));
        }
    };

    const handleNudge = async (sceneId: number) => {
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene || !scene.imageUrl || !scene.nudgePrompt) return;
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isLoading: true } : s));
        try {
            const editedUrl = await editImageWithNudge(scene.imageUrl, scene.nudgePrompt, style);
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, imageUrl: editedUrl, isLoading: false, nudgePrompt: '' } : s));
        } catch (e: any) {
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isLoading: false, error: e.message } : s));
        }
    };

    if (isCheckingKey) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isKeyReady) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] text-gray-100 flex items-center justify-center p-6">
                <div className="max-w-md w-full space-y-8 bg-gray-900/40 p-12 rounded-[3rem] border border-white/5 text-center backdrop-blur-3xl">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black tracking-tighter uppercase">Director.AI</h1>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            To begin production, you must select a valid Gemini API key from a paid project.
                        </p>
                    </div>
                    <button 
                        onClick={handleSelectKey}
                        className="w-full py-6 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-full hover:bg-purple-400 transition-all shadow-2xl active:scale-95"
                    >
                        Connect Project Key
                    </button>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                        Check <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Billing Docs</a> for details.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-gray-100 font-sans p-6 sm:p-12 pb-32 selection:bg-purple-500/30">
            <div className="max-w-[1400px] mx-auto space-y-12">
                <header className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-12">
                    <div className="text-center md:text-left">
                        <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-500 uppercase">
                            DIRECTOR.AI
                        </h1>
                        <p className="text-gray-500 text-lg mt-3 font-light tracking-wide italic">Automated Storyboarding Workflow</p>
                    </div>
                    <button 
                        onClick={handleSelectKey}
                        className="px-6 py-2 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-gray-500"
                    >
                        Change Key
                    </button>
                </header>

                <div className="grid lg:grid-cols-[380px_1fr] gap-12 items-start">
                    <aside className="space-y-8 bg-gray-900/20 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl sticky top-12">
                        <div className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500">I. Script Input</h2>
                            <div className="space-y-4">
                                <textarea placeholder="Opening scene..." value={sentence1} onChange={e => setSentence1(e.target.value)}
                                    className="w-full h-24 bg-black/40 border border-white/5 rounded-3xl p-6 text-sm focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                />
                                <textarea placeholder="Conclusion..." value={sentence2} onChange={e => setSentence2(e.target.value)}
                                    className="w-full h-24 bg-black/40 border border-white/5 rounded-3xl p-6 text-sm focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-6 border-t border-white/5 pt-8">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500">II. Style & Format</h2>
                            <div className="grid gap-4">
                                <select value={style} onChange={e => setStyle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-gray-400 cursor-pointer"
                                >
                                    {styleOptions.map(o => <option key={o.name} value={o.prompt}>{o.name}</option>)}
                                </select>
                                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-gray-400 cursor-pointer"
                                >
                                    <option value="16:9">Widescreen (16:9)</option>
                                    <option value="9:16">Portrait (9:16)</option>
                                    <option value="1:1">Square (1:1)</option>
                                </select>
                            </div>
                        </div>

                        <button onClick={handleGenerate} disabled={isLoading}
                            className="w-full py-6 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-full hover:bg-purple-400 transition-all shadow-2xl active:scale-95"
                        >
                            {isLoading ? "Drafting Visuals..." : "Begin Production"}
                        </button>
                        {error && <ErrorAlert message={error} />}
                    </aside>

                    <section className="space-y-12">
                        <div className="grid md:grid-cols-1 xl:grid-cols-2 gap-8">
                            {scenes.length > 0 ? scenes.map(scene => (
                                <SceneCard 
                                    key={scene.id} 
                                    scene={scene}
                                    isGenerating={isLoading}
                                    onPromptChange={handlePromptChange}
                                    onRegenerate={handleRegenerateImage} 
                                    onNudge={handleNudge}
                                    onNudgePromptChange={handleNudgePromptChange}
                                    aspectRatio={aspectRatio}
                                />
                            )) : (
                                <div className="md:col-span-2 h-[600px] border border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-white/5 bg-gray-900/10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Awaiting Script submission</span>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default App;
