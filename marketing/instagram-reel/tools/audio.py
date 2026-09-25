"""Soundtrack for the Westfalia Digital reel: a restrained, serious corporate
underscore (D minor resolving to F major) on the reel's 124 BPM grid, plus a
small set of sound effects. Low pulse, muted pluck ostinato, low strings, a few
soft piano notes and a quiet kick; no pop instruments and no reverb washes.
Everything is synthesized here and placed from the compositor's SFX timeline."""
import json
import os
import wave

import numpy as np
import pedalboard as pb
import pyloudnorm as pyln
from scipy import signal

SR = 48000
BPM = 124
B = 60 / BPM
BEATS = 48
DUR = BEATS * B
N = int(round(DUR * SR))
S16 = B / 4
rng = np.random.default_rng(21)


def ta(d):
    return np.arange(int(round(d * SR))) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    bb, aa = signal.butter(order, min(fc, SR * 0.45) / (SR / 2), 'low')
    return signal.lfilter(bb, aa, x)


def hp(x, fc, order=2):
    bb, aa = signal.butter(order, fc / (SR / 2), 'high')
    return signal.lfilter(bb, aa, x)


def bp(x, lo, hi, order=2):
    bb, aa = signal.butter(order, [lo / (SR / 2), min(hi, SR * 0.45) / (SR / 2)], 'band')
    return signal.lfilter(bb, aa, x)


def fx(x, *plugins):
    if x.ndim == 1:
        x = np.stack([x, x])
    return pb.Pedalboard(list(plugins))(x.astype(np.float32), SR)


def put(buf, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= buf.shape[-1]:
        return
    if buf.ndim == 1:
        n = min(len(x), len(buf) - i); buf[i:i + n] += x[:n] * gain; return
    if x.ndim == 1:
        x = np.stack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))])
    n = min(x.shape[1], buf.shape[1] - i)
    buf[:, i:i + n] += x[:, :n] * gain


def norm(x, peak_db):
    return x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)


def onepole_lp(x, cut):
    """Low-pass with a time-varying cutoff (array)."""
    a = 1 - np.exp(-2 * np.pi * np.asarray(cut) / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s); y[i] = s
    return y


# =============================================================================
#  Instruments
# =============================================================================
def pluck(freq, vel=1.0, d=0.22):
    """Muted, palm-muted style pluck used for the ostinato."""
    t = ta(d)
    x = signal.sawtooth(2 * np.pi * freq * t) * 0.7 + signal.square(2 * np.pi * freq * 0.5 * t) * 0.15
    cut = 450 + (2600 * vel) * np.exp(-t / 0.04)
    y = onepole_lp(onepole_lp(x, cut), cut)
    return y * np.exp(-t / 0.075) * np.clip(t / 0.002, 0, 1) * vel


def low_strings(freqs, d, attack=0.35):
    t = ta(d)
    x = np.zeros(len(t))
    for f in freqs:
        for det in (-0.004, 0.0, 0.005):
            vib = 1 + 0.0025 * np.sin(2 * np.pi * 5.2 * t + rng.uniform(0, 6))
            x += signal.sawtooth(2 * np.pi * np.cumsum(f * (1 + det) * vib) / SR)
    x = lp(lp(x / (3 * len(freqs)), 1600), 2400)
    env = np.clip(t / attack, 0, 1) * np.clip((d - t) / 0.3, 0, 1)
    return x * env


def felt_piano(freq, d=2.2, vel=1.0):
    t = ta(d)
    x = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * 2 * freq * t) * np.exp(-t / 0.4) + 0.12 * np.sin(2 * np.pi * 3 * freq * t) * np.exp(-t / 0.2)
    x = lp(x, 2800)
    felt = bp(rng.standard_normal(len(t)), 300, 2000) * np.exp(-t / 0.01) * 0.05
    return (x * np.exp(-t / 0.9) * np.clip(t / 0.006, 0, 1) + felt) * vel


def sub(freq, d):
    """Bass with enough upper harmonics to stay audible on phone speakers."""
    t = ta(d)
    x = np.sin(2 * np.pi * freq * t) + 0.45 * lp(signal.sawtooth(2 * np.pi * freq * t), 700)
    x = np.tanh(x * 1.2)
    return x * np.clip(t / 0.008, 0, 1) * np.clip((d - t) / 0.03, 0, 1) * np.exp(-t / 0.5)


def kick():
    t = ta(0.35)
    f = 48 + 70 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.15)
    knock = bp(rng.standard_normal(len(t)), 150, 1200) * np.exp(-t / 0.01) * 0.35
    return body + knock


def tick():
    t = ta(0.03)
    return hp(rng.standard_normal(len(t)), 7000, 3) * np.exp(-t / 0.006)


def boom(d=2.0):
    """Soft cinematic low accent (no crash, no reverb wash)."""
    t = ta(d)
    f = 36 + 30 * np.exp(-t / 0.12)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    air = lp(rng.standard_normal(len(t)), 900) * np.exp(-t / 0.15) * 0.25
    return body + air


# =============================================================================
#  Arrangement: 12 bars of 4 beats
# =============================================================================
CH = {  # chord tones (MIDI) for strings/piano, bass root, ostinato cell
    'Dm': ([50, 57, 62, 65], 38, [50, 57, 62, 57]),
    'Bb': ([46, 53, 58, 62], 34, [46, 53, 58, 53]),
    'F': ([53, 57, 60, 65], 41, [53, 60, 65, 60]),
    'C': ([48, 55, 60, 64], 36, [48, 55, 60, 55]),
    'Gm': ([55, 58, 62, 67], 43, [55, 62, 67, 62]),
}
BARS = ['Dm', 'Dm', 'Bb', 'F', 'C',        # hook, tour (3 bars), CTA
        'Dm', 'Bb', 'F', 'C',              # booking
        'F', 'Bb', 'C']                    # success, end card (final F at beat 46)
PULSE = {1, 2, 3, 5, 6, 7, 8, 9, 10, 11}   # bars with the ostinato
DRUMS = {2, 3, 6, 7, 8, 9, 10}             # bars with a soft kick
PIANO = {0: [(0, 69), (2, 65)], 4: [(0, 67), (2, 64)], 9: [(0, 69), (2, 72)], 10: [(0, 70), (2, 69)], 11: [(0, 67)]}

strings = np.zeros(N); ost = np.zeros((2, N)); bass = np.zeros(N); pno = np.zeros((2, N)); perc = np.zeros(N)
KK, TK = kick(), tick()
kicks = []
for bar, name in enumerate(BARS):
    t0 = bar * 4 * B
    notes, root, cell = CH[name]
    last = bar == 11
    span = 2 if last else 4
    # low strings: root + fifth an octave down, a quiet sustained bed
    s = low_strings([midi(notes[0] - 12), midi(notes[1] - 12)], span * B + 0.25, attack=0.5 if bar in (0, 4) else 0.2)
    put(strings, s, t0, 0.8 if bar in (0, 4, 9) else 0.6)
    # sub bass: 8ths following the root (quiet in the hook)
    if bar in PULSE or bar == 0:
        for e in range(span * 2):
            put(bass, sub(midi(root), B / 2 * 0.92), t0 + e * B / 2, 0.6 if bar == 0 else (1.0 if e % 2 == 0 else 0.75))
    # muted pluck ostinato (16ths), filter opening during the CTA bar
    if bar in PULSE or bar == 4:
        for st in range(span * 4):
            m = cell[st % 4] + 12
            vel = (1.0 if st % 4 == 0 else 0.62) * (0.55 + 0.45 * st / 16 if bar == 4 else 1.0)
            put(ost, pluck(midi(m), vel), t0 + st * S16, 0.9, pan=(-0.25 if st % 2 else 0.25))
    # quiet kick on quarters + a ticking hat on the off-16ths
    if bar in DRUMS:
        for q in range(span):
            kicks.append(t0 + q * B); put(perc, KK, t0 + q * B, 1.0)
        for st in range(span * 4):
            if st % 2:
                put(perc, TK, t0 + st * S16, 0.12 if st % 4 == 3 else 0.07)
    # sparse felt piano
    for off, m in PIANO.get(bar, []):
        put(pno, felt_piano(midi(m), 2.0, 0.9), t0 + off * B, 0.5, pan=0.1)
# final resolution on F major at beat 46
fin = 46 * B
put(strings, low_strings([midi(41), midi(48), midi(53)], 1.2, attack=0.02), fin, 0.9)
put(bass, sub(midi(29), 1.1), fin, 1.0)
for j, m in enumerate([53, 57, 60, 65, 69]):
    put(pno, felt_piano(midi(m), 1.3, 0.8), fin + j * 0.012, 0.4, pan=-0.2 + 0.1 * j)
# low accents on the section downbeats (booking starts, end card)
for t in (4 * B, 20 * B, 40.5 * B):
    put(perc, boom(1.6), t, 0.55)
put(perc, boom(1.3), fin, 0.6)

# gentle ducking of the bed under the kick for clarity
sc = np.ones(N); tt = np.arange(N) / SR
for kt in kicks:
    i = int(kt * SR); n = min(int(0.2 * SR), N - i)
    if n > 0:
        sc[i:i + n] = np.minimum(sc[i:i + n], 1 - 0.18 * np.exp(-(tt[i:i + n] - kt) / 0.07))

room = lambda w: pb.Reverb(room_size=0.3, damping=0.7, wet_level=w, dry_level=1.0, width=0.9)
strings_st = fx(hp(strings, 90) * sc, room(0.12))
ost_st = fx(ost[0] + ost[1], pb.Compressor(threshold_db=-18, ratio=2, attack_ms=3, release_ms=50), room(0.08))
ost_st = np.stack([ost[0], ost[1]]) * 0.5 + ost_st * 0.5
bass_st = fx(bass * sc)
pno_st = fx(pno[0] + pno[1], room(0.18))
perc_st = fx(perc)
music = norm(strings_st, -9) + norm(ost_st, -8) + norm(bass_st, -13) + norm(pno_st, -10) + norm(perc_st, -12)

# =============================================================================
#  Sound effects (few and subtle)
# =============================================================================
sfxbuf = np.zeros((2, N))


def whoosh(d, lo, hi):
    t = ta(2 * d)
    k = t / (2 * d)
    x = bp(rng.standard_normal(len(t)), lo, hi) * np.sin(np.pi * k) ** 2.5
    pan = np.linspace(-0.6, 0.6, len(t))
    return np.stack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))])


def click(strong=False):
    t = ta(0.05)
    x = np.sin(2 * np.pi * 1700 * t) * np.exp(-t / 0.005) * 0.5 + bp(rng.standard_normal(len(t)), 2000, 8000) * np.exp(-t / 0.002)
    if strong:
        x += np.sin(2 * np.pi * np.cumsum(140 + 50 * np.exp(-t / 0.01)) / SR) * np.exp(-t / 0.025) * 0.6
    return x


def press():
    """UI button press: a soft 'thock' with a small click on top."""
    t = ta(0.09)
    body = np.sin(2 * np.pi * np.cumsum(210 + 90 * np.exp(-t / 0.008)) / SR) * np.exp(-t / 0.022)
    tick_ = bp(rng.standard_normal(len(t)), 2500, 9000) * np.exp(-t / 0.0018) * 0.6
    return body + tick_


def blip():
    """Short UI confirmation: two quick soft notes (A5 → D6)."""
    out = np.zeros(int(0.35 * SR))
    for i, m in enumerate([81, 86]):
        t = ta(0.25)
        x = np.sin(2 * np.pi * midi(m) * t) * np.exp(-t / 0.06) * np.clip(t / 0.003, 0, 1)
        put(out, x, i * 0.065, 0.7 if i else 0.55)
    return out


def pop():
    t = ta(0.12)
    return np.sin(2 * np.pi * np.cumsum(520 + 380 * np.exp(-t / 0.018)) / SR) * np.exp(-t / 0.035)


def key_tick(v):
    r = np.random.default_rng(700 + int(v))
    t = ta(0.03)
    return bp(r.standard_normal(len(t)), 2200 + r.uniform(-300, 300), 8000) * np.exp(-t / 0.004)


def confirm():
    """Short, soft two-note confirmation (F → C), no long tail."""
    out = np.zeros(int(0.9 * SR))
    for i, m in enumerate([77, 84]):
        t = ta(0.7)
        x = (np.sin(2 * np.pi * midi(m) * t) + 0.2 * np.sin(2 * np.pi * midi(m) * 2 * t) * np.exp(-t / 0.1)) * np.exp(-t / 0.22) * np.clip(t / 0.004, 0, 1)
        put(out, x, i * 0.11, 0.6)
    return out


LEVEL = {'whoosh': -14, 'whip': -14, 'click': -9, 'tap': -10, 'press': -9, 'confirm': -13, 'pop': -16, 'key': -21, 'success': -9, 'logo': -13}
events = json.load(open(os.environ.get('SFX', 'sfx.json')))['sfx']
for e in events:
    typ, t, g = e['type'], e['t'], e.get('gain', 1.0)
    lvl = LEVEL.get(typ, -22) + 20 * np.log10(max(g, 1e-3))
    if typ == 'whoosh':
        d = e.get('dur', 0.25); put(sfxbuf, norm(whoosh(d, 300, 2500), lvl), t - d)
    elif typ == 'whip':
        put(sfxbuf, norm(whoosh(0.12, 600, 4500), lvl), t - 0.12)
    elif typ == 'click':
        put(sfxbuf, norm(click(True), lvl), t)
    elif typ in ('tap', 'press'):
        put(sfxbuf, norm(press(), lvl), t)
    elif typ == 'confirm':
        put(sfxbuf, norm(blip(), lvl), t)
    elif typ == 'pop':
        put(sfxbuf, norm(pop(), lvl), t)
    elif typ == 'key':
        put(sfxbuf, norm(key_tick(e.get('v', 0)), lvl + rng.uniform(-2, 1)), t, pan=rng.uniform(-0.15, 0.15))
    elif typ == 'success':
        put(sfxbuf, norm(confirm(), lvl), t)
    elif typ == 'logo':
        pass  # carried by the music's low accent on the same beat
    else:
        print('unused sfx', typ)

bus = pb.Pedalboard([pb.HighpassFilter(cutoff_frequency_hz=28), pb.Compressor(threshold_db=-16, ratio=1.8, attack_ms=20, release_ms=150)])
meter = pyln.Meter(SR)
full = bus((music + sfxbuf).astype(np.float32), SR)
gain = 10 ** ((-17.0 - meter.integrated_loudness(full.T)) / 20)
# ONLY_SFX=1 renders the same effects at the same level without the music,
# e.g. to lay a track from Instagram's own music library underneath.
mix = (bus(sfxbuf.astype(np.float32), SR) if os.environ.get('ONLY_SFX') else full) * gain
mix = pb.Pedalboard([pb.Limiter(threshold_db=-2.0, release_ms=80), pb.Gain(gain_db=-1.2)])(mix.astype(np.float32), SR)
f = int(0.01 * SR); mix[:, :f] *= np.linspace(0, 1, f)
tail = int(0.4 * SR); mix[:, -tail:] *= np.linspace(1, 0, tail) ** 2
print('duration %.3f s  LUFS %.1f  peak %.2f dBFS' % (DUR, meter.integrated_loudness(mix.T), 20 * np.log10(np.abs(mix).max())))
pcm = (np.clip(mix, -1, 1).T * 32767).astype('<i2')
with wave.open(os.environ.get('OUT', 'soundtrack.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('written')
