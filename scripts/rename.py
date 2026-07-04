#!/usr/bin/env python3
"""
Rename Sus Score → Sus Score across the entire codebase.
Run from the repo root: python3 scripts/rename.py
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXTENSIONS = {'.ts', '.tsx', '.js', '.json', '.md', '.css', '.html', '.sh', '.py', '.yaml', '.yml', '.svg'}

SKIP_DIRS = {'node_modules', '.git', 'dist', '.next', '.turbo', 'package-lock.json'}

# Replacements in order — most specific / longest first
REPLACEMENTS = [
    # npm package scope
    ('@sus-score/',    '@sus-score/'),
    # kebab-case product name
    ('sus-score',      'sus-score'),
    # kebab-case metric
    ('sus-score',                 'sus-score'),
    # snake_case metric (DB columns, JSON keys)
    ('sus_score',                 'sus_score'),
    ('sus_score_app',      'sus_score_app'),
    # camelCase metric
    ('susScore',                  'susScore'),
    ('susScore',        'susScore'),
    # PascalCase component
    ('SusScoreGauge',             'SusScoreGauge'),
    ('SusScore',                  'SusScore'),
    ('SusScore',        'SusScore'),
    # Display name (spaces)
    ('Sus Score',      'Sus Score'),
    ('Sus Score',                 'Sus Score'),
    # SCREAMING_SNAKE
    ('SUS_SCORE',      'SUS_SCORE'),
]

def should_skip(path):
    parts = path.replace(ROOT, '').split(os.sep)
    return any(p in SKIP_DIRS for p in parts)

changed = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    # Prune skip dirs in-place so os.walk doesn't descend
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    for fname in filenames:
        if fname == 'package-lock.json':
            continue
        ext = os.path.splitext(fname)[1]
        if ext not in EXTENSIONS:
            continue
        fpath = os.path.join(dirpath, fname)
        if should_skip(fpath):
            continue
        try:
            with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
                original = f.read()
        except Exception as e:
            print(f'  SKIP (read error): {fpath}: {e}')
            continue

        updated = original
        for old, new in REPLACEMENTS:
            updated = updated.replace(old, new)

        if updated != original:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(updated)
            rel = os.path.relpath(fpath, ROOT)
            changed.append(rel)
            print(f'  ✓ {rel}')

print(f'\nDone. {len(changed)} files changed.')
