
import React from 'react';
import { Scene } from '../types';

interface VideoCardProps {
    scene: Scene;
}

export const VideoCard: React.FC<VideoCardProps> = ({ scene }) => {
    const isLoading = scene.status === 'generating' || scene.status === 'expanding';
    const isError = scene.status === 'error';

    return (
        <div className="bg-[#121216] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl transition-all hover:border-white/10 flex flex-col md:flex-row h-full group">
            {/* Visual Area */}
            <div className="md:w-3/5 aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
                        <div className="relative">
                            <div className="w-16 h-16 border-2 border-purple-500/10 border-t-purple-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-16 h-16 border-2 border-cyan-500/10 border-b-cyan-500 rounded-full animate-spin [animation-duration:3s]"></div>
                        </div>
                        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-white animate-pulse">
                            {scene.status === 'expanding' ? 'Expanding Directive' : 'Synthesizing Video'}
                        </p>
                    </div>
                )}

                {isError && (
                   <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-900/10 backdrop-blur-md">
                        <span className="text-red-500 mb-2">
                             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Synthesis Error</span>
                        <p className="text-[9px] text-red-500/50 mt-2 px-10 text-center">{scene.error}</p>
                   </div>
                )}

                {scene.videoUrl ? (
                    <video 
                        src={scene.videoUrl} 
                        controls
                        autoPlay
                        loop
                        muted
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex flex-col items-center opacity-10">
                        <div className="w-16 h-16 border-2 border-white rounded-xl mb-4 flex items-center justify-center">
                            <div className="w-6 h-6 bg-white" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Scene 0{scene.id}</span>
                    </div>
                )}
                
                <div className="absolute top-8 left-8 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.2em] z-20 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    SEQUENCE_0{scene.id}
                </div>
            </div>

            {/* Metadata Area */}
            <div className="md:w-2/5 p-10 space-y-8 flex-grow flex flex-col border-l border-white/5">
                <div className="space-y-3">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-500">Source Input</h4>
                    <p className="text-gray-300 text-sm italic font-light leading-relaxed">"{scene.originalSentence}"</p>
                </div>

                {scene.expandedPrompt && (
                    <div className="space-y-3">
                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-500">AI Motion Directive</h4>
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                            <p className="text-gray-500 text-[11px] leading-relaxed font-mono">{scene.expandedPrompt}</p>
                        </div>
                    </div>
                )}

                {scene.videoUrl && (
                    <div className="mt-auto pt-6 border-t border-white/5">
                        <a 
                            href={scene.videoUrl} 
                            download={`scene-0${scene.id}-production.mp4`}
                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Export MP4
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};
