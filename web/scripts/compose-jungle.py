"""Canopy Dawn: an original 16-bar piano / bowed-string loop. Requires numpy and soundfile."""
from pathlib import Path
import numpy as np
import soundfile as sf

RATE = 44100
BEAT = 60 / 90
DURATION = 64 * BEAT
rng = np.random.default_rng(8636)
mix = np.zeros((int((DURATION + 2) * RATE), 2), dtype=np.float64)

def voice(midi, seconds, instrument):
    t = np.arange(int(seconds * RATE)) / RATE
    hz = 440 * 2 ** ((midi - 69) / 12)
    wave = np.zeros_like(t)
    if instrument == 'piano':
        for harmonic in range(1, 9):
            frequency = hz * harmonic * np.sqrt(1 + .00012 * harmonic ** 2)
            wave += np.sin(2 * np.pi * frequency * t) * np.exp(-t * (1.3 + harmonic * .7)) / harmonic ** 1.35
        envelope = np.minimum(t / .008, 1) * np.minimum((seconds - t) / .08, 1)
    else:
        vibrato = .003 * np.sin(2 * np.pi * (4.5 if instrument == 'cello' else 5.4) * t)
        phase = 2 * np.pi * hz * np.cumsum(1 + vibrato) / RATE
        exponent = {'violin': 1.15, 'viola': 1.5, 'cello': 1.9}[instrument]
        for harmonic in range(1, 13):
            wave += np.sin(harmonic * phase + harmonic * .18) / harmonic ** exponent
        envelope = np.minimum(t / .28, 1) * np.minimum((seconds - t) / .5, 1)
        envelope *= .88 + .12 * np.sin(np.pi * t / seconds)
    return wave * np.clip(envelope, 0, 1)

def note(midi, beat, length, instrument, volume, pan):
    if midi is None:
        return
    sound = voice(midi, length * BEAT, instrument) * volume
    begin = int(beat * BEAT * RATE)
    end = min(begin + len(sound), len(mix))
    mix[begin:end, 0] += sound[:end-begin] * np.sqrt((1-pan)/2)
    mix[begin:end, 1] += sound[:end-begin] * np.sqrt((1+pan)/2)

chords = [(50,53,57),(46,50,53),(48,53,57),(48,52,55),(43,46,50),(50,53,57),(52,55,58),(45,49,52)] * 2
melody = [
    [74, None, 77, 76, 74, 69], [70, 72, 74, None, 77, 74],
    [72, 77, 81, 79, None, 77], [76, 74, 72, 67, 69, None],
    [70, None, 74, 77, 74, 72], [69, 74, 77, None, 76, 74],
    [71, 74, None, 77, 76, 71], [73, 76, 81, None, 79, 73],
    [74, 77, None, 81, 79, 77], [74, 70, 72, 74, None, 77],
    [81, None, 79, 77, 72, 77], [76, 79, 76, 72, None, 69],
    [70, 74, 77, 79, None, 77], [74, None, 77, 76, 74, 69],
    [71, 74, 77, None, 76, 73], [69, 73, None, 76, 73, 69],
]
for bar, chord in enumerate(chords):
    start = bar * 4
    note(chord[0]-12, start, 3.9, 'cello', .10, -.12)
    note(chord[1], start+.1, 3.7, 'viola', .065, .35)
    note(chord[2], start+.2, 3.6, 'viola', .035, -.40)
    for i, offset in enumerate([0,.5,1,1.5,2,2.5,3,3.5]):
        note(chord[[0,1,2,1,0,2,1,2][i]]+12, start+offset, 1.5, 'piano', .12*(.85+rng.random()*.3), -.25 if i%2 else .25)
    for pitch, offset in zip(melody[bar], [0,.75,1.5,2,2.5,3.25]):
        note(pitch, start+offset, .72, 'violin', .065, -.10)

for delay, gain in [(.073,.10),(.149,.075),(.271,.055),(.433,.035)]:
    count = int(delay * RATE)
    mix[count:] += mix[:-count, ::-1] * gain
# Fold the final string/reverb tail into the opening for a seamless loop.
length = int(DURATION * RATE)
tail = mix[length:]
mix[:len(tail)] += tail
mix = mix[:length]
mix = np.tanh(mix * 1.1)
mix *= .88 / np.max(np.abs(mix))
destination = Path(__file__).resolve().parents[1] / 'public/audio/canopy-dawn.mp3'
destination.parent.mkdir(exist_ok=True)
with sf.SoundFile(destination, 'w', samplerate=RATE, channels=2, format='MP3', subtype='MPEG_LAYER_III') as output:
    for offset in range(0, len(mix), 4096):
        output.write(mix[offset:offset+4096])
print(f'{destination}: {DURATION:.2f}s, stereo, 44.1 kHz; peak={np.max(np.abs(mix)):.3f}, rms={np.sqrt(np.mean(mix**2)):.3f}')
