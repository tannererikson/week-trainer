#!/usr/bin/env python3
"""Generate Week Trainer PWA icons with no third-party deps (pure zlib PNG writer).
Draws a dark rounded-square background with a sky-blue dumbbell glyph.
Run: python3 gen_icons.py"""
import os
import struct
import zlib

BG = (11, 15, 23, 255)        # #0b0f17
PANEL = (22, 30, 46, 255)     # #161e2e rounded panel
BAR = (56, 189, 248, 255)     # #38bdf8 sky


def write_png(path, w, h, pixels):
    raw = bytearray()
    for y in range(h):
        raw.append(0)  # filter type 0
        raw.extend(pixels[y * w * 4:(y + 1) * w * 4])
    comp = zlib.compress(bytes(raw), 9)

    def chunk(typ, data):
        c = typ + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)))
        f.write(chunk(b'IDAT', comp))
        f.write(chunk(b'IEND', b''))


def make(size, path):
    buf = bytearray(size * size * 4)

    def px(x, y, c):
        if 0 <= x < size and 0 <= y < size:
            i = (y * size + x) * 4
            buf[i:i + 4] = bytes(c)

    cx = cy = size / 2.0
    radius = size * 0.22          # rounded panel corner radius
    inset = size * 0.10           # panel inset from edge
    lo, hi = inset, size - inset

    # geometry of the dumbbell (horizontal)
    bar_h = size * 0.085
    bar_w = size * 0.30
    plate_in_w = size * 0.075
    plate_in_h = size * 0.26
    plate_out_w = size * 0.075
    plate_out_h = size * 0.40
    gap = size * 0.015

    for y in range(size):
        for x in range(size):
            color = BG
            # rounded panel
            inx = lo <= x <= hi and lo <= y <= hi
            if inx:
                color = PANEL
                # round the corners of the panel
                for (ccx, ccy) in ((lo + radius, lo + radius), (hi - radius, lo + radius),
                                   (lo + radius, hi - radius), (hi - radius, hi - radius)):
                    if ((x < lo + radius or x > hi - radius) and (y < lo + radius or y > hi - radius)):
                        if (x - ccx) ** 2 + (y - ccy) ** 2 > radius ** 2 and \
                           abs(x - ccx) < radius and abs(y - ccy) < radius:
                            # only the nearest corner matters; approximate by distance test
                            pass
                # simpler corner rounding: knock out pixels outside the rounded region
                rx = min(max(x, lo + radius), hi - radius)
                ry = min(max(y, lo + radius), hi - radius)
                if (x - rx) ** 2 + (y - ry) ** 2 > radius ** 2:
                    color = BG

            # dumbbell on top of panel
            dx = abs(x - cx)
            dy = abs(y - cy)
            on_bar = dx <= bar_w / 2 and dy <= bar_h / 2
            on_inner = (bar_w / 2 + gap) <= dx <= (bar_w / 2 + gap + plate_in_w) and dy <= plate_in_h / 2
            on_outer = (bar_w / 2 + gap + plate_in_w + gap) <= dx <= (bar_w / 2 + gap + plate_in_w + gap + plate_out_w) and dy <= plate_out_h / 2
            if on_bar or on_inner or on_outer:
                color = BAR

            px(x, y, color)

    write_png(path, size, size, buf)
    print('wrote', path, size)


here = os.path.dirname(os.path.abspath(__file__))
icons = os.path.join(here, 'icons')
os.makedirs(icons, exist_ok=True)
make(192, os.path.join(icons, 'icon-192.png'))
make(512, os.path.join(icons, 'icon-512.png'))
make(180, os.path.join(icons, 'apple-touch-icon.png'))
