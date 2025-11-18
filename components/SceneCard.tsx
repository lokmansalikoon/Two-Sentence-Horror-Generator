import React from 'react';
import { Scene } from '../types';

interface SceneCardProps {
    scene: Scene;
    onRegenerate: (id: number) => void;
    isGenerating: boolean;
    onPromptChange: (id: number, newPrompt: string) => void;
    onNudge: (id: number) => void;
    onNudgePromptChange: (id: number, newNudgePrompt: string) => void;
}

const SkeletonLoader: React.FC = () => (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse">
        <div className="aspect-video bg-gray-700"></div>
        <div className="p-6 space-y-4">
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
    </div>
);

export const SceneCard: React.FC<SceneCardProps> = ({ scene, onRegenerate, isGenerating, onPromptChange, onNudge, onNudgePromptChange }) => {
    const handleDownload = () => {
        if (!scene.imageUrl) return;
        const link = document.createElement('a');
        link.href = scene.imageUrl;
        link.download = `scene-${scene.id}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    if (scene.isLoading && !scene.generatedPrompt) {
        return <SkeletonLoader />;
    }

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col ring-1 ring-white/10">
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
                 {scene.isLoading && !scene.imageUrl && (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg className="animate-spin h-10 w-10 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-4 text-sm">Generating Image...</p>
                    </div>
                 )}
                {scene.error && !scene.imageUrl && (
                     <div className="p-4 text-center text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>Image generation failed.</p>
                     </div>
                )}
                {scene.imageUrl && (
                    <img src={scene.imageUrl} alt={scene.generatedPrompt || 'Generated scene'} className="w-full h-full object-cover" />
                )}
            </div>
            <div className="p-6 flex-grow flex flex-col">
                <div className="flex-grow space-y-4">
                    <div>
                        <h3 className="font-semibold text-sm text-cyan-400 uppercase tracking-wider mb-1">Original Sentence</h3>
                        <p className="text-gray-300 italic">"{scene.originalSentence}"</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-cyan-400 uppercase tracking-wider mb-1">Generated Prompt</h3>
                        {scene.generatedPrompt !== null ? (
                             <textarea
                                value={scene.generatedPrompt}
                                onChange={(e) => onPromptChange(scene.id, e.target.value)}
                                disabled={isGenerating}
                                className="w-full h-28 p-2 bg-gray-700/50 border border-gray-600 rounded-md text-gray-300 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 resize-none"
                                aria-label="Generated prompt"
                                placeholder="Generating prompt..."
                            />
                        ) : (
                             <p className="text-gray-500 text-sm">
                                {scene.error ? 'Prompt generation failed.' : 'Awaiting generation...'}
                            </p>
                        )}
                       
                    </div>
                     {scene.imageUrl && (
                        <div>
                            <h3 className="font-semibold text-sm text-purple-400 uppercase tracking-wider mb-1">Nudge Image</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={scene.nudgePrompt}
                                    onChange={(e) => onNudgePromptChange(scene.id, e.target.value)}
                                    disabled={isGenerating}
                                    className="flex-grow p-2 bg-gray-700/50 border border-gray-600 rounded-md text-gray-300 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                    aria-label="Nudge prompt"
                                    placeholder="e.g., 'add rain', 'make it night time'"
                                />
                                <button
                                    onClick={() => onNudge(scene.id)}
                                    disabled={isGenerating || !scene.nudgePrompt.trim()}
                                    className="px-4 font-semibold text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    Nudge
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {scene.error && (
                    <div className="mt-4 p-3 bg-red-900/50 text-red-300 text-xs rounded-lg">
                        <strong>Error:</strong> {scene.error}
                    </div>
                )}
                <div className="mt-6 pt-4 border-t border-gray-700 flex items-center gap-4">
                    <button
                        onClick={() => onRegenerate(scene.id)}
                        disabled={isGenerating || !scene.generatedPrompt}
                        className="flex-1 h-10 px-4 font-semibold text-sm text-cyan-300 bg-gray-700/50 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 15M20 20l-1.5-1.5A9 9 0 003.5 9" />
                        </svg>
                        Re-generate
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={!scene.imageUrl || isGenerating}
                        className="flex-1 h-10 px-4 font-semibold text-sm text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                    </button>
                </div>
            </div>
        </div>
    );
};