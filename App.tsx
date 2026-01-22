
import React, { useState, useCallback, useEffect } from 'react';
import { Scene } from './types';
import { 
    generatePromptForSentenceStream, 
    generateImageFromPrompt, 
    generateVideoFromPrompt, 
    editImageWithNudge 
} from './services/geminiService';
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
    const [hasProjectKey, setHasProjectKey] = useState<boolean>(false);
    const [isAppReady, setIsAppReady] = useState<boolean>(false);

    useEffect(() => {
        // Initializing app and checking for environment
        const init = async () => {
            try {
                if ((window as any).aistudio?.hasSelectedApiKey) {
                    const selected = await (window as any).aistudio.hasSelectedApiKey();
                    setHasProjectKey(selected);
                }
                setIsAppReady(true);
            } catch (e) {
                console.error("Initialization failed", e);
                setIsAppReady(true); // Still show app so user can interact
            }
        };
        init();
    }, []);

    const handleSetupKey = async () => {
        if ((window as any).aistudio?.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
            setHasProjectKey(true);
        } else {
            setError("Project key selector is not available in this environment.");
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

    const handleGenerateVideo = async (sceneId: number) => {
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene || !scene.generatedPrompt) return;

        if (!hasProjectKey) {
            await handleSetupKey();
        }

        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isVideoLoading: true, error: null } : s));

        try {
            const videoUrl = await generateVideoFromPrompt(scene.generatedPrompt, aspectRatio);
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, videoUrl, isVideoLoading: false } : s));
        } catch (e: any) {
            const msg = e.message || "";
            if (msg.includes("Requested entity was not found")) {
                setHasProjectKey(false);
                setError("Project key expired or invalid. Please setup project again.");
                await handleSetupKey();
            }
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isVideoLoading: false, error: msg } : s));
        }
    };

    if (!isAppReady) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-gray-100 font-sans p-6 sm:p-12">
            <div className="max-w-6xl mx-auto space-y-12">
                <header className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-gray-800 pb-8">
                    <div className="text-center md:text-left">
                        <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-500">
                            DIRECTOR.AI
                        </h1>
                        <p className="text-gray-400 text-lg mt-2 font-light">Cinematic workflow from text to video.</p>
                    </div>
                    <button 
                        onClick={handleSetupKey}
                        className={`px-6 py-3 rounded-xl border flex items-center gap-3 transition-all ${
                            hasProjectKey ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                        }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${hasProjectKey ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-cyan-500 animate-pulse'}`} />
                        {hasProjectKey ? 'Video Project Configured' : 'Setup Video Project Key'}
                    </button>
                </header>

                <div className="grid lg:grid-cols-[400px_1fr] gap-12 items-start">
                    <aside className="space-y-6 bg-gray-900/30 p-8 rounded-3xl border border-gray-800/50 backdrop-blur-xl sticky top-12">
                        <div className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">01. THE SCRIPT</h2>
                            <textarea 
                                placeholder="Act 1: The Setup..."
                                value={sentence1}
                                onChange={e => setSentence1(e.target.value)}
                                className="w-full h-24 bg-black border border-gray-800 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-gray-700"
                            />
                            <textarea 
                                placeholder="Act 2: The Twist..."
                                value={sentence2}
                                onChange={e => setSentence2(e.target.value)}
                                className="w-full h-24 bg-black border border-gray-800 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-gray-700"
                            />
                        </div>

                        <div className="space-y-4 pt-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500">02. VISUAL BIBLE</h2>
                            <div className="space-y-2">
                                <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest">AESTHETIC STYLE</label>
                                <select 
                                    value={style}
                                    onChange={e => setStyle(e.target.value)}
                                    className="w-full bg-black border border-gray-800 rounded-xl p-3 text-xs focus:ring-1 focus:ring-purple-500 appearance-none"
                                >
                                    {styleOptions.map(o => <option key={o.name} value={o.prompt}>{o.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest">ASPECT RATIO</label>
                                <select 
                                    value={aspectRatio}
                                    onChange={e => setAspectRatio(e.target.value)}
                                    className="w-full bg-black border border-gray-800 rounded-xl p-3 text-xs focus:ring-1 focus:ring-purple-500 appearance-none"
                                >
                                    <option value="16:9">Widescreen (16:9)</option>
                                    <option value="9:16">Vertical (9:16)</option>
                                    <option value="1:1">Square (1:1)</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-cyan-400 transition-all disabled:opacity-50 shadow-2xl shadow-cyan-500/10 mt-6"
                        >
                            {isLoading ? "PRODUCTION IN PROGRESS" : "START PRODUCTION"}
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
                                onRegenerate={handleRegenerateImage} 
                                onNudge={handleNudge}
                                onNudgePromptChange={handleNudgePromptChange}
                                onGenerateVideo={handleGenerateVideo}
                            />
                        )) : (
                            <div className="md:col-span-2 h-[500px] border border-dashed border-gray-800 rounded-[2rem] flex flex-col items-center justify-center text-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-6 opacity-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm font-bold uppercase tracking-[0.3em]">Awaiting Script Input</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default App;
