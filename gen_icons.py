#!/usr/bin/env python3
"""Regenerate Week Trainer PWA icons from the source logo (icons/logo-source.png).
Uses macOS `sips` to resize the 1080px master into the three icon sizes.
Run: python3 gen_icons.py"""
import os
import subprocess

here = os.path.dirname(os.path.abspath(__file__))
icons = os.path.join(here, 'icons')
src = os.path.join(icons, 'logo-source.png')

for size, name in ((192, 'icon-192.png'), (512, 'icon-512.png'), (180, 'apple-touch-icon.png')):
    out = os.path.join(icons, name)
    subprocess.run(['sips', '-z', str(size), str(size), src, '--out', out], check=True,
                   stdout=subprocess.DEVNULL)
    print('wrote', out, size)
