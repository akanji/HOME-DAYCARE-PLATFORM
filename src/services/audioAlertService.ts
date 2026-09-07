// Web Audio API based audio alert service for non-intrusive safety hazard chimes

class AudioAlertService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.6; // 0.0 to 1.0

  constructor() {
    // Read saved preference from localStorage if available
    try {
      const savedMute = localStorage.getItem('daycare_cv_audio_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
      const savedVol = localStorage.getItem('daycare_cv_audio_volume');
      if (savedVol !== null) {
        this.volume = parseFloat(savedVol) || 0.6;
      }
    } catch {
      // Ignore storage errors in sandboxed iframes
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('daycare_cv_audio_muted', String(muted));
    } catch {
      // storage fallback
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('daycare_cv_audio_volume', String(this.volume));
    } catch {
      // storage fallback
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Plays a distinct, gentle, non-intrusive dual-tone chime (D5 -> A5)
   * Designed specifically for childcare environments: warm sine/triangle wave,
   * gentle exponential decay, soft low-pass filter to prevent startling toddlers.
   */
  public playHazardAlert(severity: 'high' | 'medium' | 'low' = 'medium') {
    if (this.isMuted) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume * 0.4, now);

      // Low-pass filter for smooth, organic chime warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(severity === 'high' ? 2400 : 1800, now);

      masterGain.connect(filter);
      filter.connect(ctx.destination);

      // Frequency notes:
      // High severity: E5 (659.25Hz) -> B5 (987.77Hz) with slight pulse
      // Medium severity: D5 (587.33Hz) -> A5 (880.00Hz)
      // Low severity: G4 (392.00Hz) -> D5 (587.33Hz)
      const baseFreq = severity === 'high' ? 659.25 : severity === 'low' ? 392.0 : 587.33;
      const secondFreq = severity === 'high' ? 987.77 : severity === 'low' ? 587.33 : 880.0;

      // Note 1: First chime note
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.7, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(masterGain);

      osc1.start(now);
      osc1.stop(now + 0.38);

      // Note 2: Melodic second chime note slightly delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(secondFreq, now + 0.12);

      gain2.gain.setValueAtTime(0.0001, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.85, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc2.connect(gain2);
      gain2.connect(masterGain);

      osc2.start(now + 0.12);
      osc2.stop(now + 0.58);

      // If high severity, add a subtle third resolving note (C#6: 1108.73Hz)
      if (severity === 'high') {
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(1108.73, now + 0.24);

        gain3.gain.setValueAtTime(0.0001, now + 0.24);
        gain3.gain.exponentialRampToValueAtTime(0.6, now + 0.26);
        gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

        osc3.connect(gain3);
        gain3.connect(masterGain);

        osc3.start(now + 0.24);
        osc3.stop(now + 0.68);
      }
    } catch (e) {
      console.warn('Audio alert playback suppressed or unsupported:', e);
    }
  }

  /**
   * Preview chime for test button
   */
  public playTestChime() {
    this.playHazardAlert('medium');
  }
}

export const audioAlertService = new AudioAlertService();
