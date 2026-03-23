# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for TechZone POS Desktop
"""

import sys
from pathlib import Path

# Paths
DESKTOP_DIR = Path(SPECPATH)
BACKEND_DIR = DESKTOP_DIR.parent / 'backend'
FRONTEND_BUILD_DIR = DESKTOP_DIR.parent / 'frontend' / 'build'

block_cipher = None

a = Analysis(
    ['desktop_app.py'],
    pathex=[str(BACKEND_DIR)],
    binaries=[],
    datas=[
        # Include the backend server
        (str(BACKEND_DIR / 'server.py'), '.'),
        (str(BACKEND_DIR / 'database.py'), '.'),
        # Include frontend build (will be created by build script)
        (str(FRONTEND_BUILD_DIR), 'frontend') if FRONTEND_BUILD_DIR.exists() else (None, None),
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'aiosqlite',
        'pydantic',
        'pydantic_core',
        'fastapi',
        'starlette',
        'bcrypt',
        'jwt',
        'passlib',
        'email.mime.text',
        'email.mime.multipart',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

# Filter out None entries
a.datas = [(dest, src, type) for dest, src, type in a.datas if dest is not None]

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='TechZone-POS',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Set to False for no console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon.ico' if Path('icon.ico').exists() else None,
)
