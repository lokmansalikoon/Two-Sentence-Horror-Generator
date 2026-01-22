
export interface Scene {
  id: number;
  originalSentence: string;
  generatedPrompt: string | null;
  nudgePrompt: string;
  imageUrl: string | null;
  videoUrl: string | null;
  isLoading: boolean;
  isVideoLoading: boolean;
  error: string | null;
}
