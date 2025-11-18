import React, { useState, useCallback } from 'react';
import { Scene } from './types';
import { generatePromptForSentenceStream, generateImageFromPrompt, editImageWithNudge } from './services/geminiService';
import { SceneCard } from './components/SceneCard';
import { ErrorAlert } from './components/ErrorAlert';

const styleOptions = [
    { name: 'Stop-Motion / Claymation', prompt: 'A dark, gritty stop-motion animation; scenes look like tactile clay puppets and miniature sets; lighting is eerie and practical.' },
    { name: 'Medieval Woodcut / Etching Style', prompt: 'Style of a medieval woodcut print; high-contrast black and white, harsh lines, and rough cross-hatching; like an occult or folk horror illustration.' },
    { name: 'High-Contrast Ink / Comic Book', prompt: 'A high-contrast noir graphic novel; style of Mike Mignola or Frank Miller; deep, inky blacks and sharp, dramatic shadows.' },
    { name: 'Gritty Sketch / Charcoal', prompt: 'A frantic and unsettling charcoal sketch come to life; rough, unstable lines that "boil" and move; heavy, smudged shading.' },
    { name: 'Distorted Anime / Body Horror', prompt: 'In the style of a Junji Ito horror manga; unsettling expressions, distorted anatomy, body horror, high-contrast black and white ink.' }
];

const App: React.FC = () => {
    const [sentence1, setSentence1] = useState<string>('');
    const [sentence2, setSentence2] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [style, setStyle] = useState<string>(styleOptions[0].prompt);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handlePromptChange = (sceneId: number, newPrompt: string) => {
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, generatedPrompt: newPrompt } : s));
    };
    
    const handleNudgePromptChange = (sceneId: number, newNudgePrompt: string) => {
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, nudgePrompt: newNudgePrompt } : s));
    };

    const handleGenerate = useCallback(async () => {
        const sentences = [sentence1.trim(), sentence2.trim()].filter(Boolean);
        if (sentences.length !== 2) {
            setError("Please provide text for both sentences.");
            return;
        }

        setError(null);
        setIsLoading(true);

        const initialScenes: Scene[] = sentences.map((sentence, index) => ({
            id: index + 1,
            originalSentence: sentence,
            generatedPrompt: null,
            nudgePrompt: '',
            imageUrl: null,
            isLoading: true,
            error: null,
        }));
        setScenes(initialScenes);

        try {
            for (const scene of initialScenes) {
                try {
                    let fullPrompt = "";
                    setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, generatedPrompt: "" } : s));

                    const stream = await generatePromptForSentenceStream(scene.originalSentence);
                    for await (const chunk of stream) {
                        const chunkText = chunk.text;
                        if(chunkText) {
                           fullPrompt += chunkText;
                           setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, generatedPrompt: (s.generatedPrompt || '') + chunkText } : s));
                        }
                    }
                    
                    if (!fullPrompt.trim()) {
                        throw new Error("Generated prompt was empty.");
                    }
                    
                    const imageUrl = await generateImageFromPrompt(fullPrompt, aspectRatio, style);
                    setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, imageUrl, isLoading: false } : s));
                } catch (e) {
                    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
                    console.error(`Error processing scene ${scene.id}:`, e);
                    setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, error: errorMessage, isLoading: false } : s));
                }
            }
        } catch (e) {
             const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred during processing.";
            setError(errorMessage);
            setScenes(initialScenes.map(s => ({...s, isLoading: false, error: "Processing was cancelled due to an error."})));
        } finally {
            setIsLoading(false);
        }
    }, [sentence1, sentence2, style, aspectRatio]);
    
    const handleRegenerate = useCallback(async (sceneId: number) => {
        const sceneToRegenerate = scenes.find(s => s.id === sceneId);
        if (!sceneToRegenerate || !sceneToRegenerate.generatedPrompt) return;

        setError(null);
        setIsLoading(true);

        setScenes(prev => prev.map(s => 
            s.id === sceneId ? { ...s, isLoading: true, error: null, imageUrl: null } : s
        ));

        try {
            const imageUrl = await generateImageFromPrompt(sceneToRegenerate.generatedPrompt, aspectRatio, style);
            setScenes(prev => prev.map(s => 
                s.id === sceneId ? { ...s, imageUrl, isLoading: false } : s
            ));
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            console.error(`Error re-generating scene ${sceneId}:`, e);
            setScenes(prev => prev.map(s => 
                s.id === sceneId ? { ...s, error: errorMessage, isLoading: false } : s
            ));
        } finally {
            setIsLoading(false);
        }
    }, [scenes, aspectRatio, style]);

    const handleNudge = useCallback(async (sceneId: number) => {
        const sceneToNudge = scenes.find(s => s.id === sceneId);
        if (!sceneToNudge || !sceneToNudge.imageUrl || !sceneToNudge.nudgePrompt) return;

        setError(null);
        setIsLoading(true);

        setScenes(prev => prev.map(s => 
            s.id === sceneId ? { ...s, isLoading: true, error: null } : s
        ));

        try {
            const imageUrl = await editImageWithNudge(sceneToNudge.imageUrl, sceneToNudge.nudgePrompt, style);
            setScenes(prev => prev.map(s => 
                s.id === sceneId ? { ...s, imageUrl, isLoading: false } : s
            ));
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during nudge.";
            console.error(`Error nudging scene ${sceneId}:`, e);
            setScenes(prev => prev.map(s => 
                s.id === sceneId ? { ...s, error: errorMessage, isLoading: false } : s
            ));
        } finally {
            setIsLoading(false);
        }
    }, [scenes, style]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                        Text-to-Video Scene Generator
                    </h1>
                    <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                        Turn your two-sentence story into visually stunning scenes. Enter your text and options below to generate descriptive prompts and AI-powered images for your video concept.
                    </p>
                </header>

                <main>
                    <div className="w-full max-w-2xl mx-auto mb-10 space-y-6">
                        <div className="space-y-4 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
                             <h2 className="text-lg font-semibold text-white">1. Enter Your Story</h2>
                            <div>
                                <label htmlFor="sentence1" className="block text-sm font-medium text-gray-400 mb-2">Sentence 1</label>
                                <textarea
                                    id="sentence1"
                                    value={sentence1}
                                    onChange={(e) => setSentence1(e.target.value)}
                                    placeholder="A lone astronaut discovers a glowing alien artifact."
                                    className="w-full h-20 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ease-in-out resize-none"
                                    disabled={isLoading}
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label htmlFor="sentence2" className="block text-sm font-medium text-gray-400 mb-2">Sentence 2</label>
                                <textarea
                                    id="sentence2"
                                    value={sentence2}
                                    onChange={(e) => setSentence2(e.target.value)}
                                    placeholder="Suddenly, it projects a map of an unknown galaxy."
                                    className="w-full h-20 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ease-in-out resize-none"
                                    disabled={isLoading}
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
                             <h2 className="text-lg font-semibold text-white">2. Set Generation Options</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio (Size)</label>
                                    <select
                                        id="aspectRatio"
                                        value={aspectRatio}
                                        onChange={(e) => setAspectRatio(e.target.value)}
                                        className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ease-in-out"
                                        disabled={isLoading}
                                    >
                                        <option value="16:9">16:9 (Widescreen)</option>
                                        <option value="1:1">1:1 (Square)</option>
                                        <option value="9:16">9:16 (Portrait)</option>
                                        <option value="4:3">4:3 (Standard)</option>
                                        <option value="3:4">3:4 (Tall)</option>
                                    </select>
                                </div>
                                <div>
                                     <label htmlFor="style" className="block text-sm font-medium text-gray-400 mb-2">Visual Style</label>
                                    <select
                                        id="style"
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value)}
                                        className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ease-in-out"
                                        disabled={isLoading}
                                    >
                                        {styleOptions.map(option => (
                                            <option key={option.name} value={option.prompt}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full h-12 px-6 font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg hover:from-cyan-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                'Generate Scenes'
                            )}
                        </button>
                         {error && <ErrorAlert message={error} />}
                    </div>
                   
                    {scenes.length > 0 && (
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {scenes.map((scene) => (
                                <SceneCard 
                                    key={scene.id} 
                                    scene={scene} 
                                    onRegenerate={handleRegenerate}
                                    isGenerating={isLoading}
                                    onPromptChange={handlePromptChange}
                                    onNudge={handleNudge}
                                    onNudgePromptChange={handleNudgePromptChange}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;