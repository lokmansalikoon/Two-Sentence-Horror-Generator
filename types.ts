
export type SceneStatus = 'idle' | 'expanding' | 'generating' | 'completed' | 'error';

export interface Scene {
  id: number;
  originalSentence: string;
  expandedPrompt: string | null;
  imageUrl: string | null;
  status: SceneStatus;
  error: string | null;
}
