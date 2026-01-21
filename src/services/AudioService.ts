export class AudioService {
  private static isMuted = false;

  static mute(): void {
    this.isMuted = true;
    console.log('🔇 Audio muted for ad');
  }

  static unmute(): void {
    this.isMuted = false;
    console.log('🔊 Audio unmuted after ad');
  }

  static playCelebrationSound(): void {
    if (this.isMuted) {
      console.log('🔇 Sound blocked - ad is playing');
      return;
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const notes = [
        { freq: 523.25, time: 0, duration: 0.15 },
        { freq: 659.25, time: 0.15, duration: 0.15 },
        { freq: 783.99, time: 0.3, duration: 0.15 },
        { freq: 1046.50, time: 0.45, duration: 0.3 }
      ];
      
      notes.forEach(note => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = note.freq;
        
        const now = audioContext.currentTime + note.time;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + note.duration);
        
        oscillator.start(now);
        oscillator.stop(now + note.duration);
      });
    } catch (error) {
      console.log('Audio playback not supported:', error);
    }
  }
}