"""Soundtrack for the Westfalia Digital reel (fast cut): a dry, punchy, upbeat
124 BPM pop/house track in C major (piano stabs, funky bass, claps, tambourine)
plus tight UI sound design. No pads, no swells, no long reverbs. Everything is
synthesized here and placed from the compositor's SFX timeline (sfx.json)."""
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
rng = np.random.default_rng(11)


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
    if buf.ndim == 1:
        n = min(len(x), len(buf) - i)
        if n > 0:
            buf[i:i + n] += x[:n] * gain
        return
    if x.ndim == 1:
        x = np.stack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))])
    n = min(x.shape[1], buf.shape[1] - i)
    if n > 0:
        buf[:, i:i + n] += x[:, :n] * gain


def norm(x, peak_db):
    return x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)


# =============================================================================
#  Instruments (all dry and short)
# =============================================================================
def piano(freq, d, vel=1.0):
    t = ta(d + 0.25)
    x = np.zeros(len(t))
    for k in range(1, 9):
        fk = freq * k * (1 + 0.0004 * k * k)
        if fk > SR * 0.45:
            break
        x += np.sin(2 * np.pi * fk * t + rng.uniform(0, 1)) * (1 / k ** 1.25) * np.exp(-t * (1.2 + 1.1 * k))
    hammer = bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t / 0.006) * 0.15
    env = np.clip(t / 0.002, 0, 1) * np.where(t < d, 1.0, np.clip(1 - (t - d) / 0.12, 0, 1))
    return (x * (0.6 + 0.4 * vel) + hammer * vel) * env


def kick():
    t = ta(0.3)
    f = 52 + 110 * np.exp(-t / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.0025) * 0.3
    return np.tanh((body + click) * 1.6)


def clap():
    t = ta(0.22)
    n = rng.standard_normal(len(t))
    e = np.zeros(len(t))
    for off, dec in ((0.0, 0.005), (0.008, 0.005), (0.016, 0.06)):
        e += (t >= off) * np.exp(-np.clip(t - off, 0, None) / dec)
    snare_tone = np.sin(2 * np.pi * 200 * t) * np.exp(-t / 0.04) * 0.35
    return bp(n, 1000, 7000) * e + snare_tone


def snare(p=1.0):
    t = ta(0.14)
    return (np.sin(2 * np.pi * 210 * p * t) * np.exp(-t / 0.03) * 0.5 + bp(rng.standard_normal(len(t)), 1800, 9000) * np.exp(-t / 0.045)) * 0.8


def hat(open_=False):
    t = ta(0.18 if open_ else 0.045)
    return hp(rng.standard_normal(len(t)), 8000, 3) * np.exp(-t / (0.06 if open_ else 0.012))


def tamb():
    t = ta(0.09)
    x = np.zeros(len(t))
    for off in (0.0, 0.012, 0.024):
        x += (t >= off) * bp(rng.standard_normal(len(t)), 5000, 11000) * np.exp(-np.clip(t - off, 0, None) / 0.018)
    return x * 0.5


def crash(d=0.9):
    t = ta(d)
    return hp(rng.standard_normal(len(t)), 5000, 2) * np.exp(-t / 0.28) * 0.6


def bass(freq, d):
    t = ta(d)
    x = signal.sawtooth(2 * np.pi * freq * t) * 0.6 + np.sin(2 * np.pi * freq * t)
    cut = 250 + 1400 * np.exp(-t / 0.04)
    a = 1 - np.exp(-2 * np.pi * cut / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s); y[i] = s
    env = np.clip(t / 0.003, 0, 1) * np.clip((d - t) / 0.015, 0, 1)
    return np.tanh(y * env * 1.5)


def pluck(freq, d=0.2):
    t = ta(d)
    x = signal.square(2 * np.pi * freq * t, 0.3) * 0.5 + np.sin(2 * np.pi * freq * t)
    x = lp(x, 4500)
    return x * np.exp(-t / 0.09) * np.clip(t / 0.002, 0, 1)


# =============================================================================
#  Arrangement (bars of 4 beats)
# =============================================================================
V = {'C': ([60, 64, 67, 72], 36), 'G': ([59, 62, 67, 71], 43), 'Am': ([60, 64, 69, 72], 45), 'F': ([60, 65, 69, 72], 41)}
# per bar: list of (beat offset, chord) changes
BARS = [[(0, 'F'), (2, 'G')], [(0, 'C')], [(0, 'G')], [(0, 'Am'), (2, 'F')],        # hook + tour
        [(0, 'F'), (2, 'G')],                                                      # CTA (lighter)
        [(0, 'C')], [(0, 'G')], [(0, 'Am')], [(0, 'F')],                           # booking
        [(0, 'F'), (2, 'G')],                                                      # success
        [(0, 'C')], [(0, 'G'), (2, 'C')]]                                          # end card
FULL = {1, 2, 3, 5, 6, 7, 8, 9, 10, 11}
LEAD = {1, 2, 3, 9, 10}


def chord_at(bar, beat):
    ch = BARS[bar][0][1]
    for off, c in BARS[bar]:
        if beat >= off:
            ch = c
    return ch


pn = np.zeros((2, N)); bs = np.zeros(N); ld = np.zeros(N); dr = np.zeros((2, N))
K, CL, HC, HO, TB = kick(), clap(), hat(), hat(True), tamb()
kicks = []
for bar in range(12):
    t0 = bar * 4 * B
    last = bar == 11
    for beat in range(4):
        bt = t0 + beat * B
        ch = chord_at(bar, beat)
        notes, root = V[ch]
        if last and beat >= 2:
            continue
        # piano: on-beat chord at 1 (and on changes), off-beat stabs
        if bar == 0:
            for j, m in enumerate(notes):
                put(pn, piano(midi(m), 0.28, 0.9), bt + j * 0.004, 0.2, pan=-0.3 + 0.2 * j)
        else:
            if beat == 0 or (beat, ch) in [(off, c) for off, c in BARS[bar]]:
                for j, m in enumerate(notes):
                    put(pn, piano(midi(m), 0.3, 1.0), bt + j * 0.004, 0.2, pan=-0.3 + 0.2 * j)
            for j, m in enumerate(notes):
                put(pn, piano(midi(m + 12 if j == len(notes) - 1 else m), 0.14, 0.8), bt + B / 2 + j * 0.003, 0.17, pan=-0.3 + 0.2 * j)
        # drums
        if bar in FULL or bar == 4:
            kicks.append(bt); put(dr, K, bt, 0.95)
        elif bar == 0 and beat == 0:
            put(dr, K, bt, 0.7)
        if beat in (1, 3):
            put(dr, CL, bt, 0.5 if bar != 0 else 0.4, pan=0.05)
        if bar in FULL:
            for s in range(4):
                acc = 1.0 if s == 2 else 0.55
                put(dr, HO if (s == 2 and beat % 2 == 1) else HC, bt + s * S16, 0.18 * acc, pan=0.25)
            put(dr, TB, bt + B / 2, 0.22, pan=-0.3)
        # bass (16th funk pattern)
        if bar in FULL:
            pat = {0: 0, 3: 0}  # per beat: 16th step -> octave
            if beat % 2 == 1:
                pat = {0: 0, 2: 12}
            for s, octv in pat.items():
                x = bass(midi(root + octv), 0.1 if s else 0.14)
                put(bs, x, bt + s * S16, 1.0)
        # lead arp
        if bar in LEAD:
            arp = [notes[1] + 12, notes[2] + 12, notes[3] + 12, notes[2] + 12]
            for s in (0, 3):
                put(ld, pluck(midi(arp[(beat * 2 + (s > 0)) % 4])), bt + s * S16, 0.6)
    # section crashes
    if bar in (1, 5, 10):
        put(dr, crash(), t0, 0.35)
# drum fills into the sections
for fb in (3, 19, 35):
    for s in range(4):
        put(dr, snare(1 + 0.08 * s), (fb + s / 4) * B, 0.25 + 0.12 * s)
# final hit
fin = 46 * B
kicks.append(fin); put(dr, K, fin, 1.0); put(dr, crash(1.2), fin, 0.45); put(dr, CL, fin, 0.4)
for j, m in enumerate([48, 60, 64, 67, 72]):
    put(pn, piano(midi(m), 0.9, 1.0), fin + j * 0.006, 0.22, pan=-0.3 + 0.15 * j)
put(bs, bass(midi(36), 0.5), fin, 1.0)

# light sidechain for groove
sc = np.ones(N); tt = np.arange(N) / SR
for kt in kicks:
    i = int(kt * SR); n = min(int(0.2 * SR), N - i)
    if n > 0:
        sc[i:i + n] = np.minimum(sc[i:i + n], 1 - 0.3 * np.exp(-(tt[i:i + n] - kt) / 0.06))

pn_st = fx(pn[0] + pn[1], pb.Compressor(threshold_db=-18, ratio=2.5, attack_ms=5, release_ms=60), pb.Reverb(room_size=0.18, damping=0.7, wet_level=0.07, dry_level=0.95, width=0.8)) * sc
bs_st = fx(bs * sc)
ld_st = fx(ld, pb.Delay(delay_seconds=S16 * 3, feedback=0.15, mix=0.12))
dr_st = fx(dr[0] + dr[1], pb.Compressor(threshold_db=-12, ratio=3, attack_ms=6, release_ms=70))
music = norm(pn_st, -8) + norm(bs_st, -8.5) + norm(ld_st, -15) + norm(dr_st, -4.5)

# =============================================================================
#  Sound design (tight, dry)
# =============================================================================
sfxbuf = np.zeros((2, N))


def whoosh(d, lo, hi):
    t = ta(2 * d)
    k = t / (2 * d)
    env = np.sin(np.pi * k) ** 2.5
    x = bp(rng.standard_normal(len(t)), lo, hi) * env
    pan = np.linspace(-0.7, 0.7, len(t))
    return np.stack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))])


def hit():
    t = ta(0.25)
    low = np.sin(2 * np.pi * np.cumsum(70 + 90 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.08)
    snap = bp(rng.standard_normal(len(t)), 1500, 8000) * np.exp(-t / 0.012)
    return np.tanh((low + snap * 0.7) * 1.4)


def click(soft=True):
    t = ta(0.05)
    x = np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.005) * 0.5 + bp(rng.standard_normal(len(t)), 2000, 9000) * np.exp(-t / 0.002)
    if not soft:
        x += np.sin(2 * np.pi * np.cumsum(150 + 60 * np.exp(-t / 0.01)) / SR) * np.exp(-t / 0.025) * 0.7
    return x


def key_tick(v):
    r = np.random.default_rng(500 + int(v))
    t = ta(0.03)
    return bp(r.standard_normal(len(t)), 2500 + r.uniform(-400, 400), 9500) * np.exp(-t / (0.0035 + r.uniform(0, 0.002)))


def bubble():
    t = ta(0.12)
    f = np.where(t < 0.05, 880, 1320)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-np.where(t < 0.05, t, t - 0.05) / 0.025)


def pop():
    t = ta(0.1)
    return np.sin(2 * np.pi * np.cumsum(600 + 400 * np.exp(-t / 0.015)) / SR) * np.exp(-t / 0.03)


def chime():
    out = np.zeros(int(1.2 * SR))
    for i, m in enumerate([84, 91]):          # C → G, bright and short
        t = ta(1.0)
        x = (np.sin(2 * np.pi * midi(m) * t) + 0.3 * np.sin(2 * np.pi * midi(m) * 2.76 * t) * np.exp(-t / 0.08)) * np.exp(-t / 0.3)
        put(out, x, i * 0.1, 0.6)
    return fx(out, pb.Reverb(room_size=0.3, wet_level=0.12, dry_level=0.95))


LEVEL = {'whoosh': -15, 'whip': -13, 'whoosh_down': -16, 'hit': -12, 'pop': -20, 'click': -13, 'tap': -17,
         'bubble': -22, 'key': -24, 'swish': -21, 'success': -10, 'logo': -11}
events = json.load(open(os.environ.get('SFX', 'sfx.json')))['sfx']
for e in events:
    typ, t, g = e['type'], e['t'], e.get('gain', 1.0)
    lvl = LEVEL.get(typ, -20) + 20 * np.log10(max(g, 1e-3))
    if typ in ('whoosh', 'whoosh_down'):
        d = e.get('dur', 0.2)
        put(sfxbuf, norm(whoosh(d, 400, 3500 if typ == 'whoosh' else 1800), lvl), t - d)
    elif typ == 'whip':
        put(sfxbuf, norm(whoosh(0.12, 700, 6000), lvl), t - 0.12)
    elif typ == 'swish':
        put(sfxbuf, norm(whoosh(0.08, 2500, 9000), lvl), t - 0.08)
    elif typ == 'hit':
        put(sfxbuf, norm(hit(), lvl), t)
    elif typ == 'pop':
        put(sfxbuf, norm(pop(), lvl), t)
    elif typ == 'click':
        put(sfxbuf, norm(click(False), lvl), t)
    elif typ == 'tap':
        put(sfxbuf, norm(click(True), lvl), t)
    elif typ == 'bubble':
        put(sfxbuf, norm(bubble(), lvl), t, pan=-0.1)
    elif typ == 'key':
        put(sfxbuf, norm(key_tick(e.get('v', 0)), lvl + rng.uniform(-2, 1)), t, pan=rng.uniform(-0.15, 0.15))
    elif typ == 'success':
        put(sfxbuf, norm(chime(), lvl), t)
    elif typ == 'logo':
        put(sfxbuf, norm(hit(), lvl), t)
    else:
        print('unknown', typ)

mix = music + sfxbuf
mix = pb.Pedalboard([pb.HighpassFilter(cutoff_frequency_hz=32), pb.Compressor(threshold_db=-14, ratio=2, attack_ms=10, release_ms=100)])(mix.astype(np.float32), SR)
meter = pyln.Meter(SR)
mix = mix * 10 ** ((-16.5 - meter.integrated_loudness(mix.T)) / 20)
mix = pb.Pedalboard([pb.Limiter(threshold_db=-2.0, release_ms=60), pb.Gain(gain_db=-1.2)])(mix.astype(np.float32), SR)
f = int(0.005 * SR); mix[:, :f] *= np.linspace(0, 1, f)
tail = int(0.3 * SR); mix[:, -tail:] *= np.linspace(1, 0, tail) ** 2
print('duration %.3f s  LUFS %.1f  peak %.2f dBFS' % (DUR, meter.integrated_loudness(mix.T), 20 * np.log10(np.abs(mix).max())))
pcm = (np.clip(mix, -1, 1).T * 32767).astype('<i2')
with wave.open(os.environ.get('OUT', 'soundtrack.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('written')
