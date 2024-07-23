export class AudioManager {
  readonly context = new AudioContext();
  readonly activeSounds: WeakMap<{}, AudioBufferSourceNode> = new WeakMap();

  async loadSound(url: URL) {
    const response = await fetch(url);

    if (!response.ok) throw new Error(`failed to load ${url}`);

    const buffer = await response.arrayBuffer();

    return this.context.decodeAudioData(buffer);
  }

  playSound(owner: null | {}, buffer: AudioBuffer, volume: number = 1) {
    const { activeSounds, context } = this;

    if (owner) {
      const priorSound = activeSounds.get(owner);
      if (priorSound) {
        priorSound.stop();
      }
    }

    if (volume <= 0) return;

    let source = context.createBufferSource();
    source.buffer = buffer;
    if (volume >= 1) {
      source.connect(context.destination);
    } else {
      const gainNode = context.createGain();
      gainNode.gain.value = volume;
      source.connect(gainNode);
      gainNode.connect(context.destination);
    }
    source.start();

    if (owner) {
      activeSounds.set(owner, source);
    }
  }
}
