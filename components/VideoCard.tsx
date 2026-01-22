
import React from 'react';
import { Scene } from '../types';

interface VideoCardProps {
    scene: Scene;
}

export const VideoCard: React.FC<VideoCardProps> = ({ scene }) => {
    return (
        <div className="bg-[#121216] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl transition-all hover:border-white/20 flex flex-col h-full">
            <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                {scene.status === 'rendering' || scene.status === 'expanding' ? (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                        <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 animate-pulse">
                            {scene.status === 'expanding' ? 'Expanding Script...' : 'Rendering Frames...'}
                        </p>
                    </div>
                ) : null}

                {scene.videoUrl ? (
                    <video 
                        src={scene.videoUrl} 
                        controls 
                        autoPlay 
                        loop 
                        muted
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-800">
                        {scene.status === 'error' ? 'Production Failed' : 'Ready for Ingest'}
                    </div>
                )}
                
                <div className="absolute top-6 left-6 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest z-20">
                    Scene 0{scene.id}
                </div>
            </div>

            <div className="p-8 space-y-6 flex-grow flex flex-col">
                <div>
                    <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-2">Source Text</h4>
                    <p className="text-gray-300 text-sm italic font-light leading-relaxed">"{scene.originalSentence}"</p>
                </div>

                {scene.generatedPrompt && (
                    <div>
                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-500 mb-2">Technical Directive</h4>
                        <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-3">{scene.generatedPrompt}</p>
                    </div>
                )}

                {scene.error && (
                    <div className="mt-auto pt-4 border-t border-red-500/10">
                        <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Error: {scene.error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
