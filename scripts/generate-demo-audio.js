// Script to generate authentic, pleasant, valid stereo 16-bit 44.1kHz WAV audio files
import fs from 'fs';
import path from 'path';

function createWavBuffer(sampleRate, durationSeconds, generateSample) {
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = totalSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const [left, right] = generateSample(t, i, totalSamples);
    
    // Clamp to [-1, 1]
    const clampedL = Math.max(-1, Math.min(1, left));
    const clampedR = Math.max(-1, Math.min(1, right));

    const intL = Math.floor(clampedL < 0 ? clampedL * 32768 : clampedL * 32767);
    const intR = Math.floor(clampedR < 0 ? clampedR * 32768 : clampedR * 32767);

    buffer.writeInt16LE(intL, offset);
    buffer.writeInt16LE(intR, offset + 2);
    offset += 4;
  }

  return buffer;
}

const outDir = path.resolve('public/audio');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Track 1: Neon Dreams (Extended 60s full synthwave track)
console.log('Generating Neon Dreams (Extended 60s)...');
const neonDreams = createWavBuffer(44100, 60, (t, sampleIndex, totalSamples) => {
  const fadeIn = Math.min(1, t / 1.5);
  const fadeOut = Math.min(1, (totalSamples - sampleIndex) / (44100 * 2));
  const envelope = fadeIn * fadeOut;

  // Chord progression: Am - F - C - G
  const chords = [
    [220.0, 261.63, 329.63, 440.0], // A minor
    [174.61, 220.0, 261.63, 349.23], // F major
    [130.81, 164.81, 196.0, 261.63], // C major
    [196.0, 246.94, 293.66, 392.0]  // G major
  ];
  const barDuration = 4;
  const chordIdx = Math.floor(t / barDuration) % chords.length;
  const currentChord = chords[chordIdx];

  const arpNoteIdx = Math.floor(t * 4) % currentChord.length;
  const arpFreq = currentChord[arpNoteIdx] * 2;
  const noteT = (t * 4) % 1;
  const noteEnv = Math.exp(-noteT * 4);
  const arpWave = (Math.sin(2 * Math.PI * arpFreq * t) + 0.3 * Math.sin(4 * Math.PI * arpFreq * t)) * noteEnv * 0.35;

  const bassFreq = currentChord[0] / 2;
  const bassT = (t * 2) % 1;
  const bassEnv = Math.exp(-bassT * 2);
  const bassWave = (Math.sin(2 * Math.PI * bassFreq * t) + 0.5 * Math.sin(2 * Math.PI * (bassFreq * 2) * t)) * bassEnv * 0.4;

  let pad = 0;
  for (const f of currentChord) {
    pad += Math.sin(2 * Math.PI * f * t) * 0.05;
  }

  const beatT = (t * 2) % 1;
  const kickEnv = Math.exp(-beatT * 12);
  const kick = Math.sin(2 * Math.PI * (60 * Math.exp(-beatT * 20)) * t) * kickEnv * 0.35;

  const left = (arpWave * 0.7 + bassWave * 0.6 + pad * 0.8 + kick * 0.5) * envelope;
  const right = (arpWave * 0.5 + bassWave * 0.6 + pad * 0.8 + kick * 0.5) * envelope;

  return [left, right];
});
fs.writeFileSync(path.join(outDir, 'neon-dreams.wav'), neonDreams);

// Track 2: Midnight Coffee (Extended 60s full lofi chillhop track)
console.log('Generating Midnight Coffee (Extended 60s)...');
const midnightCoffee = createWavBuffer(44100, 60, (t, sampleIndex, totalSamples) => {
  const fadeIn = Math.min(1, t / 2);
  const fadeOut = Math.min(1, (totalSamples - sampleIndex) / (44100 * 2.5));
  const envelope = fadeIn * fadeOut;

  const chords = [
    [146.83, 220.0, 261.63, 329.63], // Dm9
    [98.0, 196.0, 246.94, 329.63],  // G13
    [130.81, 196.0, 246.94, 293.66], // Cmaj9
    [110.0, 174.61, 220.0, 277.18]  // A7
  ];
  const barDuration = 4;
  const chordIdx = Math.floor(t / barDuration) % chords.length;
  const currentChord = chords[chordIdx];

  const vibrato = 1 + 0.004 * Math.sin(2 * Math.PI * 4.5 * t);
  let ePiano = 0;
  const strikeT = (t / 2) % 1;
  const strikeEnv = Math.exp(-strikeT * 1.8);
  for (const f of currentChord) {
    const freq = f * vibrato;
    ePiano += (Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-strikeT * 5)) * 0.12;
  }
  ePiano *= strikeEnv;

  const crackle = (Math.random() > 0.996 ? (Math.random() - 0.5) * 0.15 : 0);
  const subFreq = currentChord[0] / 2;
  const subBass = Math.sin(2 * Math.PI * subFreq * t) * 0.25;

  const left = (ePiano + subBass + crackle) * envelope * 0.8;
  const right = (ePiano * 0.95 + subBass + crackle * 0.8) * envelope * 0.8;
  return [left, right];
});
fs.writeFileSync(path.join(outDir, 'midnight-coffee.wav'), midnightCoffee);

// Track 3: Deep Space Ambient (Extended 60s full ambient soundscape)
console.log('Generating Deep Space Ambient (Extended 60s)...');
const deepSpace = createWavBuffer(44100, 60, (t, sampleIndex, totalSamples) => {
  const fadeIn = Math.min(1, t / 3);
  const fadeOut = Math.min(1, (totalSamples - sampleIndex) / (44100 * 3));
  const envelope = fadeIn * fadeOut;

  const frequencies = [65.41, 130.81, 155.56, 196.0, 261.63, 311.13, 392.0];
  let droneL = 0;
  let droneR = 0;

  frequencies.forEach((f, idx) => {
    const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * (0.05 + idx * 0.03) * t);
    const wave = Math.sin(2 * Math.PI * f * t);
    const pan = (idx / frequencies.length);
    droneL += wave * lfo * (1 - pan) * 0.1;
    droneR += wave * lfo * pan * 0.1;
  });

  return [droneL * envelope, droneR * envelope];
});
fs.writeFileSync(path.join(outDir, 'deep-space.wav'), deepSpace);

console.log('Extended 60s demo audio files successfully generated in public/audio/');
