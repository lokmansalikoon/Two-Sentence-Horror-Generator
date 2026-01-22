
import React, { useState } from 'react';
import { Scene } from '../types';

interface SceneCardProps {
    scene: Scene;
    onRegenerate: (id: number) => void;
    isGenerating: boolean;
    onPromptChange: (id: number, newPrompt: string) => void;
    onNudge: (id: number) => void;
    onNudgePromptChange: (id: number, newNudgePrompt: string) => void;
    aspectRatio: string;
}

export const SceneCard: React.FC<SceneCardProps> = ({ 
    scene, onRegenerate, isGenerating, onPromptChange, onNudge, onNudgePromptChange, aspectRatio
}) => {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const handleDownload = () => {
        if (!scene.imageUrl) return;
        const link = document.createElement('a');
        link.href = scene.imageUrl;
        link.download = `storyboard-scene-${scene.id}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getAspectClass = () => {
        switch (aspectRatio) {
            case '1:1': return 'aspect-square';
            case '9:16': return 'aspect-[9/16]';
            case '16:9':
            default: return 'aspect-video';
        }
    };
    
    return (
        <>
            <div className="bg-[#121216] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10 group transition-all hover:ring-white/20">
                {/* Fixed Aspect Ratio Container with NO Clipping */}
                <div className={`${getAspectClass()} bg-black relative overflow-hidden cursor-zoom-in flex items-center justify-center`} onClick={() => scene.imageUrl && setIsLightboxOpen(true)}>
                     {scene.isLoading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl text-center p-6">
                            <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                            <p className="text-cyan-400 font-black mt-6 tracking-widest uppercase text-[10px]">
                                Developing Visual Asset
                            </p>
                        </div>
                     )}
                    
                    {scene.imageUrl ? (
                        <>
                            {/* object-contain is vital here to ensure the full image frame is visible */}
                            <img 
                                src={scene.imageUrl} 
                                alt="Generated scene" 
                                className="max-w-full max-h-full object-contain transition-all duration-700 group-hover:scale-[1.01]" 
                            />
                            {/* Ambient background bleed for aesthetic letterboxing */}
                            <div 
                                className="absolute inset-0 -z-10 blur-3xl opacity-10 scale-125" 
                                style={{ backgroundImage: `url(${scene.imageUrl})`, backgroundSize: 'cover' }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <span className="bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 shadow-xl">Inspect Keyframe</span>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-950 italic text-gray-800 text-[10px] uppercase font-black tracking-widest">
                            Awaiting Frame Generation
                        </div>
                    )}

                    <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest z-20">
                        Frame 0{scene.id}
                    </div>
                </div>

                <div className="p-10 flex-grow flex flex-col space-y-8">
                    <div>
                        <h3 className="font-black text-[10px] text-cyan-500 uppercase tracking-[0.4em] mb-4">I. Production Script</h3>
                        <p className="text-gray-200 text-lg italic font-light leading-relaxed">"{scene.originalSentence}"</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-[10px] text-purple-500 uppercase tracking-[0.4em]">II. Visual Directives</h3>
                            {scene.error && (
                                <span className="text-[9px] text-red-500 font-black uppercase tracking-widest animate-pulse">Update to retry</span>
                            )}
                        </div>
                        <textarea
                            value={scene.generatedPrompt || ''}
                            onChange={(e) => onPromptChange(scene.id, e.target.value)}
                            disabled={isGenerating}
                            className={`w-full h-28 p-6 bg-black/60 border rounded-3xl text-gray-400 text-sm focus:ring-1 focus:ring-purple-500 resize-none transition-all placeholder:text-gray-800 leading-relaxed scrollbar-hide ${
                                scene.error ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-gray-800/50'
                            }`}
                            placeholder="Awaiting AI expansion..."
                        />
                    </div>

                    {scene.imageUrl && (
                        <div className="space-y-4">
                            <h3 className="font-black text-[10px] text-amber-500 uppercase tracking-[0.4em]">III. Asset Refinement</h3>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    placeholder="Change lighting, add elements..."
                                    value={scene.nudgePrompt}
                                    onChange={(e) => onNudgePromptChange(scene.id, e.target.value)}
                                    className="flex-grow bg-black/60 border border-gray-800/50 rounded-2xl px-6 py-4 text-sm text-gray-300 outline-none focus:border-amber-500/50"
                                />
                                <button 
                                    onClick={() => onNudge(scene.id)}
                                    disabled={!scene.nudgePrompt || scene.isLoading}
                                    className="px-8 py-4 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl text-[10px] font-black uppercase hover:bg-amber-500/20 disabled:opacity-30 transition-all"
                                >
                                    FIX
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 pt-10 border-t border-gray-800/30">
                        <button
                            onClick={() => onRegenerate(scene.id)}
                            disabled={isGenerating || !scene.generatedPrompt}
                            className="flex-[2] py-6 px-8 bg-white text-black rounded-full text-[10px] font-black tracking-widest uppercase transition-all hover:bg-cyan-400 disabled:opacity-50 active:scale-95 shadow-xl"
                        >
                            {scene.error ? 'Retry Asset' : 'Regenerate'}
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={!scene.imageUrl || isGenerating}
                            className="flex-1 py-6 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5 disabled:opacity-30 transition-all"
                        >
                            Export
                        </button>
                    </div>
                </div>
                {scene.error && <div className="px-10 pb-8 text-[10px] text-red-500 font-bold uppercase tracking-widest">{scene.error}</div>}
            </div>

            {/* Cinematic Lightbox */}
            {isLightboxOpen && scene.imageUrl && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-6 md:p-16 animate-in fade-in zoom-in-95 duration-300 cursor-zoom-out"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <div className="relative max-w-full max-h-full flex flex-col items-center">
                        <img 
                            src={scene.imageUrl} 
                            alt="Full production frame" 
                            className={`max-w-full max-h-[80vh] object-contain shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-2xl border border-white/5`} 
                        />
                        <div className="mt-12 text-center space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-500">Keyframe 0{scene.id} • Full Resolution</h4>
                            <p className="text-gray-400 text-sm italic max-w-2xl">"{scene.originalSentence}"</p>
                            <div className="flex gap-4 justify-center mt-6">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
                                    className="px-10 py-4 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Return to Suite
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                                    className="px-10 py-4 bg-cyan-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all"
                                >
                                    Download JPEG
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
