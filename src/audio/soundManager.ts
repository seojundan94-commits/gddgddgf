/**
 * Procedural Web Audio API sound synthesizer for Backrooms horror atmosphere.
 * Operates without external audio asset downloads for 100% offline & instantaneous reliability.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private humGain: GainNode | null = null;
  private heartbeatGain: GainNode | null = null;
  private staticGain: GainNode | null = null;
  private entityDroneGain: GainNode | null = null;
  
  private humOsc1: OscillatorNode | null = null;
  private humOsc2: OscillatorNode | null = null;
  private staticNode: AudioBufferSourceNode | null = null;
  private entityOsc: OscillatorNode | null = null;

  private isHumming = false;
  private lastFootstepTime = 0;
  private lastHeartbeatTime = 0;
  private isMuted = false;
  private masterVolume = 0.8;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Start continuous ambient hum and continuous static buffer
      this.startAmbientHum();
      this.startStaticNoise();
      this.startEntityDrone();
    } catch (e) {
      console.warn('Web Audio initialization failed:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  private startAmbientHum() {
    if (!this.ctx || !this.masterGain || this.isHumming) return;
    this.isHumming = true;

    // Fluorescent lights 60Hz and 120Hz hum
    this.humGain = this.ctx.createGain();
    this.humGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    // Filter to give that metallic ballast buzz
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(180, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.humOsc1 = this.ctx.createOscillator();
    this.humOsc1.type = 'sawtooth';
    this.humOsc1.frequency.setValueAtTime(60, this.ctx.currentTime);

    this.humOsc2 = this.ctx.createOscillator();
    this.humOsc2.type = 'sine';
    this.humOsc2.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.humOsc1.connect(filter);
    this.humOsc2.connect(filter);
    filter.connect(this.humGain);
    this.humGain.connect(this.masterGain);

    this.humOsc1.start();
    this.humOsc2.start();

    // Occasional subtle lamp flicker pop
    setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      if (Math.random() < 0.25) {
        this.playFlickerPop();
      }
    }, 4000);
  }

  public playFlickerPop() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Quick dip in hum
    if (this.humGain) {
      this.humGain.gain.setValueAtTime(0.02, now);
      this.humGain.gain.exponentialRampToValueAtTime(0.18, now + 0.15);
    }

    // Spark / pop noise
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  private startStaticNoise() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    this.staticNode = this.ctx.createBufferSource();
    this.staticNode.buffer = buffer;
    this.staticNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    this.staticGain = this.ctx.createGain();
    this.staticGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.staticNode.connect(filter);
    filter.connect(this.staticGain);
    this.staticGain.connect(this.masterGain);
    this.staticNode.start();
  }

  private startEntityDrone() {
    if (!this.ctx || !this.masterGain) return;
    this.entityDroneGain = this.ctx.createGain();
    this.entityDroneGain.gain.setValueAtTime(0, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(90, this.ctx.currentTime);

    this.entityOsc = this.ctx.createOscillator();
    this.entityOsc.type = 'sawtooth';
    this.entityOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

    this.entityOsc.connect(filter);
    filter.connect(this.entityDroneGain);
    this.entityDroneGain.connect(this.masterGain);
    this.entityOsc.start();
  }

  /**
   * Updates audio based on entity distance:
   * Increases sub-bass drone and radioactive static crackle as entity approaches.
   */
  public updateEntityProximity(distance: number, maxDist = 30) {
    if (!this.ctx || !this.staticGain || !this.entityDroneGain) return;
    const now = this.ctx.currentTime;
    if (distance >= maxDist) {
      this.staticGain.gain.setTargetAtTime(0, now, 0.2);
      this.entityDroneGain.gain.setTargetAtTime(0, now, 0.2);
      return;
    }

    const intensity = Math.pow(1 - distance / maxDist, 2); // quadratic rise
    const staticVol = intensity * 0.28;
    const droneVol = intensity * 0.45;

    this.staticGain.gain.setTargetAtTime(staticVol, now, 0.1);
    this.entityDroneGain.gain.setTargetAtTime(droneVol, now, 0.1);

    if (this.entityOsc) {
      this.entityOsc.frequency.setTargetAtTime(45 + intensity * 60, now, 0.1);
    }
  }

  public playFootstep(isSprinting: boolean, isCrouching: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = performance.now();
    const interval = isSprinting ? 280 : isCrouching ? 550 : 420;
    if (now - this.lastFootstepTime < interval) return;
    this.lastFootstepTime = now;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Damp carpet thud
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isCrouching ? 160 : 240, t);

    osc.type = 'sine';
    const baseFreq = isSprinting ? 75 : 60;
    const pitchJitter = (Math.random() - 0.5) * 12;
    osc.frequency.setValueAtTime(baseFreq + pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.1);

    const vol = isCrouching ? 0.06 : isSprinting ? 0.22 : 0.13;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playFlashlightClick(turnOn: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(turnOn ? 1200 : 900, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playPickup() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    
    // Cassette mechanical click + subtle chime
    [520, 650, 780].forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.18, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.21);
    });
  }

  public playDrinkWater() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 + i * 40, t + i * 0.12);
      osc.frequency.exponentialRampToValueAtTime(180, t + i * 0.12 + 0.09);
      gain.gain.setValueAtTime(0.15, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.09);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.1);
    }
  }

  public updateHeartbeat(sanity: number, distanceToEntity: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = performance.now();
    
    // Danger factor 0 to 1
    const sanityFactor = Math.max(0, 1 - sanity / 100);
    const entityFactor = Math.max(0, 1 - distanceToEntity / 20);
    const danger = Math.max(sanityFactor, entityFactor);

    if (danger < 0.25) return; // Calm heartbeat not heard

    // Interval from 1100ms down to 360ms
    const interval = 1100 - danger * 740;
    if (now - this.lastHeartbeatTime < interval) return;
    this.lastHeartbeatTime = now;

    // Dual beat: lub-dub
    this.playHeartThump(0, 0.2 + danger * 0.3);
    this.playHeartThump(0.11, 0.15 + danger * 0.25);
  }

  private playHeartThump(delaySec: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime + delaySec;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.1);

    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playEntityRoar() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    
    // Low sinister gutter growl with FM screech
    const carrier = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const mainGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(140, t);
    carrier.frequency.exponentialRampToValueAtTime(70, t + 1.2);

    mod.type = 'square';
    mod.frequency.setValueAtTime(220, t);
    mod.frequency.exponentialRampToValueAtTime(50, t + 1.2);

    modGain.gain.setValueAtTime(300, t);
    modGain.gain.exponentialRampToValueAtTime(40, t + 1.2);

    mod.connect(carrier.frequency);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, t);
    filter.Q.setValueAtTime(3, t);

    mainGain.gain.setValueAtTime(0.4, t);
    mainGain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);

    carrier.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(this.masterGain);

    carrier.start(t);
    mod.start(t);
    carrier.stop(t + 1.25);
    mod.stop(t + 1.25);
  }

  public playJumpscare() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Screaming dissonant chords + violent burst
    const freqs = [180, 245, 360, 540, 790, 1100];
    freqs.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * 1.5, t + 0.3);
      osc.frequency.exponentialRampToValueAtTime(80, t + 1.8);

      gain.gain.setValueAtTime(0.45 / freqs.length, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 1.9);
    });

    // Sub thump
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(95, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + 0.8);
    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(t);
    sub.stop(t + 0.9);
  }

  public playExitDoorUnlocked() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    [261.6, 329.6, 392.0, 523.2].forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.15);
      gain.gain.setValueAtTime(0.2, t + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.15 + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.15);
      osc.stop(t + idx * 0.15 + 0.7);
    });
  }
}

export const soundManager = new SoundManager();
