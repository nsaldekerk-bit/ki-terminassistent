"""Soundtrack for the Westfalia Digital reel (second cut): a warm 120 BPM deep-house
groove with electric-piano chords and restrained UI sound design. Everything is
synthesized here and placed from the compositor's SFX timeline (sfx.json)."""
import json
import os
import wave

import numpy as np
import pedalboard as pb
import pyloudnorm as pyln
from scipy import signal

SR = 48000
DUR = 32.0
N = int(SR * DUR)
BEAT = 0.5
STEP = BEAT / 4          # 16th note
rng = np.random.default_rng(7)


def ta(d):
    return np.arange(int(round(d * SR))) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    b, a = signal.butter(order, min(fc, SR * 0.45) / (SR / 2), 'low')
    return signal.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi, SR * 0.45) / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def fx(x, *plugins):
    if x.ndim == 1:
        x = np.stack([x, x])
    return pb.Pedalboard(list(plugins))(x.astype(np.float32), SR)


def put(buf, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if x.ndim == 1:
        x = np.stack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))])
    if i < 0:
        x = x[:, -i:]; i = 0
    n = min(x.shape[1], buf.shape[1] - i)
    if n > 0:
        buf[:, i:i + n] += x[:, :n] * gain


def norm(x, peak_db):
    return x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)


# =============================================================================
#  Instruments
# =============================================================================
def e_piano(freq, d, vel=1.0):
    """FM electric piano: soft bell-like tine over a warm body."""
    t = ta(d + 0.6)
    idx = (1.4 * vel) * np.exp(-t / 0.35) + 0.25
    body = np.sin(2 * np.pi * freq * t + idx * np.sin(2 * np.pi * freq * t))
    tine = np.sin(2 * np.pi * freq * 4.0 * t + 0.8 * np.sin(2 * np.pi * freq * 14 * t) * np.exp(-t / 0.02)) * np.exp(-t / 0.08) * 0.25 * vel
    env = np.clip(t / 0.004, 0, 1) * np.exp(-t / 1.6)
    rel = np.where(t < d, 1.0, np.clip(1 - (t - d) / 0.35, 0, 1))
    return (body * 0.8 + tine) * env * rel


def pad(freqs, d):
    t = ta(d)
    x = np.zeros(len(t))
    for f in freqs:
        for det in (-0.006, 0.006):
            x += signal.sawtooth(2 * np.pi * f * (1 + det) * t + rng.uniform(0, 6.28))
    x = lp(x / (2 * len(freqs)), 1400, 2)
    env = np.clip(t / 0.5, 0, 1) * np.clip((d - t) / 0.4, 0, 1)
    return x * env


def kick():
    t = ta(0.4)
    f = 47 + 75 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.003) * 0.12
    return np.tanh((body + click) * 1.2)


def clap():
    t = ta(0.4)
    n = rng.standard_normal(len(t))
    e = np.zeros(len(t))
    for off, dec in ((0.0, 0.006), (0.009, 0.006), (0.018, 0.09)):
        e += (t >= off) * np.exp(-np.clip(t - off, 0, None) / dec)
    return bp(n, 1100, 5200) * e


def hat(open_=False):
    t = ta(0.25 if open_ else 0.06)
    return hp(rng.standard_normal(len(t)), 8000, 3) * np.exp(-t / (0.08 if open_ else 0.016))


def shaker():
    t = ta(0.05)
    return bp(rng.standard_normal(len(t)), 6000, 13000) * np.sin(np.pi * t / 0.05) ** 3


def bass(freq, d):
    t = ta(d)
    x = np.sin(2 * np.pi * freq * t) + 0.35 * signal.sawtooth(2 * np.pi * freq * t, 0.5)
    x = lp(x, 320, 2)
    env = np.clip(t / 0.006, 0, 1) * np.clip((d - t) / 0.03, 0, 1)
    return np.tanh(x * env * 1.3)


def marimba(freq, d=0.6):
    t = ta(d)
    x = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t / 0.05) + 0.1 * np.sin(2 * np.pi * freq * 9.9 * t) * np.exp(-t / 0.015)
    return x * np.exp(-t / 0.22) * np.clip(t / 0.002, 0, 1)


def swell(d, fc0=300, fc1=7000):
    """Reverse-cymbal style swell that ends exactly after d seconds."""
    t = ta(d)
    k = t / d
    n = rng.standard_normal(len(t))
    lo = lp(n, fc0 + (fc1 - fc0) * 0.2)
    hi = hp(n, 3000)
    x = lo * (1 - k) + hi * k
    return x * k ** 3


# =============================================================================
#  Arrangement
# =============================================================================
V = {  # voicings (MIDI) and bass root
    'Am9': ([60, 64, 67, 71], 33), 'Fmaj9': ([57, 60, 64, 67], 29), 'C69': ([55, 62, 64, 69], 36),
    'G6': ([59, 62, 64, 67], 31), 'Cmaj9': ([59, 62, 64, 67, 72], 36),
}
BARS = ['Am9', 'Am9', 'Fmaj9', 'C69', 'G6', 'Am9', 'Fmaj9', 'G6', 'Am9', 'Fmaj9', 'C69', 'G6', 'Am9', 'Fmaj9', 'G6', 'Cmaj9']
GROOVE = set(range(1, 7)) | set(range(8, 15))
LEAD = {3, 4, 5, 6, 10, 11, 12, 13, 14}

ep = np.zeros((2, N)); pads = np.zeros(N); bs = np.zeros(N); lead = np.zeros(N); dr = np.zeros((2, N))
K, CL, HC, HO, SH = kick(), clap(), hat(), hat(True), shaker()
kicks = []
swing = 0.018
for b, name in enumerate(BARS):
    t0 = b * 2.0
    notes, root = V[name]
    # pad bed
    p = pad([midi(m) for m in notes], 2.05)
    i0 = int(t0 * SR); p = p[:N - i0]; pads[i0:i0 + len(p)] += p * (1.0 if b in (0, 7, 15) else 0.6)
    # electric piano rhythm (beats): sustained in intro/breakdown/outro, syncopated in the groove
    hits = [(0, 3.6, 0.9)] if b in (0, 7, 15) else [(0, 1.2, 0.9), (1.5, 1.0, 0.7), (3.0, 0.8, 0.75)]
    for (bt_, ln, vel) in hits:
        for j, m in enumerate(notes):
            x = e_piano(midi(m), ln * BEAT, vel)
            put(ep, x, t0 + bt_ * BEAT + j * 0.006, 0.22, pan=(-0.35 + 0.7 * j / max(1, len(notes) - 1)))
    if b in GROOVE:
        for k in range(4):
            kicks.append(t0 + k * BEAT); put(dr, K, t0 + k * BEAT, 0.9)
        for k in (1, 3):
            put(dr, CL, t0 + k * BEAT, 0.28, pan=0.05)
        for k in range(4):
            put(dr, HO if k % 2 else HC, t0 + k * BEAT + 0.25, 0.12 if k % 2 else 0.2, pan=0.2)
        for s in range(16):
            sw = swing if s % 2 else 0
            put(dr, SH, t0 + s * STEP + sw, 0.09 if s % 4 else 0.05, pan=-0.25)
        # bass: off-beat eighths + a downbeat anchor every other bar
        for s in (2, 6, 10, 14):
            x = bass(midi(root), 0.2); j = int((t0 + s * STEP) * SR); bs[j:j + len(x)] += x
        if b % 2 == 0:
            x = bass(midi(root), 0.16); j = int(t0 * SR); bs[j:j + len(x)] += x * 0.8
    if b in LEAD:
        arp = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[-1] + 12]
        pat = [0, 2, 1, 3, 2, 1, 3, 2]
        for s in range(8):
            x = marimba(midi(arp[pat[s]]))
            j = int((t0 + s * BEAT / 2 + (swing if s % 2 else 0)) * SR)
            lead[j:j + len(x)] += x * (0.5 if 8 <= b <= 13 else 0.65)
kicks.append(30.0)
put(dr, K, 30.0, 0.8)

# breakdown and intro: filtered, airy
for a, b_ in ((0.0, 2.0), (14.0, 16.0)):
    i, j = int(a * SR), int(b_ * SR)
    pads[i:j] = lp(pads[i:j], 900)
put(dr, norm(swell(1.0), -12), 1.0)
put(dr, norm(swell(1.0), -10), 15.0)

# sidechain
sc = np.ones(N); tt = np.arange(N) / SR
for kt in kicks:
    i = int(kt * SR); n = min(int(0.35 * SR), N - i)
    sc[i:i + n] = np.minimum(sc[i:i + n], 1 - 0.45 * np.exp(-(tt[i:i + n] - kt) / 0.09))

ep_st = fx(ep[0] + ep[1], pb.Chorus(rate_hz=0.8, depth=0.15, mix=0.35), pb.Reverb(room_size=0.55, damping=0.6, wet_level=0.22, dry_level=0.85, width=1.0))
ep_st = ep_st * sc
pads_st = fx(pads * sc, pb.Reverb(room_size=0.8, wet_level=0.35, dry_level=0.7, width=1.0))
bs_st = fx(bs * sc)
lead_st = fx(lead, pb.Delay(delay_seconds=0.375, feedback=0.28, mix=0.22), pb.Reverb(room_size=0.6, wet_level=0.25, dry_level=0.8, width=1.0))
dr_st = fx(dr[0] + dr[1], pb.Compressor(threshold_db=-14, ratio=2.5, attack_ms=8, release_ms=90), pb.Reverb(room_size=0.25, wet_level=0.08, dry_level=0.95, width=0.8))

music = norm(ep_st, -9) + norm(pads_st, -17) + norm(bs_st, -8) + norm(lead_st, -17) + norm(dr_st, -5)
fade = np.ones(N); fs = int(30.4 * SR); fade[fs:] = np.linspace(1, 0, N - fs) ** 1.6
music *= fade

# =============================================================================
#  Sound design (restrained)
# =============================================================================
sfxbuf = np.zeros((2, N))


def whoosh(d, lo=300, hi=3000):
    """Soft air whoosh centred on its event time (rises over d, falls over d)."""
    t = ta(2 * d)
    k = np.clip(t / (2 * d), 0, 1)
    env = np.sin(np.pi * k) ** 2.2
    n = rng.standard_normal(len(t))
    x = bp(n, lo, hi, 2) * env
    pan = np.linspace(-0.6, 0.6, len(t))
    return fx(np.stack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))]), pb.Reverb(room_size=0.4, wet_level=0.15, dry_level=0.9, width=1.0))


def click(soft=True):
    t = ta(0.06)
    x = np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.006) * 0.5 + bp(rng.standard_normal(len(t)), 2000, 8000) * np.exp(-t / 0.0025)
    if not soft:
        x += np.sin(2 * np.pi * np.cumsum(140 + 60 * np.exp(-t / 0.01)) / SR) * np.exp(-t / 0.03) * 0.6
    return x


def key_tick(v):
    r = np.random.default_rng(300 + int(v))
    t = ta(0.035)
    return bp(r.standard_normal(len(t)), 2500 + r.uniform(-400, 400), 9000) * np.exp(-t / (0.004 + r.uniform(0, 0.002)))


def bubble():
    t = ta(0.14)
    f = np.where(t < 0.06, 740, 988)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-np.where(t < 0.06, t, t - 0.06) / 0.03) * 0.8
    return fx(x, pb.Reverb(room_size=0.3, wet_level=0.15, dry_level=0.9))


def soft_pop():
    t = ta(0.12)
    f = 520 + 280 * np.exp(-t / 0.02)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035)


def bell(freq, d=2.2, bright=1.0):
    t = ta(d)
    mod = np.sin(2 * np.pi * freq * 3.5 * t) * 1.6 * bright * np.exp(-t / 0.3)
    return np.sin(2 * np.pi * freq * t + mod) * np.exp(-t / 0.7) * np.clip(t / 0.002, 0, 1)


def success():
    out = np.zeros((2, int(2.6 * SR)))
    for i, m in enumerate([76, 79, 84]):     # E, G, C: resolves onto the track's C
        put(out, bell(midi(m), 2.2, 0.8), i * 0.09, 0.55, pan=-0.2 + 0.2 * i)
    return fx(out[0] + out[1], pb.Reverb(room_size=0.75, wet_level=0.3, dry_level=0.8, width=1.0))


def logo():
    t = ta(1.8)
    sub = np.sin(2 * np.pi * np.cumsum(55 + 25 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.45) * 0.8
    shimmer = hp(rng.standard_normal(len(t)), 7000) * np.exp(-t / 0.5) * 0.05
    chime = bell(midi(84), 1.8, 0.5) * 0.25 + bell(midi(91), 1.8, 0.4) * 0.12
    return fx(sub + shimmer + chime, pb.Reverb(room_size=0.7, wet_level=0.25, dry_level=0.85, width=1.0))


LEVEL = {'whoosh': -14, 'whoosh_down': -15, 'swish': -19, 'soft_pop': -22, 'click': -14, 'tap': -18,
         'bubble': -23, 'key': -24, 'step': -26, 'success': -11, 'logo': -12, 'intro': -20}
events = json.load(open(os.environ.get('SFX', 'sfx.json')))['sfx']
for e in events:
    typ, t, g = e['type'], e['t'], e.get('gain', 1.0)
    lvl = LEVEL.get(typ, -20) + 20 * np.log10(max(g, 1e-3))
    if typ in ('whoosh', 'whoosh_down'):
        d = e.get('dur', 0.35)
        x = whoosh(d, 250, 2600 if typ == 'whoosh' else 1600)
        put(sfxbuf, norm(x, lvl), t - d)
    elif typ == 'swish':
        x = whoosh(0.18, 1500, 7000); put(sfxbuf, norm(x, lvl), t - 0.18)
    elif typ == 'soft_pop':
        put(sfxbuf, norm(soft_pop(), lvl), t)
    elif typ == 'click':
        put(sfxbuf, norm(click(False), lvl), t)
    elif typ == 'tap':
        put(sfxbuf, norm(click(True), lvl), t)
    elif typ == 'bubble':
        put(sfxbuf, norm(bubble(), lvl), t, pan=-0.1)
    elif typ == 'key':
        put(sfxbuf, norm(key_tick(e.get('v', 0)), lvl + rng.uniform(-2, 1)), t, pan=rng.uniform(-0.15, 0.15))
    elif typ == 'step':
        put(sfxbuf, norm(click(True), lvl), t)
    elif typ == 'success':
        put(sfxbuf, norm(success(), lvl), t)
    elif typ == 'logo':
        put(sfxbuf, norm(logo(), lvl), t)
    else:
        print('unknown', typ)

mix = music + sfxbuf
mix = pb.Pedalboard([pb.HighpassFilter(cutoff_frequency_hz=30), pb.Compressor(threshold_db=-16, ratio=2, attack_ms=15, release_ms=150)])(mix.astype(np.float32), SR)
meter = pyln.Meter(SR)
mix = mix * 10 ** ((-16.8 - meter.integrated_loudness(mix.T)) / 20)
mix = pb.Pedalboard([pb.Limiter(threshold_db=-2.0, release_ms=80), pb.Gain(gain_db=-1.2)])(mix.astype(np.float32), SR)
f = int(0.01 * SR); mix[:, :f] *= np.linspace(0, 1, f)
print('LUFS %.1f  peak %.2f dBFS' % (meter.integrated_loudness(mix.T), 20 * np.log10(np.abs(mix).max())))
pcm = (np.clip(mix, -1, 1).T * 32767).astype('<i2')
with wave.open(os.environ.get('OUT', 'soundtrack.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('written')
