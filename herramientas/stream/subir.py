#!/usr/bin/env python3
"""Sube videos a Cloudflare Stream y devuelve el enlace "Watch" de cada uno.

Uso:  python3 herramientas/stream/subir.py "ruta/video.mp4" ["Nombre en Stream"] ...
      python3 herramientas/stream/subir.py --listar

Lee CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_STREAM_TOKEN de .dev.vars (token con permiso Stream: Edit).
La subida es reanudable (protocolo tus) en partes de 50 MB; al terminar espera a que Stream
termine de procesar el video. El enlace que imprime es el que va en el campo `video` de los .md.
"""
import base64
import os
import sys
import time
from pathlib import Path

import requests

RAIZ = Path(__file__).resolve().parents[2]
PARTE = 50 * 1024 * 1024  # múltiplo de 256 KiB, entre 5 MB y 200 MB


def variables():
    env = dict(os.environ)
    archivo = RAIZ / '.dev.vars'
    if archivo.exists():
        for linea in archivo.read_text().splitlines():
            if '=' in linea and not linea.lstrip().startswith('#'):
                k, v = linea.split('=', 1)
                env.setdefault(k.strip(), v.strip())
    try:
        return env['CLOUDFLARE_ACCOUNT_ID'], env['CLOUDFLARE_STREAM_TOKEN']
    except KeyError as e:
        sys.exit(f'Falta {e.args[0]} en .dev.vars')


CUENTA, TOKEN = variables()
API = f'https://api.cloudflare.com/client/v4/accounts/{CUENTA}/stream'
AUTH = {'Authorization': f'Bearer {TOKEN}'}


def meta(**campos):
    return ','.join(f'{k} {base64.b64encode(str(v).encode()).decode()}' for k, v in campos.items() if v is not None)


def subir(ruta: Path, nombre: str | None = None) -> str:
    nombre = nombre or ruta.stem
    tam = ruta.stat().st_size
    r = requests.post(
        API,
        headers={**AUTH, 'Tus-Resumable': '1.0.0', 'Upload-Length': str(tam), 'Upload-Metadata': meta(name=nombre)},
    )
    r.raise_for_status()
    destino = r.headers['Location']
    uid = r.headers['stream-media-id']
    print(f'↑ {nombre}: {tam / 1e6:.0f} MB → {uid}', flush=True)

    desplazamiento = 0
    with ruta.open('rb') as f:
        while desplazamiento < tam:
            trozo = f.read(PARTE)
            for intento in range(5):
                p = requests.patch(
                    destino,
                    data=trozo,
                    headers={**AUTH, 'Tus-Resumable': '1.0.0', 'Upload-Offset': str(desplazamiento), 'Content-Type': 'application/offset+octet-stream'},
                    timeout=600,
                )
                if p.status_code == 204:
                    break
                print(f'  reintento {intento + 1}: {p.status_code} {p.text[:200]}', flush=True)
                time.sleep(5 * (intento + 1))
            else:
                sys.exit(f'No se pudo subir {nombre}')
            desplazamiento = int(p.headers['Upload-Offset'])
            print(f'  {desplazamiento * 100 // tam}%', flush=True)
    return uid


def esperar(uid: str) -> dict:
    while True:
        v = requests.get(f'{API}/{uid}', headers=AUTH).json()['result']
        estado = v['status']['state']
        if estado == 'ready':
            return v
        if estado == 'error':
            sys.exit(f'Stream no pudo procesar {uid}: {v["status"]}')
        print(f'  procesando ({estado} {v["status"].get("pctComplete", "")}%)…', flush=True)
        time.sleep(10)


def enlace(v: dict) -> str:
    # El campo preview ya es https://customer-xxxx.cloudflarestream.com/<uid>/watch
    return v['preview']


def listar():
    for v in requests.get(API, headers=AUTH).json()['result']:
        print(f"{v['meta'].get('name', '?')}\n  {enlace(v)}  ({v['status']['state']}, {v.get('duration', 0):.0f} s)")


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args or args == ['--listar']:
        listar()
        sys.exit()
    # pares ruta [nombre]; un argumento sin extensión de video después de una ruta es su nombre
    pendientes = []
    while args:
        ruta = Path(args.pop(0))
        nombre = args.pop(0) if args and not Path(args[0]).suffix.lower() in ('.mp4', '.mov', '.mkv', '.webm') else None
        pendientes.append((ruta, nombre))
    resultados = []
    for ruta, nombre in pendientes:
        uid = subir(ruta, nombre)
        v = esperar(uid)
        resultados.append((nombre or ruta.stem, enlace(v)))
        print(f'✓ {resultados[-1][0]}: {resultados[-1][1]}', flush=True)
    print('\nEnlaces para los .md:')
    for n, e in resultados:
        print(f'{n}\n  video: {e}')
