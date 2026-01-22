
import React from 'react';
import { Scene } from '../types';

interface SceneCardProps {
    scene: Scene;
    onRegenerate: (id: number) => void;
    isGenerating: boolean;
    onPromptChange: (id: number, newPrompt: string) => void;
    onNudge: (id: number) => void;
    onNudgePromptChange: (id: number, newNudgePrompt: string) => void;
    onGenerateVideo: (id: number) => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({ 
    scene, isGenerating, onPromptChange, onNudge, onNudgePromptChange, onGenerateVideo 
}) => {
    const handleDownload = () => {
        const url = scene.videoUrl || scene.imageUrl;
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        link.download = scene.videoUrl ? `video-scene-${scene.id}.mp4` : `image-scene-${scene.id}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <div className="bg-[#121216] rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10 group transition-all hover:ring-white/20">
            <div className="aspect-video bg-gray-900 relative">
                 {(scene.isLoading || scene.isVideoLoading) && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md text-center p-6">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                            </div>
                        </div>
                        <p className="text-cyan-400 font-bold mt-6 tracking-wide uppercase text-xs">
                            {scene.isVideoLoading ? "Veo is Crafting Motion" : "Developing Scene"}
                        </p>
                        {scene.isVideoLoading && (
                            <p className="text-[10px] text-gray-500 mt-2 max-w-xs leading-relaxed uppercase tracking-tighter">
                                Building high-fidelity physics and lighting. Approximately 90 seconds remaining.
                            </p>
                        )}
                    </div>
                 )}
                
                {scene.videoUrl ? (
                    <video src={scene.videoUrl} controls className="w-full h-full object-cover" autoPlay loop muted />
                ) : scene.imageUrl ? (
                    <img src={scene.imageUrl} alt="Generated scene" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-800 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 to-gray-950 italic text-sm">
                        Waiting for script...
                    </div>
                )}

                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[10px] font-black text-white uppercase tracking-widest z-20">
                    Scene 0{scene.id}
                </div>
            </div>

            <div className="p-6 flex-grow flex flex-col space-y-5">
                <div>
                    <h3 className="font-bold text-[10px] text-cyan-500 uppercase tracking-[0.2em] mb-2 opacity-80">Story Context</h3>
                    <p className="text-gray-400 text-sm italic leading-relaxed">"{scene.originalSentence}"</p>
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-[10px] text-purple-500 uppercase tracking-[0.2em] opacity-80">AI Production Prompt</h3>
                    <textarea
                        value={scene.generatedPrompt || ''}
                        onChange={(e) => onPromptChange(scene.id, e.target.value)}
                        disabled={isGenerating || scene.isVideoLoading}
                        className="w-full h-20 p-3 bg-black/40 border border-gray-800 rounded-xl text-gray-400 text-xs focus:ring-1 focus:ring-purple-500 resize-none transition-all scrollbar-hide"
                        placeholder="..."
                    />
                </div>

                {scene.imageUrl && !scene.videoUrl && (
                    <div className="space-y-2">
                         <h3 className="font-bold text-[10px] text-amber-500 uppercase tracking-[0.2em] opacity-80">Nudge / Edit Image</h3>
                         <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="e.g. 'Add more fog', 'Make it blue'"
                                value={scene.nudgePrompt}
                                onChange={(e) => onNudgePromptChange(scene.id, e.target.value)}
                                className="flex-grow bg-black/40 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-amber-500/50"
                            />
                            <button 
                                onClick={() => onNudge(scene.id)}
                                disabled={!scene.nudgePrompt || scene.isLoading}
                                className="px-3 py-2 bg-amber-600/20 text-amber-500 border border-amber-500/30 rounded-lg text-[10px] font-black uppercase hover:bg-amber-600/40 disabled:opacity-30 transition-all"
                            >
                                NUDGE
                            </button>
                         </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-800/50">
                    <button
                        onClick={() => onGenerateVideo(scene.id)}
                        disabled={isGenerating || scene.isVideoLoading || !scene.imageUrl}
                        className="flex-[2] py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-[10px] font-black tracking-widest uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        {scene.videoUrl ? "RE-GEN VIDEO" : "GENERATE VIDEO"}
                    </button>
                    
                    <button
                        onClick={handleDownload}
                        disabled={(!scene.imageUrl && !scene.videoUrl) || isGenerating || scene.isVideoLoading}
                        className="flex-1 px-3 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-[10px] font-black tracking-widest uppercase transition-colors disabled:opacity-50 border border-white/5"
                    >
                        SAVE
                    </button>
                </div>
            </div>
            {scene.error && <div className="px-6 pb-4 text-[10px] text-red-500 font-bold uppercase">{scene.error}</div>}
        </div>
    );
};
