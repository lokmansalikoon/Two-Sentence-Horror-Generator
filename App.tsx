
import React, { useState, useEffect } from 'react';
import { Scene } from './types';
import { 
    generateExpandedPrompt,
    generateVideoFromPrompt
} from './services/geminiService';
import { VideoCard } from './components/VideoCard';
import { ErrorAlert } from './components/ErrorAlert';

const styleOptions = [
    { name: 'Cinematic Movie', prompt: 'High-budget 35mm film photography, cinematic lighting, dramatic atmosphere, highly detailed textures.' },
    { name: 'Grainy Found Footage', prompt: 'Grainy low-quality found footage, VHS artifacts, raw horror aesthetic.' },
    { name: 'Surreal Horror', prompt: 'Surreal horror aesthetic, unsettling dreamlike imagery, distorted perspectives.' },
    { name: 'Junji Ito Manga', prompt: 'Detailed black and white manga art style, intricate linework, body horror elements.' }
];

const App: React.FC = () => {
    const [sentence1, setSentence1] = useState<string>('');
    const [sentence2, setSentence2] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('16:9');
    const [style, setStyle] = useState<string>(styleOptions[0].prompt);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isProducing, setIsProducing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isKeyReady, setIsKeyReady] = useState<boolean>(false);
    const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);

    useEffect(() => {
        const verifyAccess = async () => {
            // Priority 1: If the environment already has a key, we are good to go.
            if (process.env.API_KEY && process.env.API_KEY !== "") {
                setIsKeyReady(true);
                setIsCheckingKey(false);
                return;
            }

            // Priority 2: Safely check for AI Studio helper (Local/Preview)
            try {
                const aistudio = (window as any).aistudio;
                if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
                    const hasKey = await aistudio.hasSelectedApiKey();
                    setIsKeyReady(hasKey);
                }
            } catch (e) {
                console.warn("AI Studio key check deferred:", e);
            } finally {
                setIsCheckingKey(false);
            }
        };
        verifyAccess();
    }, []);

    const handleConnect = async () => {
        setError(null);
        try {
            const aistudio = (window as any).aistudio;
            if (aistudio && typeof aistudio.openSelectKey === 'function') {
                await aistudio.openSelectKey();
                // Assume success to avoid race conditions
                setIsKeyReady(true);
            } else {
                // If we're here, process.env.API_KEY was missing and window.aistudio is missing.
                setError("API Key not found. Please ensure you are running in a supported environment or set the API_KEY environment variable.");
            }
        } catch (e: any) {
            setError(e.message || "Failed to connect to API key selector.");
        }
    };

    const runProduction = async () => {
        if (!sentence1.trim() || !sentence2.trim()) {
            setError("Both sentences are required for the workflow.");
            return;
        }

        setError(null);
        setIsProducing(true);

        const initialScenes: Scene[] = [
            { id: 1, originalSentence: sentence1, generatedPrompt: null, videoUrl: null, status: 'idle', error: null },
            { id: 2, originalSentence: sentence2, generatedPrompt: null, videoUrl: null, status: 'idle', error: null }
        ];
        setScenes(initialScenes);

        for (let i = 0; i < initialScenes.length; i++) {
            const currentScene = initialScenes[i];
            try {
                setScenes(prev => prev.map(s => s.id === currentScene.id ? { ...s, status: 'expanding' } : s));
                const expanded = await generateExpandedPrompt(currentScene.originalSentence, style);
                
                setScenes(prev => prev.map(s => s.id === currentScene.id ? { ...s, generatedPrompt: expanded, status: 'rendering' } : s));
                const videoUrl = await generateVideoFromPrompt(expanded, aspectRatio);
                
                setScenes(prev => prev.map(s => s.id === currentScene.id ? { ...s, videoUrl, status: 'completed' } : s));
            } catch (e: any) {
                const errorMessage = e.message || "Production error occurred.";
                setScenes(prev => prev.map(s => s.id === currentScene.id ? { ...s, status: 'error', error: errorMessage } : s));
                setError(`Scene ${currentScene.id} error: ${errorMessage}`);
                break; 
            }
        }
        setIsProducing(false);
    };

    if (isCheckingKey) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white/20 uppercase text-[10px] tracking-widest">Checking Authorization...</div>;
    }

    if (!isKeyReady) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-[#121216] border border-white/5 rounded-[3rem] p-12 text-center space-y-8">
                    <h1 className="text-3xl font-black tracking-tighter uppercase">DIRECTOR.AI</h1>
                    <p className="text-gray-500 text-sm">To begin production, connect a valid Gemini API key.</p>
                    <button onClick={handleConnect} className="w-full py-5 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-full hover:bg-purple-400 transition-all active:scale-95 shadow-2xl">
                        Connect Project Key
                    </button>
                    {error && <ErrorAlert message={error} />}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12 pb-24">
            <div className="max-w-[1400px] mx-auto space-y-16">
                <header className="flex flex-col md:flex-row items-center justify-between border-b border-white/5 pb-12 gap-6">
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500">DIRECTOR.AI</h1>
                        <p className="text-gray-500 text-sm mt-2 uppercase tracking-widest italic font-light">Workflow Automation</p>
                    </div>
                    <div className="flex gap-4">
                        <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="bg-white/5 border border-white/10 rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest outline-none">
                            <option value="16:9">16:9 Widescreen</option>
                            <option value="9:16">9:16 Portrait</option>
                        </select>
                    </div>
                </header>

                <div className="grid lg:grid-cols-[400px_1fr] gap-16 items-start">
                    <aside className="space-y-10 bg-[#121216] p-10 rounded-[2.5rem] border border-white/5 sticky top-12">
                        <div className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Script Ingest</h2>
                            <textarea value={sentence1} onChange={e => setSentence1(e.target.value)} placeholder="First sentence..." className="w-full h-24 bg-black rounded-3xl p-6 text-sm border border-white/5 focus:border-purple-500 transition-all resize-none outline-none" />
                            <textarea value={sentence2} onChange={e => setSentence2(e.target.value)} placeholder="Second sentence..." className="w-full h-24 bg-black rounded-3xl p-6 text-sm border border-white/5 focus:border-purple-500 transition-all resize-none outline-none" />
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-purple-500">Aesthetic</h2>
                            <div className="grid grid-cols-1 gap-3">
                                {styleOptions.map(opt => (
                                    <button key={opt.name} onClick={() => setStyle(opt.prompt)} className={`py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${style === opt.prompt ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/20'}`}>
                                        {opt.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={runProduction} disabled={isProducing} className="w-full py-6 bg-cyan-500 text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-full hover:bg-white transition-all disabled:bg-gray-800 disabled:text-gray-500 active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                            {isProducing ? "Producing..." : "Start Production"}
                        </button>
                        {error && <ErrorAlert message={error} />}
                    </aside>

                    <main className="grid md:grid-cols-2 gap-8">
                        {scenes.length > 0 ? scenes.map(scene => (
                            <VideoCard key={scene.id} scene={scene} />
                        )) : (
                            <div className="col-span-2 h-[400px] border border-dashed border-white/5 rounded-[3rem] flex items-center justify-center">
                                <span className="text-[10px] font-black text-white/10 uppercase tracking-[1em]">Awaiting Script</span>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default App;
