
export interface Scene {
  id: number;
  originalSentence: string;
  generatedPrompt: string | null;
  videoUrl: string | null;
  // Properties required for SceneCard component (legacy or for future image support)
  imageUrl?: string | null;
  isLoading?: boolean;
  nudgePrompt?: string;
  status: 'idle' | 'expanding' | 'rendering' | 'completed' | 'error';
  error: string | null;
}
