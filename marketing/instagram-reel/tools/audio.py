"""Soundtrack for the Westfalia Digital reel: a 120 BPM track plus sound design,
all synthesized from scratch and placed from the compositor's SFX timeline."""
import json
import numpy as np
from scipy import signal
import pedalboard as pb
import pyloudnorm as pyln

SR = 48000
DUR = 32.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(42)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env_exp(d, decay, attack=0.002):
    t = t_axis(d)
    a = np.clip(t / attack, 0, 1) if attack > 0 else 1
    return a * np.exp(-t / decay)


def lp(x, fc, order=2):
    b, a = signal.butter(order, min(fc, SR / 2 * 0.95) / (SR / 2), 'low')
    return signal.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi, SR / 2 * 0.95) / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def sweep_filter(x, f0, f1, q=2.0, kind='band', curve=None):
    """Time-varying state-variable filter (Chamberlin), cutoff f0 -> f1."""
    n = len(x)
    k = np.linspace(0, 1, n) if curve is None else curve
    fc = f0 * (f1 / f0) ** k
    f = 2 * np.sin(np.pi * np.clip(fc, 20, SR / 6) / SR)
    damp = 1.0 / q
    low = band = 0.0
    out = np.empty(n)
    for i in range(n):
        high = x[i] - low - damp * band
        band = band + f[i] * high
        low = low + f[i] * band
        out[i] = band if kind == 'band' else (low if kind == 'low' else high)
    return out


def saw(freq, d, phase=0.0):
    t = t_axis(d)
    return signal.sawtooth(2 * np.pi * freq * t + phase)


def place(buf, x, t, gain=1.0, pan=0.0, peak_db=None):
    """Mix mono or stereo x into stereo buf at time t (optionally normalized to peak_db)."""
    if peak_db is not None:
        x = x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)
    i = int(round(t * SR))
    if x.ndim == 1:
        l = np.sqrt(0.5 * (1 - pan)); r = np.sqrt(0.5 * (1 + pan))
        x = np.stack([x * l, x * r])
    if i < 0:
        x = x[:, -i:]; i = 0
    n = min(x.shape[1], buf.shape[1] - i)
    if n > 0:
        buf[:, i:i + n] += x[:, :n] * gain


def fx(x, *plugins):
    board = pb.Pedalboard(list(plugins))
    if x.ndim == 1:
        x = np.stack([x, x])
    return board(x.astype(np.float32), SR)


# =============================================================================
#  Instruments
# =============================================================================
def kick():
    d = 0.45
    t = t_axis(d)
    f = 45 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.28)
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.004) * 0.35
    return np.tanh((body + click) * 1.8) * 0.9


def clap():
    d = 0.35
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    e = np.zeros(len(t))
    for off in (0.0, 0.011, 0.022):
        tt = np.clip(t - off, 0, None)
        e += (t >= off) * np.exp(-tt / (0.012 if off < 0.02 else 0.13))
    return bp(n, 900, 2600) * e * 0.8


def hat(open_=False):
    d = 0.3 if open_ else 0.07
    t = t_axis(d)
    n = hp(rng.standard_normal(len(t)), 7500, 3)
    return n * np.exp(-t / (0.09 if open_ else 0.018)) * 0.5


def shaker():
    d = 0.06
    t = t_axis(d)
    n = bp(rng.standard_normal(len(t)), 5000, 11000)
    return n * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * 0.25


def snare(pitch=1.0):
    d = 0.18
    t = t_axis(d)
    tone = np.sin(2 * np.pi * 190 * pitch * t) * np.exp(-t / 0.05)
    n = bp(rng.standard_normal(len(t)), 1500, 8000) * np.exp(-t / 0.07)
    return (tone * 0.5 + n) * 0.6


def bass_note(freq, d):
    t = t_axis(d)
    x = 0.6 * saw(freq, d) + 0.8 * np.sin(2 * np.pi * freq * t)
    cut = 180 + 900 * np.exp(-t / 0.06)
    y = np.empty_like(x); state = 0.0
    a = 1 - np.exp(-2 * np.pi * cut / SR)
    for i in range(len(x)):
        state += a[i] * (x[i] - state); y[i] = state
    e = np.clip(t / 0.004, 0, 1) * np.clip((d - t) / 0.02, 0, 1)
    return np.tanh(y * e * 1.6) * 0.7


def supersaw(freqs, d, voices=5, detune=0.012):
    x = np.zeros(int(d * SR))
    for f in freqs:
        for v in range(voices):
            dt = 1 + detune * (v - (voices - 1) / 2) / ((voices - 1) / 2)
            x += saw(f * dt, d, phase=rng.uniform(0, 2 * np.pi))
    return x / (len(freqs) * voices)


def pluck(freq, d=0.35, bright=1.0):
    t = t_axis(d)
    x = 0.55 * np.sin(2 * np.pi * freq * t) + 0.3 * signal.square(2 * np.pi * freq * t, 0.3) * np.exp(-t / 0.04 * bright)
    return lp(x, 5000) * np.exp(-t / 0.12) * np.clip(t / 0.002, 0, 1)


def bell(freq, d=1.6):
    t = t_axis(d)
    mod = np.sin(2 * np.pi * freq * 3.5 * t) * 2.2 * np.exp(-t / 0.25)
    return np.sin(2 * np.pi * freq * t + mod) * np.exp(-t / 0.55) * np.clip(t / 0.002, 0, 1)


# =============================================================================
#  Arrangement
# =============================================================================
CHORDS = {
    'Am': ([57, 60, 64], 45), 'F': ([53, 57, 60], 41), 'C': ([55, 60, 64], 48), 'G': ([55, 59, 62], 43),
}
BARS = ['Am', 'Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'C']
GROOVE = set(range(1, 7)) | set(range(8, 15))
LEAD = {3, 4, 5, 6, 10, 11, 12, 13, 14}

music = np.zeros((2, N))
drums = np.zeros((2, N))
K, CL, HC, HO, SH = kick(), clap(), hat(), hat(True), shaker()

kick_times = []
for b in range(16):
    t0 = b * 2.0
    if b in GROOVE:
        for k in range(4):
            kick_times.append(t0 + k * BEAT)
            place(drums, K, t0 + k * BEAT, 1.0)
        for k in (1, 3):
            place(drums, CL, t0 + k * BEAT, 0.55, pan=0.05)
        for k in range(4):
            place(drums, HC if (b + k) % 4 else HO, t0 + k * BEAT + 0.25, 0.35 if (b + k) % 4 else 0.22, pan=0.25)
        for k in range(16):
            if k % 2:
                place(drums, SH, t0 + k * 0.125, 0.18 + 0.06 * (k % 4 == 3), pan=-0.3)
# snare roll into the drop
for i, tt in enumerate(np.concatenate([np.arange(15.0, 15.5, 0.125), np.arange(15.5, 16.0, 0.0625)])):
    k = (tt - 15.0) / 1.0
    place(drums, snare(1 + 0.6 * k), tt, 0.15 + 0.5 * k ** 1.5)
kick_times.append(30.0)

# sidechain envelope
sc = np.ones(N)
tt = np.arange(N) / SR
for kt in kick_times:
    i = int(kt * SR); n = int(0.4 * SR)
    seg = tt[i:i + n] - kt
    sc[i:i + n] = np.minimum(sc[i:i + n], 1 - 0.65 * np.exp(-seg / 0.11))

pads = np.zeros(N); stabs = np.zeros(N); bass = np.zeros(N); lead = np.zeros(N)
for b, name in enumerate(BARS):
    t0 = b * 2.0
    notes, root = CHORDS[name]
    i0 = int(t0 * SR)
    # pad (sustained supersaw, softer in the booking part)
    d = 2.0 if b < 15 else 2.0
    p = supersaw([midi(m) for m in notes] + [midi(notes[0] + 12)], d, voices=5, detune=0.01)
    att = np.clip(t_axis(d) / (0.9 if b in (0, 7) else 0.05), 0, 1)
    pads[i0:i0 + len(p)] += p * att * (0.9 if b in (0, 7, 15) else 0.45)
    if b in GROOVE:
        # off-beat stabs + bass
        for k in range(4):
            st = supersaw([midi(m + 12) for m in notes], 0.22, voices=5, detune=0.015) * env_exp(0.22, 0.07)
            j = int((t0 + k * BEAT + 0.25) * SR)
            stabs[j:j + len(st)] += st * (0.8 if b < 8 or b >= 14 else 0.55)
        for k in range(8):
            if k % 2 == 1 or k == 0:
                bn = bass_note(midi(root), 0.22 if k else 0.2)
                j = int((t0 + k * 0.25) * SR)
                bass[j:j + len(bn)] += bn
    if b in LEAD:
        arp = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[0] + 24]
        pat = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 3, 1, 2]
        for k in range(16):
            pl = pluck(midi(arp[pat[k]]), 0.3)
            j = int((t0 + k * 0.125) * SR)
            lead[j:j + len(pl)] += pl * (0.5 if 8 <= b <= 13 else 0.7) * (1.0 if k % 4 == 0 else 0.75)
    if b == 15:
        # final ringing chord (C major) with bells
        for m in [48, 55, 60, 64, 67, 72]:
            pads[i0:i0 + int(2 * SR)] += np.sin(2 * np.pi * midi(m) * t_axis(2.0)) * np.exp(-t_axis(2.0) / 1.2) * 0.12

# breakdown: low-pass the pads
bd0, bd1 = int(14 * SR), int(16 * SR)
pad_bd = sweep_filter(pads[bd0:bd1] + 0.0, 300, 6000, q=1.2, kind='low', curve=np.linspace(0, 1, bd1 - bd0) ** 2)
pads[bd0:bd1] = pad_bd * 1.3
pads[:int(2 * SR)] = lp(pads[:int(2 * SR)], 900)

pads_st = fx(lp(pads, 7000) * sc, pb.Chorus(rate_hz=0.3, depth=0.3, mix=0.4), pb.Reverb(room_size=0.7, wet_level=0.25, dry_level=0.8, width=1.0))
stabs_st = fx(lp(stabs, 6000) * sc, pb.Reverb(room_size=0.5, wet_level=0.2, dry_level=0.85, width=1.0))
bass_st = fx(bass * sc, pb.LowpassFilter(cutoff_frequency_hz=2500))
lead_st = fx(lead, pb.Delay(delay_seconds=0.375, feedback=0.3, mix=0.25), pb.Reverb(room_size=0.5, wet_level=0.2, dry_level=0.8, width=1.0))
drums_st = fx(drums, pb.Compressor(threshold_db=-12, ratio=3, attack_ms=5, release_ms=80))

music = pads_st * 0.32 + stabs_st * 0.32 + bass_st * 0.55 + lead_st * 0.2 + drums_st * 0.8
# music outro fade
fade = np.ones(N); fs = int(30.6 * SR); fade[fs:] = np.linspace(1, 0, N - fs) ** 1.5
music *= fade

# =============================================================================
#  Sound design
# =============================================================================
sfxbuf = np.zeros((2, N))
events = json.load(open('sfx.json'))['sfx']


def whoosh(d, peak_at=None, lo=300, hi=4000, tail=0.22, bright=1.0):
    peak_at = d if peak_at is None else peak_at
    total = peak_at + tail
    t = t_axis(total)
    n = rng.standard_normal(len(t))
    rise = np.clip(t / peak_at, 0, 1) ** 2.5
    fall = np.exp(-np.clip(t - peak_at, 0, None) / (tail / 3))
    e = rise * fall
    curve = np.clip(t / peak_at, 0, 1) ** 1.5
    y = sweep_filter(n, lo, hi * bright, q=1.6, curve=curve * (t <= peak_at) + (t > peak_at) * np.exp(-(t - peak_at) / tail))
    y = y * e
    pan = np.linspace(-0.8, 0.8, len(t))
    return np.stack([y * np.sqrt(0.5 * (1 - pan)), y * np.sqrt(0.5 * (1 + pan))]) * 1.4


def impact(big=False):
    d = 1.6 if big else 0.9
    t = t_axis(d)
    f = 38 + 70 * np.exp(-t / 0.08)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.5 if big else 0.3))
    crack = lp(rng.standard_normal(len(t)), 5000) * np.exp(-t / 0.03) * 0.8
    tom = np.sin(2 * np.pi * np.cumsum(90 + 60 * np.exp(-t / 0.05)) / SR) * np.exp(-t / 0.15) * 0.5
    x = np.tanh((boom * 1.2 + crack + tom) * 1.5)
    return fx(x, pb.Reverb(room_size=0.85 if big else 0.6, wet_level=0.3 if big else 0.18, dry_level=0.9, width=1.0))


def crash(d=2.2):
    t = t_axis(d)
    n = hp(rng.standard_normal(len(t)), 4000, 2)
    return fx(n * np.exp(-t / 0.7) * 0.35, pb.Reverb(room_size=0.8, wet_level=0.3, dry_level=0.8, width=1.0))


def riser(d):
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    y = sweep_filter(n, 300, 9000, q=3, curve=(t / d) ** 1.4) * (t / d) ** 2
    f = 200 * (8 ** (t / d))
    tone = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * (t / d) ** 3 * 0.25
    return fx(y + lp(tone, 6000), pb.Reverb(room_size=0.6, wet_level=0.2, dry_level=0.9, width=1.0))


def glitch():
    d = 0.24
    t = t_axis(d)
    x = np.zeros(len(t))
    seg = int(0.02 * SR)
    for i in range(0, len(t), seg):
        f = rng.choice([220, 330, 880, 1760, 110])
        tt = t[i:i + seg]
        kind = rng.integers(3)
        s = signal.square(2 * np.pi * f * tt) if kind == 0 else (rng.standard_normal(len(tt)) if kind == 1 else np.sin(2 * np.pi * f * 2 * tt))
        x[i:i + seg] = s * (rng.uniform(0.3, 1.0) if rng.random() > 0.2 else 0)
    x = np.round(x * 6) / 6
    return lp(x, 7000) * 0.5


def pop(big=False):
    d = 0.18 if big else 0.1
    t = t_axis(d)
    f = (900 if not big else 520) * np.exp(-t / 0.04) + (380 if not big else 180)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.05 if not big else 0.09))
    x += hp(rng.standard_normal(len(t)), 2000) * np.exp(-t / 0.003) * 0.3
    return x * 0.8


def tick():
    d = 0.05
    t = t_axis(d)
    return (np.sin(2 * np.pi * 2400 * t) * 0.6 + np.sin(2 * np.pi * 3600 * t) * 0.3) * np.exp(-t / 0.008)


def tap():
    d = 0.08
    t = t_axis(d)
    x = np.sin(2 * np.pi * 1150 * t) * np.exp(-t / 0.012) * 0.6 + bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t / 0.004) * 0.6
    x += np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.02) * 0.4
    return x


def key(v):
    d = 0.05
    t = t_axis(d)
    r = np.random.default_rng(100 + int(v))
    n = bp(r.standard_normal(len(t)), 1800 + r.uniform(-300, 600), 6500)
    x = n * np.exp(-t / (0.006 + r.uniform(0, 0.004)))
    x += np.sin(2 * np.pi * (320 + r.uniform(-40, 40)) * t) * np.exp(-t / 0.01) * 0.25
    return x * 0.7


def bubble():
    d = 0.12
    t = t_axis(d)
    f = 520 + 900 * (t / d) ** 0.6
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * 0.6


def swish():
    d = 0.16
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    y = sweep_filter(n, 2500, 9000, q=1.5, curve=t / d) * np.sin(np.pi * t / d) ** 2
    return y * 0.7


def stamp():
    d = 0.8
    t = t_axis(d)
    thud = np.sin(2 * np.pi * np.cumsum(70 + 80 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.12)
    slap = lp(rng.standard_normal(len(t)), 3500) * np.exp(-t / 0.025)
    return fx(np.tanh((thud + slap) * 1.6), pb.Reverb(room_size=0.4, wet_level=0.15, dry_level=0.9))


def success():
    out = np.zeros((2, int(2.2 * SR)))
    for i, m in enumerate([72, 76, 79, 84]):
        b = bell(midi(m), 1.6) * (0.5 if i < 3 else 0.6)
        place(out, b, i * 0.07, 1.0, pan=-0.3 + 0.2 * i)
    sh = hp(rng.standard_normal(out.shape[1]), 8000) * np.exp(-t_axis(2.2) / 0.5) * 0.05
    out += sh
    return fx(out[0] + out[1], pb.Reverb(room_size=0.8, wet_level=0.35, dry_level=0.8, width=1.0)) * 0.9


def confetti():
    d = 1.0
    x = np.zeros(int(d * SR))
    pop_ = hp(rng.standard_normal(int(0.03 * SR)), 800) * np.exp(-t_axis(0.03) / 0.006)
    x[:len(pop_)] += pop_ * 1.0
    for _ in range(40):
        s = rng.uniform(0.03, d * 0.9)
        c = hp(rng.standard_normal(int(0.006 * SR)), 3000) * rng.uniform(0.05, 0.25) * np.exp(-s / 0.4)
        i = int(s * SR); x[i:i + len(c)] += c
    return fx(x, pb.Reverb(room_size=0.5, wet_level=0.2, dry_level=0.9, width=1.0))


def click_big():
    x = tap() * 1.3
    t = t_axis(0.3)
    th = np.sin(2 * np.pi * np.cumsum(60 + 90 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.12)
    y = np.zeros(len(t)); y[:len(x)] += x; y += th * 0.9
    return y


def drop():
    t = t_axis(1.2)
    sub = np.sin(2 * np.pi * np.cumsum(100 * np.exp(-t / 0.35) + 30) / SR) * np.exp(-t / 0.6)
    im = impact(True)
    out = im.copy(); out[:, :len(sub)] += sub * 0.8
    cr = crash(2.0)
    n = min(out.shape[1], cr.shape[1]); out[:, :n] += cr[:, :n] * 0.8
    return out


LEVEL = {  # peak dBFS of each sound on the sfx bus (before master)
    'impact': -4, 'impact_big': -2.5, 'final_hit': -2, 'drop': -2, 'crash': -9, 'glitch': -11,
    'riser_short': -10, 'riser': -8, 'whoosh': -6, 'whoosh_in': -6, 'whoosh_soft': -11, 'swoosh_up': -7,
    'pop': -11, 'pop_big': -8, 'tick': -17, 'tap': -10, 'click_big': -6, 'key': -13, 'bubble': -11,
    'swish': -15, 'stamp': -3.5, 'success': -5, 'confetti': -11,
}
db = lambda k, g: LEVEL[k] + 20 * np.log10(max(g, 1e-3))

for e in events:
    typ, t, g = e['type'], e['t'], e.get('gain', 1.0)
    if typ in ('whoosh', 'whoosh_in', 'whoosh_soft', 'swoosh_up'):
        d = e.get('dur', 0.25)
        if typ == 'whoosh':
            w = whoosh(d, lo=250, hi=3500)
        elif typ == 'whoosh_in':
            w = whoosh(d, lo=600, hi=9000, tail=0.08)
        elif typ == 'whoosh_soft':
            w = whoosh(d, lo=200, hi=1800, tail=0.2)
        else:
            w = whoosh(d, lo=400, hi=7000, tail=0.15)
        place(sfxbuf, w, t, peak_db=db(typ, g))
    elif typ == 'impact':
        place(sfxbuf, impact(), t, peak_db=db(typ, g))
    elif typ == 'impact_big':
        place(sfxbuf, impact(True), t, peak_db=db(typ, g))
        place(sfxbuf, crash(), t, peak_db=db('crash', g))
    elif typ == 'final_hit':
        place(sfxbuf, impact(True), t, peak_db=db(typ, g))
        place(sfxbuf, crash(3.0), t, peak_db=db('crash', g) + 2)
    elif typ == 'drop':
        place(sfxbuf, drop(), t, peak_db=db(typ, g))
    elif typ == 'glitch':
        place(sfxbuf, glitch(), t - 0.05, peak_db=db(typ, g))
    elif typ in ('riser_short', 'riser'):
        d = e.get('dur', 0.5)
        start = e.get('from', t)
        place(sfxbuf, riser(t + d - start), start, peak_db=db(typ, g))
    elif typ == 'pop':
        place(sfxbuf, pop(), t, pan=rng.uniform(-0.3, 0.3), peak_db=db(typ, g))
    elif typ == 'pop_big':
        place(sfxbuf, fx(pop(True), pb.Reverb(room_size=0.5, wet_level=0.2, dry_level=0.9)), t, peak_db=db(typ, g))
    elif typ == 'tick':
        place(sfxbuf, tick(), t, pan=rng.uniform(-0.5, 0.5), peak_db=db(typ, g))
    elif typ == 'tap':
        place(sfxbuf, tap(), t, peak_db=db(typ, g))
    elif typ == 'click_big':
        place(sfxbuf, click_big(), t, peak_db=db(typ, g))
    elif typ == 'key':
        place(sfxbuf, key(e.get('v', 0)), t, pan=rng.uniform(-0.2, 0.2), peak_db=db(typ, g) + rng.uniform(-2, 1))
    elif typ == 'bubble':
        place(sfxbuf, bubble(), t, pan=-0.1, peak_db=db(typ, g))
    elif typ == 'swish':
        place(sfxbuf, swish(), t, pan=0.3, peak_db=db(typ, g))
    elif typ == 'stamp':
        place(sfxbuf, stamp(), t, peak_db=db(typ, g))
    elif typ == 'success':
        place(sfxbuf, success(), t, peak_db=db(typ, g))
    elif typ == 'confetti':
        place(sfxbuf, confetti(), t, peak_db=db(typ, g))
    else:
        print('unknown sfx', typ)

music = music / (np.abs(music).max() + 1e-9) * 10 ** (-4 / 20)

# duck music a touch under the big transitions / UI to keep sfx clear
duck = np.ones(N)
for e in events:
    if e['type'] in ('impact_big', 'drop', 'final_hit', 'stamp', 'success'):
        i = int(e['t'] * SR); n = int(0.5 * SR)
        duck[i:i + n] = np.minimum(duck[i:i + n], 1 - 0.35 * np.exp(-np.arange(min(n, N - i)) / SR / 0.2))
mix = music * duck + sfxbuf

master = pb.Pedalboard([
    pb.HighpassFilter(cutoff_frequency_hz=28),
    pb.Compressor(threshold_db=-14, ratio=2.5, attack_ms=10, release_ms=120),
    pb.Gain(gain_db=0),
])
mix = master(mix.astype(np.float32), SR)
meter = pyln.Meter(SR)
lufs = meter.integrated_loudness(mix.T)
mix = mix * (10 ** ((-13.0 - lufs) / 20))
# JUCE's limiter adds make-up gain equal to -threshold, so take it back off and leave ~1 dB headroom
mix = pb.Pedalboard([pb.Limiter(threshold_db=-2.5, release_ms=60), pb.Gain(gain_db=-3.5)])(mix.astype(np.float32), SR)
# short fades at the edges
f = int(0.004 * SR); mix[:, :f] *= np.linspace(0, 1, f); mix[:, -int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))
print('LUFS before norm %.1f, after %.1f, peak %.2f dBFS' % (lufs, meter.integrated_loudness(mix.T), 20 * np.log10(np.abs(mix).max())))
import wave
pcm = (np.clip(mix, -1, 1).T * 32767).astype('<i2')
with wave.open('soundtrack.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote soundtrack.wav', mix.shape)

