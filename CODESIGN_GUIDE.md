# Code-Signing the TechZone POS Installer

By default, when end-users double-click `TechZone-POS-Setup-1.1.0.exe`,
Windows SmartScreen shows a scary blue "Windows protected your PC" warning
because the binary isn't trusted. This is solvable with a code-signing
certificate (also called an OV or EV certificate). Below is the full
process.

---

## 1. Buy a code-signing certificate

| Vendor | Type | ~Cost | Notes |
| ------ | ---- | ----- | ----- |
| Sectigo (formerly Comodo) | OV | $80–120/yr | Cheapest reputable option |
| DigiCert | OV / EV | $300+ / $500+/yr | Most universally trusted |
| Certum | OV | $30–80/yr | EU-friendly, often used for OSS |
| SSL.com | OV / EV | $200+/yr | Easy validation |

**OV vs EV**: OV is enough to remove the SmartScreen warning *eventually*
(after enough users install your binary). EV gets you instant SmartScreen
trust. For a small POS distributed in low volume, OV is fine — just expect
a few weeks of warnings before SmartScreen "warms up" to your reputation.

You'll provide business documents (incorporation papers, phone listing in a
public registry like Dun & Bradstreet) — same KYC as opening a business
bank account. Validation takes 1–7 days.

---

## 2. Install signtool.exe

Comes with the Windows SDK (free). After installing the SDK, signtool is
typically at:
```
C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe
```

Add it to your PATH or invoke with the full path.

---

## 3. Configure Inno Setup to sign on compile

Open `TechZone-POS-Installer.iss` and uncomment the two `Sign...=` lines
in the `[Setup]` section:

```ini
[Setup]
; Existing settings...
SignTool=signtool
SignedUninstaller=yes
```

Then in Inno Setup's IDE, go to **Tools → Configure Sign Tools...** and
add a tool named `signtool` with a command like (one line):

```
"C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe" sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 /a $f
```

Replace the path and timestamp URL as appropriate. The `$f` placeholder is
expanded by Inno Setup to the file being signed.

If your cert is in a `.pfx` file (instead of the Windows cert store), use:
```
"...\signtool.exe" sign /f "C:\path\to\cert.pfx" /p YourPfxPassword /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 $f
```

> **Tip**: never commit a `.pfx` file or password to git. Use environment
> variables and have the build runner inject them.

---

## 4. Compile

Right-click `TechZone-POS-Installer.iss` → **Compile**. Inno Setup will
sign the uninstaller (because `SignedUninstaller=yes`) and the final
installer EXE during the build.

Verify with:
```
signtool verify /pa /v dist\TechZone-POS-Setup-1.1.0.exe
```

You should see "Successfully verified" — and the installer's properties
in Explorer will now show a "Digital Signatures" tab.

---

## 5. (Optional) Sign the bundled binaries too

The portable payload includes `python.exe` and `mongod.exe` — both already
signed by their upstream vendors (PSF and MongoDB Inc.) so you don't need
to do anything. The only files you might want to sign yourself are
`START.bat` / `STOP.bat` / `RESET_ADMIN.bat` — but Windows doesn't trust
signed `.bat` files anyway, so it's not worth the effort.

---

## 6. Reputation warm-up (OV only)

Right after issuing, an OV cert is unknown to SmartScreen. Each install
your users do successfully feeds a tiny bit of reputation. The blue
warning typically goes away after ~a few hundred installs over 2–4 weeks.
EV certs skip this entirely.

You can hasten warm-up by submitting a fresh build to **Microsoft Defender
Smart App Control** for analysis:
https://www.microsoft.com/en-us/wdsi/filesubmission

---

## TL;DR

1. Buy an OV cert (~$80/yr from Sectigo / Certum)
2. Install Windows SDK, find `signtool.exe`
3. Uncomment `SignTool=signtool` and `SignedUninstaller=yes` in the .iss
4. Configure Inno Setup → Tools → Configure Sign Tools with your cmdline
5. Right-click .iss → Compile → done
