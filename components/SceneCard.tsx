
import React, { useState } from 'react';
import { Scene } from '../types';

interface SceneCardProps {
  scene: Scene;
  onRegenerate: (id: number) => void;
  onEdit: (id: number, nudge: string) => void;
  isLocked: boolean;
}

export const SceneCard: React.FC<SceneCardProps> = ({ scene, onRegenerate, onEdit, isLocked }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nudgeText, setNudgeText] = useState('');

  const handleExport = () => {
    if (!scene.imageUrl) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 1920, 1920);
        const link = document.createElement('a');
        link.download = `scene-0${scene.id}-export.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
      }
    };
    img.src = scene.imageUrl;
  };

  const isLoading = scene.status === 'expanding' || scene.status === 'generating';

  return (
    <div className="bg-[#121216] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col group transition-all hover:border-white/10 shadow-2xl">
      {/* Visual Area */}
      <div className="aspect-square bg-black relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 animate-pulse">
              {scene.status === 'expanding' ? 'Expanding Vision' : 'Rendering Pixels'}
            </span>
          </div>
        )}

        {scene.imageUrl ? (
          <img src={scene.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Generated" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-10">
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Scene 0{scene.id}</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-6 space-y-6 flex-grow flex flex-col">
        <div className="space-y-1">
          <h4 className="text-[9px] font-black uppercase tracking-widest text-cyan-600">Original Concept</h4>
          <p className="text-gray-400 text-xs leading-relaxed italic">"{scene.originalSentence}"</p>
        </div>

        {isEditing && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
             <input 
              value={nudgeText}
              onChange={(e) => setNudgeText(e.target.value)}
              placeholder="e.g., More fog..."
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-cyan-500/50 transition-colors text-white"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => { onEdit(scene.id, nudgeText); setIsEditing(false); }}
                className="flex-1 py-2 bg-cyan-600/20 text-cyan-400 text-[10px] font-black uppercase rounded-lg border border-cyan-500/30"
              >
                Apply Edit
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-white/5 text-gray-500 text-[10px] font-black uppercase rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-white/5 flex gap-2">
          {/* Repeat Icon Button */}
          <button 
            disabled={isLocked || isLoading}
            onClick={() => onRegenerate(scene.id)}
            className="flex-shrink-0 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition-all disabled:opacity-20 active:scale-95"
            title="Regenerate"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
              <polyline points="21 3 21 8 16 8"/>
            </svg>
          </button>
          
          <button 
            disabled={isLocked || isLoading || !scene.imageUrl}
            onClick={() => setIsEditing(true)}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-20"
          >
            Edit
          </button>
          <button 
            disabled={isLocked || isLoading || !scene.imageUrl}
            onClick={handleExport}
            className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-20"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};
