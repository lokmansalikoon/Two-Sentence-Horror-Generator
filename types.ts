
export interface Scene {
  id: number;
  originalSentence: string;
  generatedPrompt: string | null;
  nudgePrompt: string;
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}
