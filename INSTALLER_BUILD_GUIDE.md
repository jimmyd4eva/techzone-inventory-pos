# TechZone POS — Portable Windows Build Guide

This repo ships a **zero-install, portable Windows build**. Run one batch
file on a Windows build machine and you'll get a self-contained folder
(and zip) that drops onto any Windows 10/11 PC and runs with a
double-click — no admin rights, no Python/Node/MongoDB installs on the
target machine.

---

## What's inside the portable package

```
TechZone-Portable\
├── START.bat              ← Double-click to launch
├── STOP.bat               ← Stops server + MongoDB
├── RESET_ADMIN.bat        ← Forgot your admin password? Run this.
├── README.txt
├── python\                ← Embedded Python 3.11 + site-packages
│   └── python.exe
├── mongodb\
│   ├── mongod.exe         ← Embedded MongoDB 7.0 server
│   ├── data\              ← Your data lives here — back this up!
│   └── logs\
├── backend\               ← FastAPI app + .env (with random JWT secret)
└── frontend\build\        ← Production React bundle (served by FastAPI)
```

**Data persistence:** everything lives under `TechZone-Portable\mongodb\data`.
To back up, stop the app and copy that folder.

**Security:** each build generates a fresh random `JWT_SECRET` so two
separate installs can't forge each other's tokens.

---

## Building the package (on a Windows build machine)

### Prerequisites
You only need these on the **build** machine — the end-user machine
needs nothing:

| Tool  | Version | Get it |
| ----- | ------- | ------ |
| Node  | 18+     | https://nodejs.org |
| yarn  | 1.22+   | `npm install -g yarn` |
| curl  | any     | ships with Windows 10+ |
| tar   | any     | ships with Windows 10+ |

### Build

```cmd
git clone <this-repo>
cd <repo>
BUILD_PORTABLE.bat
```

That's it. The script:

1. Runs `yarn build` to produce a production React bundle with
   `REACT_APP_BACKEND_URL=""` (relative URLs, same-origin).
2. Downloads embedded Python 3.11 + bootstraps pip.
3. Installs `backend/requirements.txt` into the embedded interpreter.
4. Downloads MongoDB 7.0 and extracts `mongod.exe`.
5. Copies backend + frontend build into `TechZone-Portable\`.
6. Generates a fresh `.env` with a random 64-char JWT secret and
   `ACTIVATION_DISABLED=true` (per-device activation is pointless for a
   portable single-PC install).
7. Emits `START.bat`, `STOP.bat`, `RESET_ADMIN.bat`, `README.txt`.
8. Zips the result to `TechZone-Portable-<version>.zip`.

Typical runtime: **3–7 minutes** depending on internet speed (the
Python + MongoDB downloads are ~120 MB combined).

### Output

```
<repo>\TechZone-Portable\            ← ready-to-run folder
<repo>\TechZone-Portable-1.1.0.zip   ← distribute this
```

---

## Running on an end-user PC

1. Unzip `TechZone-Portable-1.1.0.zip` anywhere (e.g. `C:\POS\`).
2. Double-click `START.bat`.
3. Browser opens automatically at `http://127.0.0.1:8001`.
4. Sign in with `admin` / `admin123` and change the password
   immediately in **Settings → Users**.

### Ports used
- `27017` — embedded MongoDB (loopback only)
- `8001`  — FastAPI + SPA (loopback only)

Both bind to `127.0.0.1`, so the app is **not** reachable from the LAN
by default. That's deliberate for POS machines. If you need LAN access,
edit `START.bat` and change `--host 127.0.0.1` to `--host 0.0.0.0`.

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| Port 8001 / 27017 already in use | Run `STOP.bat`, wait 5s, retry `START.bat`. |
| Forgot admin password | Keep `START.bat` running, then double-click `RESET_ADMIN.bat`. Resets to `admin123`. |
| `yarn build` fails during build | Delete `frontend\node_modules`, retry. |
| `pip install` fails during build | Check proxy / Windows Defender. Some AV engines false-flag `pip`. |
| MongoDB won't start | Check `mongodb\logs\mongod.log`. Most commonly another `mongod.exe` is already running — `STOP.bat` clears it. |

---

## Customising

### Change the bundled Python or MongoDB version
Edit the top of `BUILD_PORTABLE.bat`:

```
set PYVER=3.11.9
set MONGOVER=7.0.14
```

### Pre-seed demo data
Drop a MongoDB dump into `<package>\mongodb\seed\` after the build,
and have `START.bat` call `mongorestore` before launching uvicorn on
first run. (Not built in — ask if you want this wired.)

### Re-enable device activation
Edit `backend\.env` and set `ACTIVATION_DISABLED=false`. Now the
Activation screen will gate access on first launch.

---

## Uninstalling
Delete the folder. There are no registry entries, no system services,
no Start Menu entries, no files outside the folder. Truly portable.
