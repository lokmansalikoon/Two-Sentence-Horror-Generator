
import React, { useState } from 'react';
import { Scene } from './types';
import { expandPrompt, generateImage, editImageWithNudge } from './services/geminiService';
import { SceneCard } from './components/SceneCard';
import { ErrorAlert } from './components/ErrorAlert';

const STYLE_OPTIONS = [
  "Noir Horror",
  "Found Footage",
  "Junji Ito Manga",
  "Psychological/Surreal Horror"
];

const App: React.FC = () => {
  const [sentence1, setSentence1] = useState('');
  const [sentence2, setSentence2] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLE_OPTIONS[0]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAutomation = async () => {
    if (!sentence1.trim() || !sentence2.trim()) {
      setError("Please provide both sentences to begin the workflow.");
      return;
    }
    setError(null);
    setIsProcessing(true);

    const targetScenes: Scene[] = [
      { id: 1, originalSentence: sentence1, expandedPrompt: null, imageUrl: null, status: 'idle', error: null },
      { id: 2, originalSentence: sentence2, expandedPrompt: null, imageUrl: null, status: 'idle', error: null }
    ];
    setScenes(targetScenes);

    for (const scene of targetScenes) {
      try {
        setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, status: 'expanding' } : s));
        const expanded = await expandPrompt(scene.originalSentence, selectedStyle);
        
        setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, expandedPrompt: expanded, status: 'generating' } : s));
        const url = await generateImage(expanded);
        
        setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, imageUrl: url, status: 'completed' } : s));
      } catch (err: any) {
        const msg = err.message || "Production halted due to an internal error.";
        setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, status: 'error', error: msg } : s));
        setError(msg);
        break;
      }
    }
    setIsProcessing(false);
  };

  const handleRegenerate = async (id: number) => {
    const scene = scenes.find(s => s.id === id);
    if (!scene) return;
    
    setIsProcessing(true);
    try {
      setScenes(prev => prev.map(s => s.id === id ? { ...s, status: 'expanding', error: null } : s));
      const expanded = await expandPrompt(scene.originalSentence, selectedStyle);
      setScenes(prev => prev.map(s => s.id === id ? { ...s, expandedPrompt: expanded, status: 'generating' } : s));
      const url = await generateImage(expanded);
      setScenes(prev => prev.map(s => s.id === id ? { ...s, imageUrl: url, status: 'completed' } : s));
    } catch (err: any) {
      setError(err.message);
      setScenes(prev => prev.map(s => s.id === id ? { ...s, status: 'error', error: err.message } : s));
    }
    setIsProcessing(false);
  };

  const handleEdit = async (id: number, nudge: string) => {
    const scene = scenes.find(s => s.id === id);
    if (!scene || !scene.imageUrl || !nudge) return;

    setIsProcessing(true);
    try {
      setScenes(prev => prev.map(s => s.id === id ? { ...s, status: 'generating' } : s));
      const newUrl = await editImageWithNudge(scene.imageUrl, nudge);
      setScenes(prev => prev.map(s => s.id === id ? { ...s, imageUrl: newUrl, status: 'completed' } : s));
    } catch (err: any) {
      setError(err.message);
      setScenes(prev => prev.map(s => s.id === id ? { ...s, status: 'error', error: err.message } : s));
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12 lg:p-20">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
              <h1 className="text-3xl font-black uppercase tracking-tighter">Director.AI</h1>
            </div>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.5em]">Economy Production Workflow</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-full border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Output: 1920x1920 JPG</span>
          </div>
        </header>

        <div className="grid lg:grid-cols-[340px_1fr] gap-20">
          {/* Controls */}
          <aside className="space-y-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 px-2">Production Context</label>
                <div className="grid grid-cols-1 gap-2">
                  {STYLE_OPTIONS.map(style => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      disabled={isProcessing}
                      className={`text-left px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        selectedStyle === style 
                        ? 'bg-cyan-600/10 border-cyan-500 text-cyan-400' 
                        : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 px-2">Scene 01 Ingest</label>
                <textarea 
                  value={sentence1}
                  onChange={(e) => setSentence1(e.target.value)}
                  placeholder="Sentence 1..."
                  disabled={isProcessing}
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm resize-none outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 px-2">Scene 02 Ingest</label>
                <textarea 
                  value={sentence2}
                  onChange={(e) => setSentence2(e.target.value)}
                  placeholder="Sentence 2..."
                  disabled={isProcessing}
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm resize-none outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <button 
              disabled={isProcessing}
              onClick={runAutomation}
              className="w-full py-6 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-20 text-white font-black uppercase tracking-[0.2em] rounded-full transition-all shadow-2xl shadow-cyan-900/30 active:scale-95"
            >
              {isProcessing ? "Producing..." : "Start Sequence"}
            </button>

            {error && <ErrorAlert message={error} />}
          </aside>

          {/* Canvas */}
          <main className="grid md:grid-cols-2 gap-10">
            {scenes.length > 0 ? (
              scenes.map(scene => (
                <SceneCard 
                  key={scene.id} 
                  scene={scene} 
                  onRegenerate={handleRegenerate}
                  onEdit={handleEdit}
                  isLocked={isProcessing}
                />
              ))
            ) : (
              <div className="col-span-2 h-[500px] border border-dashed border-white/10 rounded-[4rem] flex flex-col items-center justify-center opacity-20 space-y-4">
                <div className="w-20 h-20 border-4 border-white rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-sm" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[1em]">Awaiting Data</span>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
