"""Música de muestra para los prototipos del museo.

Piezas originales (no son grabaciones ni canciones existentes) en el ritmo de cada
género, sintetizadas con cuerdas pulsadas (Karplus-Strong) y percusión. Sirven para
probar la experiencia; en la versión final se reemplazan por grabaciones con permiso.

Uso:  python3 herramientas/musica/componer.py public/prototipos/audio
Requiere numpy, scipy y ffmpeg (con libmp3lame).
"""

import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy import signal

SR = 44100
rng = np.random.default_rng(7)

NOTAS = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def hz(nota: str) -> float:
    """'F#4' → frecuencia"""
    letra, resto = nota[0], nota[1:]
    alter = 0
    while resto and resto[0] in '#b':
        alter += 1 if resto[0] == '#' else -1
        resto = resto[1:]
    midi = 12 * (int(resto) + 1) + NOTAS[letra] + alter
    return 440.0 * 2 ** ((midi - 69) / 12)


# ---------------------------------------------------------------- instrumentos


def cuerda(f: float, dur: float, brillo=0.5, caida=0.996, punto=0.18, vel=1.0) -> np.ndarray:
    """Cuerda pulsada (Karplus-Strong vectorizado por bloques de un periodo)."""
    n = max(2, int(round(SR / f - 0.5)))
    total = int(dur * SR)
    ruido = rng.uniform(-1, 1, n)
    # Más brillo = menos suavizado del ruido inicial
    k = max(1, int((1 - brillo) * 6))
    ruido = np.convolve(ruido, np.ones(k) / k, mode='same')
    # Punto de pulsación: filtro peine
    p = max(1, int(punto * n))
    ruido = ruido - np.roll(ruido, p)
    bloques = total // n + 2
    y = np.zeros(bloques * n)
    y[:n] = ruido
    for b in range(1, bloques):
        prev = y[(b - 1) * n : b * n]
        ant = np.concatenate(([y[(b - 1) * n - 1] if b > 1 else 0.0], prev[:-1]))
        y[b * n : (b + 1) * n] = caida * 0.5 * (prev + ant)
    y = y[:total]
    ataque = np.minimum(1, np.arange(total) / (0.002 * SR))
    fin = np.ones(total)
    cola = min(total, int(0.03 * SR))
    fin[-cola:] = np.linspace(1, 0, cola)
    return y * ataque * fin * vel / (np.max(np.abs(y)) + 1e-9)


def guitarra(f, dur, vel=1.0, brillo=0.45):
    return cuerda(f, dur, brillo=brillo, caida=0.9965, punto=0.2, vel=vel)


def arpa(f, dur, vel=1.0):
    return cuerda(f, dur, brillo=0.75, caida=0.9985, punto=0.5, vel=vel)


def mandolina(f, dur, vel=1.0):
    a = cuerda(f, dur, brillo=0.9, caida=0.992, punto=0.12, vel=vel)
    b = cuerda(f * 1.003, dur, brillo=0.9, caida=0.992, punto=0.12, vel=vel)
    return (a + b) * 0.5


def env(n, ataque, caida):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(ataque, 1e-4)) * np.exp(-t / caida)


def banda(x, lo, hi, orden=2):
    sos = signal.butter(orden, [lo, hi], btype='band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def paso_bajo(x, fc, orden=2):
    sos = signal.butter(orden, fc, btype='low', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def cajon_bajo(vel=1.0):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 55 + 70 * np.exp(-t / 0.025)
    tono = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.11)
    golpe = paso_bajo(rng.uniform(-1, 1, n), 900) * env(n, 0.0005, 0.02)
    return (tono * 0.55 + golpe * 0.5) * vel


def cajon_slap(vel=1.0):
    n = int(0.2 * SR)
    ruido = banda(rng.uniform(-1, 1, n), 1200, 6000) * env(n, 0.0003, 0.045)
    cuerpo = np.sin(2 * np.pi * 210 * np.arange(n) / SR) * env(n, 0.0005, 0.03)
    return (ruido * 1.3 + cuerpo * 0.35) * vel


def palma(vel=1.0):
    n = int(0.15 * SR)
    x = np.zeros(n)
    for d in (0, 0.009, 0.017):
        i = int(d * SR)
        m = n - i
        x[i:] += rng.uniform(-1, 1, m) * env(m, 0.0002, 0.012 if d < 0.017 else 0.05)
    return banda(x, 900, 3500) * 1.6 * vel


def quijada(vel=1.0):
    """Golpe a la quijada: los dientes sueltos vibran como un cascabel."""
    n = int(0.45 * SR)
    x = np.zeros(n)
    t = 0.0
    while t < 0.38:
        i = int(t * SR)
        m = min(n - i, int(0.006 * SR))
        x[i : i + m] += rng.uniform(-1, 1, m) * env(m, 0.0001, 0.0015) * np.exp(-t / 0.12)
        t += rng.uniform(0.008, 0.016)
    golpe = banda(rng.uniform(-1, 1, n), 300, 1500) * env(n, 0.0003, 0.02)
    return (banda(x, 2000, 7500) * 2.2 + golpe * 0.7) * vel


def cajita(vel=1.0, tapa=False):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    madera = np.sin(2 * np.pi * (1050 if tapa else 780) * t) * env(n, 0.0002, 0.018)
    ruido = banda(rng.uniform(-1, 1, n), 700, 3000) * env(n, 0.0002, 0.01)
    return (madera * 0.8 + ruido) * vel


def checo(vel=1.0, agudo=False):
    """Calabaza golpeada: grave, hueca y redonda."""
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    f0 = 260 if agudo else 150
    f = f0 * (1 + 0.15 * np.exp(-t / 0.01))
    tono = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.35 * np.sin(2 * np.pi * np.cumsum(f * 2.3) / SR)
    golpe = banda(rng.uniform(-1, 1, n), 300, 2000) * env(n, 0.0003, 0.012)
    return (tono * env(n, 0.001, 0.07 if agudo else 0.1) + golpe * 0.4) * vel


# ---------------------------------------------------------------- partitura


def frase(texto: str):
    """'B4:1 r:1 G4:2 | ...' → [(nota|None, duración en pulsos)]"""
    out = []
    for tok in texto.replace('|', ' ').split():
        n, d = tok.split(':')
        out.append((None if n == 'r' else n, float(d)))
    return out


ACORDES = {
    'Em': ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'],
    'B7': ['B1', 'F#2', 'B2', 'D#3', 'A3', 'F#4'],
    'Am': ['A1', 'E2', 'A2', 'C3', 'E3', 'A3'],
    'A': ['A1', 'E2', 'A2', 'C#3', 'E3', 'A3'],
    'E7': ['E2', 'B2', 'D3', 'G#3', 'B3', 'E4'],
    'D': ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'],
    'D7': ['D2', 'A2', 'C3', 'F#3', 'A3', 'D4'],
    'G': ['G1', 'D2', 'G2', 'B2', 'D3', 'G3'],
    'A7': ['A1', 'E2', 'G2', 'C#3', 'E3', 'A3'],
    'C': ['C2', 'G2', 'C3', 'E3', 'G3', 'C4'],
}


class Pista:
    def __init__(self, segundos: float):
        self.x = np.zeros(int((segundos + 3) * SR))

    def poner(self, t: float, s: np.ndarray, vol=1.0):
        i = int(t * SR)
        if i >= len(self.x):
            return
        m = min(len(s), len(self.x) - i)
        self.x[i : i + m] += s[:m] * vol


def rasgueo(p: Pista, t, acorde, dur, vel=0.5, arriba=False, cuerdas=slice(1, 6)):
    notas = ACORDES[acorde][cuerdas]
    if arriba:
        notas = notas[::-1]
    for k, n in enumerate(notas):
        p.poner(t + k * 0.011, guitarra(hz(n), dur, vel=vel * (0.8 if arriba else 1)))


def melodia(p: Pista, t0, pulso, texto, instrumento, vel=0.8, trem=False):
    t = t0
    for n, d in frase(texto):
        if n:
            dur = d * pulso
            if trem and dur > pulso * 1.2:
                # Trémolo de mandolina en notas largas
                k = 0.0
                while k < dur - 0.02:
                    p.poner(t + k, instrumento(hz(n), 0.25, vel * (0.75 if k else 1)))
                    k += 0.065
            else:
                p.poner(t, instrumento(hz(n), max(dur + 0.6, 0.8), vel))
        t += d * pulso
    return t


def reverb(x, segundos=1.4, mezcla=0.22):
    n = int(segundos * SR)
    ir = rng.uniform(-1, 1, n) * np.exp(-np.arange(n) / (segundos * SR / 6.5))
    ir = paso_bajo(ir, 5000)
    ir /= np.sqrt(np.sum(ir**2))
    mojado = signal.fftconvolve(x, ir)[: len(x)]
    return x * (1 - mezcla) + mojado * mezcla * 1.2


def cuerpo_guitarra(x):
    """Resonancias suaves de la caja"""
    for fc, q, g in ((110, 2, 0.35), (230, 3, 0.25), (420, 4, 0.12)):
        b, a = signal.iirpeak(fc, q, fs=SR)
        x = x + signal.lfilter(b, a, x) * g
    return x


# ---------------------------------------------------------------- piezas
# Cada pieza devuelve pistas separadas (para armar fragmentos por objeto) y su duración


def vals(gramofono=False, tempo=152, con_arpa=False):
    """Vals criollo en mi menor, 3/4."""
    pulso = 60 / tempo
    prog = 'Em Em B7 B7 B7 B7 Em Em Am Am Em Em B7 B7 Em Em'.split()
    mel = (
        'r:1 B4:1 B4:1 | B4:1.5 A4:0.5 G4:1 | F#4:3 | r:1 F#4:1 G4:1 | A4:1 G4:1 F#4:1 | A4:2 G4:1 | G4:3 | r:1 E4:1 F#4:1 |'
        'G4:1 A4:1 C5:1 | C5:1.5 B4:0.5 A4:1 | B4:3 | r:1 G4:1 A4:1 | B4:1 A4:1 G4:1 | F#4:1 D#4:1 F#4:1 | E4:3 | r:3'
    )
    vueltas = 2
    largo = len(prog) * 3 * pulso * vueltas
    g, m = Pista(largo), Pista(largo)
    for v in range(vueltas):
        base = v * len(prog) * 3 * pulso
        for i, ac in enumerate(prog):
            t = base + i * 3 * pulso
            notas = ACORDES[ac]
            g.poner(t, guitarra(hz(notas[0 if i % 2 == 0 else 1]), 1.6, vel=0.9, brillo=0.3))
            rasgueo(g, t + pulso, ac, 0.9, vel=0.32, cuerdas=slice(2, 6))
            rasgueo(g, t + 2 * pulso, ac, 0.9, vel=0.28, cuerdas=slice(2, 6))
        voz = (lambda f, d, vel: arpa(f * 2, d, vel)) if con_arpa else (lambda f, d, vel: guitarra(f * 2, d, vel, brillo=0.6))
        melodia(m, base, pulso, mel, voz, vel=0.75)
    pistas = {'guitarra': cuerpo_guitarra(g.x), 'melodia': m.x}
    if gramofono:
        for k in pistas:
            pistas[k] = banda(pistas[k], 250, 3800, orden=3)
    return pistas, largo


def marinera():
    """Marinera limeña en la mayor, 6/8 con sesquiáltera."""
    pulso = 60 / 290  # corchea
    prog = 'A A E7 E7 E7 E7 A A D D A A E7 E7 A A'.split()
    mel = (
        'r:1 E5:1 C#5:1 E5:2 C#5:1 | A4:3 B4:1 C#5:2 | D5:2 B4:1 G#4:2 B4:1 | E4:3 r:3 | B4:1 D5:1 B4:1 G#4:1 E4:1 G#4:1 |'
        'B4:4 A4:1 G#4:1 | A4:2 C#5:1 E5:3 | r:3 E5:1 F#5:1 E5:1 | F#5:2 E5:1 D5:2 C#5:1 | D5:3 A4:3 | C#5:2 B4:1 A4:2 C#5:1 |'
        'E5:6 | D5:2 C#5:1 B4:2 G#4:1 | B4:2 D5:1 B4:2 G#4:1 | A4:6 | r:6'
    )
    largo = len(prog) * 6 * pulso
    g, h, c, pa = Pista(largo), Pista(largo), Pista(largo), Pista(largo)
    for i, ac in enumerate(prog):
        t = i * 6 * pulso
        notas = ACORDES[ac]
        g.poner(t, guitarra(hz(notas[0]), 1.2, vel=0.9, brillo=0.3))
        if i % 2 == 0:  # 6/8: acentos en 1 y 4
            for k, arriba in ((0, False), (2, True), (3, False), (5, True)):
                rasgueo(g, t + k * pulso, ac, 0.5, vel=0.35 if k in (0, 3) else 0.22, arriba=arriba)
        else:  # 3/4: acentos en 1, 3 y 5
            for k, arriba in ((0, False), (2, False), (4, False), (5, True)):
                rasgueo(g, t + k * pulso, ac, 0.5, vel=0.33 if k != 5 else 0.2, arriba=arriba)
        for k, s, v in ((0, cajon_bajo, 0.9), (2, cajon_slap, 0.6), (3, cajon_slap, 0.8), (5, cajon_slap, 0.55)):
            c.poner(t + k * pulso, s(v))
        for k in (2, 5) if i % 2 == 0 else (1, 3, 5):
            pa.poner(t + k * pulso, palma(0.5))
    melodia(h, 0, pulso, mel, arpa, vel=0.8)
    return {'guitarra': cuerpo_guitarra(g.x), 'arpa': h.x, 'cajon': c.x, 'palmas': pa.x}, largo


def festejo():
    """Festejo en sol mayor: cajón, quijada, cajita, palmas y guitarra."""
    pulso = 60 / 360
    prog = 'G D7 D7 G G D7 D7 G'.split() * 3
    riff = (
        'G4:1 B4:1 D5:1 r:1 D5:1 E5:1 | D5:1 C5:1 A4:1 r:1 F#4:1 A4:1 | C5:2 A4:1 C5:1 B4:1 A4:1 | B4:3 G4:3 |'
        'D5:1 D5:1 B4:1 D5:1 r:1 G5:1 | F#5:1 E5:1 D5:1 r:1 C5:1 A4:1 | A4:1 C5:1 D5:1 C5:1 A4:1 F#4:1 | G4:6'
    )
    largo = len(prog) * 6 * pulso
    g, m, c, q, cj, pa = (Pista(largo) for _ in range(6))
    for i, ac in enumerate(prog):
        t = i * 6 * pulso
        g.poner(t, guitarra(hz(ACORDES[ac][0]), 0.6, vel=0.9, brillo=0.3))
        for k, arriba in ((0, False), (2, True), (3, False), (5, True)):
            rasgueo(g, t + k * pulso, ac, 0.25, vel=0.3, arriba=arriba)
        if i % 2 == 0:
            golpes = ((0, cajon_bajo, 1.0), (2, cajon_slap, 0.7), (3, cajon_slap, 0.9), (5, cajon_slap, 0.6))
        else:
            golpes = ((0, cajon_bajo, 0.9), (1, cajon_slap, 0.35), (2, cajon_slap, 0.7), (3, cajon_slap, 0.85), (4, cajon_bajo, 0.7), (5, cajon_slap, 0.6))
        for k, s, v in golpes:
            c.poner(t + k * pulso, s(v))
        if i % 2 == 0:
            q.poner(t, quijada(0.9))
        else:
            q.poner(t + 3 * pulso, quijada(0.6))
        for k in (0, 1, 3, 4):
            cj.poner(t + k * pulso, cajita(0.45 if k in (0, 3) else 0.3, tapa=k in (1, 4)))
        for k in (2, 5):
            pa.poner(t + k * pulso, palma(0.55))
    for v in range(3):
        melodia(m, v * 8 * 6 * pulso, pulso, riff, lambda f, d, vel: guitarra(f, d, vel, brillo=0.65), vel=0.7)
    return {'guitarra': cuerpo_guitarra(g.x), 'melodia': m.x, 'cajon': c.x, 'quijada': q.x, 'cajita': cj.x, 'palmas': pa.x}, largo


def tondero():
    """Tondero: glosa en mi menor y dulce en sol mayor, con checo."""
    pulso = 60 / 300
    prog = 'Em Em B7 B7 B7 B7 Em Em G G D7 D7 D7 D7 G B7'.split()
    mel = (
        'B4:2 G4:1 E4:2 G4:1 | B4:3 C5:1 B4:1 A4:1 | A4:2 F#4:1 D#4:2 F#4:1 | A4:3 r:3 | F#4:1 A4:1 B4:1 D#5:2 C5:1 |'
        'B4:2 A4:1 F#4:3 | G4:2 F#4:1 E4:3 | r:6 | D5:2 B4:1 G4:2 B4:1 | D5:3 E5:1 D5:1 C5:1 | C5:2 A4:1 F#4:2 A4:1 |'
        'C5:3 r:3 | A4:1 C5:1 D5:1 F#5:2 E5:1 | D5:2 C5:1 A4:3 | B4:2 A4:1 G4:3 | F#4:3 D#4:3'
    )
    vueltas = 2
    largo = len(prog) * 6 * pulso * vueltas
    g, m, c, ch, pa = (Pista(largo) for _ in range(5))
    for v in range(vueltas):
        base = v * len(prog) * 6 * pulso
        for i, ac in enumerate(prog):
            t = base + i * 6 * pulso
            g.poner(t, guitarra(hz(ACORDES[ac][0]), 1.0, vel=0.9, brillo=0.3))
            for k, arriba in ((0, False), (1, True), (3, False), (4, True), (5, True)):
                rasgueo(g, t + k * pulso, ac, 0.4, vel=0.32 if k in (0, 3) else 0.2, arriba=arriba)
            for k, agudo, vv in ((0, False, 1.0), (3, False, 0.8), (5, True, 0.6), (2, True, 0.4)):
                ch.poner(t + k * pulso, checo(vv, agudo))
            for k, s, vv in ((0, cajon_bajo, 0.7), (3, cajon_slap, 0.6)):
                c.poner(t + k * pulso, s(vv))
            for k in (2, 5):
                pa.poner(t + k * pulso, palma(0.45))
        melodia(m, base, pulso, mel, lambda f, d, vel: guitarra(f, d, vel, brillo=0.65), vel=0.8)
    return {'guitarra': cuerpo_guitarra(g.x), 'melodia': m.x, 'cajon': c.x, 'checo': ch.x, 'palmas': pa.x}, largo


def polka():
    """Polka criolla en re mayor, 2/4: guitarra bajo-acorde y mandolina."""
    pulso = 60 / 270  # corchea
    prog = 'D D A7 A7 A7 A7 D D G G D D A7 A7 D D'.split()
    mel = (
        'F#5:1 E5:1 D5:1 A4:1 | F#5:1 A5:1 F#5:2 | E5:1 D5:1 C#5:1 A4:1 | E5:1 G5:1 E5:2 | C#5:1 E5:1 G5:1 E5:1 |'
        'C#5:1 B4:1 A4:2 | D5:1 F#5:1 A5:1 F#5:1 | D5:4 | B5:1 A5:1 G5:1 D5:1 | B5:2 A5:1 G5:1 | F#5:1 E5:1 D5:1 A4:1 |'
        'F#5:2 D5:2 | E5:1 F#5:1 G5:1 E5:1 | C#5:1 D5:1 E5:2 | D5:2 F#5:1 A5:1 | D5:2 r:2'
    )
    vueltas = 2
    largo = len(prog) * 4 * pulso * vueltas
    g, m = Pista(largo), Pista(largo)
    for v in range(vueltas):
        base = v * len(prog) * 4 * pulso
        for i, ac in enumerate(prog):
            t = base + i * 4 * pulso
            notas = ACORDES[ac]
            g.poner(t, guitarra(hz(notas[0]), 0.5, vel=0.9, brillo=0.3))
            rasgueo(g, t + pulso, ac, 0.25, vel=0.28, cuerdas=slice(3, 6))
            g.poner(t + 2 * pulso, guitarra(hz(notas[1]), 0.5, vel=0.8, brillo=0.3))
            rasgueo(g, t + 3 * pulso, ac, 0.25, vel=0.28, cuerdas=slice(3, 6))
        melodia(m, base, pulso, mel, mandolina, vel=0.65, trem=True)
    return {'guitarra': cuerpo_guitarra(g.x), 'mandolina': m.x}, largo


# ---------------------------------------------------------------- mezcla y exportación


def mezclar(pistas: dict, vols: dict, desde=0.0, hasta=None, rev=0.22):
    x = sum(pistas[k] * v for k, v in vols.items())
    x = reverb(x, mezcla=rev)
    i = int(desde * SR)
    j = int(hasta * SR) if hasta else len(x)
    return x[i:j]


def bucle(x: np.ndarray, largo: float) -> np.ndarray:
    """Suma la cola (reverb, notas sonando) al inicio para que el bucle no corte."""
    n = int(largo * SR)
    y = x[:n].copy()
    cola = x[n:]
    y[: len(cola)] += cola[: n]
    return y


def fragmento(x: np.ndarray, seg=9.0) -> np.ndarray:
    n = min(len(x), int(seg * SR))
    y = x[:n].copy()
    f = int(1.2 * SR)
    y[-f:] *= np.linspace(1, 0, f) ** 2
    y[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
    return y


def crujido(x):
    """Ruido de disco antiguo"""
    n = len(x)
    pops = np.zeros(n)
    idx = rng.integers(0, n, n // 3000)
    pops[idx] = rng.uniform(-0.6, 0.6, len(idx))
    sis = banda(rng.uniform(-1, 1, n), 2000, 6000) * 0.012
    return x + paso_bajo(pops, 6000) + sis


def estereo(x, ancho=0.0007):
    d = int(ancho * SR)
    return np.stack([x, np.concatenate([np.zeros(d), x[:-d]])], axis=1)


def guardar(x: np.ndarray, ruta: Path, pico=0.85):
    x = x / (np.max(np.abs(x)) + 1e-9) * pico
    data = (estereo(x) * 32767).astype('<i2').tobytes()
    subprocess.run(
        ['ffmpeg', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '112k', str(ruta)],
        input=data,
        check=True,
    )
    print(f'{ruta.name}: {len(x) / SR:.1f} s, {ruta.stat().st_size // 1024} KB')


def main(salida: Path):
    salida.mkdir(parents=True, exist_ok=True)
    todo = lambda p: {k: 1.0 for k in p}

    # Casona: vals lento con arpa
    pc, Lc = vals(tempo=120, con_arpa=True)
    guardar(bucle(mezclar(pc, {'guitarra': 0.6, 'melodia': 0.8}, rev=0.35), Lc), salida / 'ambiente-casona.mp3')
    p, L = vals()
    pg, _ = vals(gramofono=True)
    guardar(fragmento(crujido(mezclar(pg, todo(pg), rev=0.12))), salida / 'gramofono.mp3')
    guardar(fragmento(mezclar(p, {'guitarra': 1.0}), 9), salida / 'espejo.mp3')

    # Vals criollo
    guardar(bucle(mezclar(p, {'guitarra': 0.9, 'melodia': 0.9}), L), salida / 'ambiente-vals.mp3')
    medio = L / 2
    guardar(fragmento(mezclar(p, todo(p))), salida / 'saco.mp3')
    guardar(fragmento(mezclar(p, {'guitarra': 1.0, 'melodia': 0.6}, desde=medio / 2)), salida / 'guitarra.mp3')
    guardar(fragmento(mezclar(p, {'melodia': 1.0, 'guitarra': 0.25})), salida / 'partitura.mp3')
    guardar(fragmento(paso_bajo(mezclar(p, todo(p), desde=medio / 2, rev=0.4), 2500)), salida / 'farol.mp3')
    guardar(fragmento(crujido(mezclar(pg, todo(pg), desde=medio / 2, rev=0.12))), salida / 'disco.mp3')

    # Marinera limeña
    p, L = marinera()
    mez = {'guitarra': 0.8, 'arpa': 0.9, 'cajon': 0.7, 'palmas': 0.45}
    guardar(bucle(mezclar(p, mez), L), salida / 'ambiente-marinera.mp3')
    guardar(fragmento(mezclar(p, mez)), salida / 'manto.mp3')
    guardar(fragmento(mezclar(p, {'arpa': 1.0, 'guitarra': 0.2})), salida / 'arpa.mp3')
    guardar(fragmento(mezclar(p, {'cajon': 1.0, 'palmas': 0.8})), salida / 'panuelo.mp3')
    guardar(fragmento(mezclar(p, {'guitarra': 1.0}, rev=0.35)), salida / 'abanico.mp3')
    guardar(fragmento(mezclar(p, mez, desde=L / 2)), salida / 'cuadro.mp3')

    # Festejo
    p, L = festejo()
    mez = {'guitarra': 0.6, 'melodia': 0.65, 'cajon': 0.6, 'quijada': 0.7, 'cajita': 0.4, 'palmas': 0.5}
    guardar(bucle(mezclar(p, mez, rev=0.15), L), salida / 'ambiente-festejo.mp3')
    guardar(fragmento(mezclar(p, mez, rev=0.15)), salida / 'falda.mp3')
    guardar(fragmento(mezclar(p, {'quijada': 1.0, 'cajon': 0.3}, rev=0.12)), salida / 'quijada.mp3')
    guardar(fragmento(mezclar(p, {'palmas': 0.9, 'cajon': 0.7}, rev=0.12)), salida / 'cinta.mp3')
    guardar(fragmento(mezclar(p, {'cajon': 1.0, 'quijada': 0.7, 'palmas': 0.6, 'cajita': 0.6}, desde=L / 3, rev=0.12)), salida / 'mascara.mp3')
    guardar(fragmento(mezclar(p, {'cajita': 1.0, 'cajon': 0.3}, rev=0.12)), salida / 'cajita.mp3')

    # Tondero
    p, L = tondero()
    mez = {'guitarra': 0.85, 'melodia': 0.8, 'cajon': 0.5, 'checo': 0.7, 'palmas': 0.4}
    guardar(bucle(mezclar(p, mez), L), salida / 'ambiente-tondero.mp3')
    guardar(fragmento(mezclar(p, mez)), salida / 'sombrero.mp3')
    guardar(fragmento(mezclar(p, {'checo': 1.0, 'guitarra': 0.3}, rev=0.15)), salida / 'checo.mp3')
    guardar(fragmento(mezclar(p, {'guitarra': 1.0, 'palmas': 0.7})), salida / 'panuelo-color.mp3')
    guardar(fragmento(mezclar(p, mez, desde=L / 4)), salida / 'canasta.mp3')
    guardar(fragmento(mezclar(p, mez, desde=L / 2), 12), salida / 'mapa.mp3')

    # Polka criolla
    p, L = polka()
    mez = {'guitarra': 0.8, 'mandolina': 0.8}
    guardar(bucle(mezclar(p, mez), L), salida / 'ambiente-polka.mp3')
    guardar(fragmento(mezclar(p, mez)), salida / 'chaleco.mp3')
    guardar(fragmento(mezclar(p, {'mandolina': 1.0, 'guitarra': 0.2})), salida / 'mandolina.mp3')
    guardar(fragmento(mezclar(p, mez, desde=L / 4)), salida / 'zapatos.mp3')
    guardar(fragmento(mezclar(p, mez, rev=0.4)), salida / 'invitacion.mp3')
    guardar(fragmento(mezclar(p, mez, desde=L / 2)), salida / 'reloj.mp3')


if __name__ == '__main__':
    main(Path(sys.argv[1] if len(sys.argv) > 1 else 'public/prototipos/audio'))
