import { ColorSchemeName, StoredTrainingProgress } from "@/types";

export class AppStorage {
  private static readonly TOKEN_KEY = "flashcard-trainer.token";
  private static readonly TRAINING_KEY = "flashcard-trainer.training";
  private static readonly SCHEME_STORAGE_KEY = "flashcard-trainer.colorScheme";

  static getAuthToken(): string | null {
    return window.localStorage.getItem(this.TOKEN_KEY);
  }

  static setAuthToken(token: string | null): void {
    if (token) {
      window.localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  static cacheScheme(scheme: ColorSchemeName): void {
    window.localStorage.setItem(this.SCHEME_STORAGE_KEY, scheme);
  }

  static getScheme(): string | null {
    return window.localStorage.getItem(this.SCHEME_STORAGE_KEY);
  }

  static getTrainingProgress(): StoredTrainingProgress | null {
    const raw = window.localStorage.getItem(this.TRAINING_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as StoredTrainingProgress;
    } catch {
      return null;
    }
  }

  static setTrainingProgressNoException(progress: StoredTrainingProgress): void {
    try {
      window.localStorage.setItem(this.TRAINING_KEY, JSON.stringify(progress));
    } catch {
      // Ignore errors
    }
  }

  static clearTrainingProgress(): void {
    window.localStorage.removeItem(this.TRAINING_KEY);
  }
}
