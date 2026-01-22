
import React, { useState, useCallback } from 'react';
import { Scene } from './types';
import { 
    generatePromptForSentenceStream, 
    generateImageFromPrompt, 
    editImageWithNudge
} from './services/geminiService';
import { SceneCard } from './components/SceneCard';
import { ErrorAlert } from './components/ErrorAlert';

const styleOptions = [
    { name: 'Cinematic Movie', prompt: 'High-budget 35mm film photography, cinematic lighting, dramatic atmosphere, highly detailed textures, shallow depth of field.' },
    { name: 'Grainy Found Footage', prompt: 'Grainy low-quality found footage, VHS artifacts, high ISO noise, handheld camera shake, flashlight-only lighting, wide-angle distortion, raw horror aesthetic.' },
    { name: 'Junji Ito Manga', prompt: 'Junji Ito manga art style, intricate black and white ink line art, surreal anatomical transformations, cosmic dread, obsessive fine hatching, spiral patterns, high contrast, atmospheric psychological tension.' },
    { name: 'Dark Surrealism', prompt: 'Dark surrealist art style, biomechanical textures, haunting desolate landscapes, organic decay, muted earthy and sickly tones, ethereal fog, unsettling atmosphere, inspired by Beksinski.' },
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

    const handleNudgePromptChange = (sceneId: number, nudge: string) => {
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, nudgePrompt: nudge } : s));
    };

    const handleGenerate = useCallback(async () => {
        if (!sentence1.trim() || !sentence2.trim()) {
            setError("Please enter two sentences for your storyboards.");
            return;
        }

        setError(null);
        setIsLoading(true);

        const initialScenes: Scene[] = [sentence1, sentence2].map((text, i) => ({
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
                    fullPrompt += chunk.text || "";
                    setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, generatedPrompt: fullPrompt } : s));
                }
                const imageUrl = await generateImageFromPrompt(fullPrompt, aspectRatio, style);
                setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, imageUrl, isLoading: false } : s));
            }
        } catch (e: any) {
            setError(e.message || "Storyboard generation failed.");
            setScenes(prev => prev.map(s => s.isLoading ? { ...s, isLoading: false, error: 'Failed' } : s));
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

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-gray-100 font-sans p-6 sm:p-12 pb-32 selection:bg-cyan-500/30">
            <div className="max-w-[1400px] mx-auto space-y-12">
                <header className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-12">
                    <div className="text-center md:text-left">
                        <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 uppercase">
                            ASSET.STUDIO
                        </h1>
                        <p className="text-gray-500 text-lg mt-3 font-light tracking-wide italic">Automated Storyboard Production</p>
                    </div>
                </header>

                <div className="grid lg:grid-cols-[380px_1fr] gap-12 items-start">
                    <aside className="space-y-8 bg-gray-900/20 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl sticky top-12">
                        <div className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500">I. Script Input</h2>
                            <div className="space-y-4">
                                <textarea placeholder="Opening scene..." value={sentence1} onChange={e => setSentence1(e.target.value)}
                                    className="w-full h-24 bg-black/40 border border-white/5 rounded-3xl p-6 text-sm focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-gray-800"
                                />
                                <textarea placeholder="Conclusion..." value={sentence2} onChange={e => setSentence2(e.target.value)}
                                    className="w-full h-24 bg-black/40 border border-white/5 rounded-3xl p-6 text-sm focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-gray-800"
                                />
                            </div>
                        </div>

                        <div className="space-y-6 border-t border-white/5 pt-8">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500">II. Artistic Direction</h2>
                            <div className="grid gap-4">
                                <select value={style} onChange={e => setStyle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-gray-400 cursor-pointer"
                                >
                                    {styleOptions.map(o => <option key={o.name} value={o.prompt}>{o.name}</option>)}
                                </select>
                                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-gray-400 cursor-pointer"
                                >
                                    <option value="16:9">16:9 Cinematic</option>
                                    <option value="9:16">9:16 Portrait</option>
                                    <option value="1:1">1:1 Square</option>
                                </select>
                            </div>
                        </div>

                        <button onClick={handleGenerate} disabled={isLoading}
                            className="w-full py-6 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-full hover:bg-cyan-400 transition-all shadow-2xl shadow-cyan-500/10"
                        >
                            {isLoading ? "Drafting Storyboard..." : "Start Storyboard"}
                        </button>
                        
                        {error && <ErrorAlert message={error} />}
                    </aside>

                    <section className="space-y-12">
                        <div className="grid md:grid-cols-2 gap-8">
                            {scenes.length > 0 ? (
                                scenes.map(scene => (
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
                                ))
                            ) : (
                                <div className="md:col-span-2 h-[500px] border border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-white/5 bg-gray-900/10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Enter text to generate assets</span>
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
