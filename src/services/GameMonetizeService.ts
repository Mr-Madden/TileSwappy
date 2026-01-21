declare global {
  interface Window {
    SDK_OPTIONS?: {
      gameId: string;
      onEvent: (event: { name: string; data?: any }) => void;
    };
    sdk?: {
      showBanner: () => void;
    };
  }
}

export class GameMonetizeService {
  private static isInitialized = false;
  private static isPaused = false;
  private static onPauseCallback?: () => void;
  private static onResumeCallback?: () => void;

  static initialize(gameId: string, onPause: () => void, onResume: () => void): void {
    if (this.isInitialized) return;

    this.onPauseCallback = onPause;
    this.onResumeCallback = onResume;

    window.SDK_OPTIONS = {
      gameId: gameId,
      onEvent: (event) => {
        console.log('🎮 GameMonetize Event:', event.name);
        
        switch (event.name) {
          case 'SDK_GAME_PAUSE':
            // Ad is about to play - PAUSE AND MUTE game
            console.log('⏸️ Pausing game for ad');
            this.isPaused = true;
            if (this.onPauseCallback) {
              this.onPauseCallback();
            }
            break;
            
          case 'SDK_GAME_START':
            // Ad finished - RESUME game
            console.log('▶️ Resuming game after ad');
            this.isPaused = false;
            if (this.onResumeCallback) {
              this.onResumeCallback();
            }
            break;
            
          case 'SDK_READY':
            // SDK is ready to show ads
            console.log('✅ GameMonetize SDK ready');
            break;
        }
      }
    };

    this.isInitialized = true;
    console.log('✅ GameMonetize initialized with ID:', gameId);
  }

  static showAd(): void {
    if (typeof window.sdk !== 'undefined' && window.sdk.showBanner) {
      console.log('📺 Showing GameMonetize ad');
      window.sdk.showBanner();
    } else {
      console.warn('⚠️ GameMonetize SDK not ready');
    }
  }

  static isAdPaused(): boolean {
    return this.isPaused;
  }
}