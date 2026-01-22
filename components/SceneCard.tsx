
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
    scene, onRegenerate, isGenerating, onPromptChange, onNudge, onNudgePromptChange, onGenerateVideo 
}) => {
    const handleDownload = () => {
        const url = scene.videoUrl || scene.imageUrl;
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        link.download = scene.videoUrl ? `video-${scene.id}.mp4` : `scene-${scene.id}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col ring-1 ring-white/10">
            <div className="aspect-video bg-gray-900 relative group">
                 {(scene.isLoading || scene.isVideoLoading) && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-center p-4">
                        <svg className="animate-spin h-10 w-10 text-cyan-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-cyan-400 font-medium">
                            {scene.isVideoLoading ? "Creating Cinematic Video..." : "Generating Visual Scene..."}
                        </p>
                        {scene.isVideoLoading && (
                            <p className="text-xs text-gray-400 mt-2 max-w-xs">
                                Veo is crafting high-quality motion. This usually takes 1-2 minutes.
                            </p>
                        )}
                    </div>
                 )}
                
                {scene.videoUrl ? (
                    <video src={scene.videoUrl} controls className="w-full h-full object-cover" autoPlay loop muted />
                ) : scene.imageUrl ? (
                    <img src={scene.imageUrl} alt="Generated scene" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 italic">
                        No visual content generated yet
                    </div>
                )}
            </div>

            <div className="p-6 flex-grow flex flex-col space-y-4">
                <div>
                    <h3 className="font-semibold text-xs text-cyan-400 uppercase tracking-widest mb-1">Story Context</h3>
                    <p className="text-gray-200 text-sm italic">"{scene.originalSentence}"</p>
                </div>

                <div>
                    <h3 className="font-semibold text-xs text-purple-400 uppercase tracking-widest mb-1">Production Prompt</h3>
                    <textarea
                        value={scene.generatedPrompt || ''}
                        onChange={(e) => onPromptChange(scene.id, e.target.value)}
                        disabled={isGenerating || scene.isVideoLoading}
                        className="w-full h-24 p-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm focus:ring-1 focus:ring-purple-500 resize-none transition-all"
                        placeholder="Awaiting prompt generation..."
                    />
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
                    <button
                        onClick={() => onRegenerate(scene.id)}
                        disabled={isGenerating || scene.isVideoLoading || !scene.generatedPrompt}
                        className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        RE-GEN IMAGE
                    </button>
                    
                    <button
                        onClick={() => onGenerateVideo(scene.id)}
                        disabled={isGenerating || scene.isVideoLoading || !scene.imageUrl}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        MAKE VIDEO
                    </button>
                    
                    <button
                        onClick={handleDownload}
                        disabled={(!scene.imageUrl && !scene.videoUrl) || isGenerating || scene.isVideoLoading}
                        className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        DOWNLOAD
                    </button>
                </div>
            </div>
        </div>
    );
};
