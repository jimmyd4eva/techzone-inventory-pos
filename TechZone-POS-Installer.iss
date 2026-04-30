; ====================================================================
;  TechZone POS - Inno Setup Installer Script (v2)
;  --------------------------------------------------------------------
;  Wraps the output of BUILD_PORTABLE.bat into a single Setup EXE with:
;    - Start Menu shortcut + optional desktop shortcut
;    - Proper "Add or Remove Programs" entry (with publisher, version,
;      and help link)
;    - Silent uninstaller that leaves user data (mongodb\data) intact
;
;  BUILD STEPS (on a Windows machine):
;    1. Run BUILD_PORTABLE.bat       → produces TechZone-Portable\
;    2. Install Inno Setup 6+        → https://jrsoftware.org/isdl.php
;    3. Right-click this .iss file → "Compile"
;       (or run:  ISCC.exe TechZone-POS-Installer.iss  )
;    4. Output:  dist\TechZone-POS-Setup-1.1.0.exe
; ====================================================================

#define AppName      "TechZone POS"
#define AppVersion   "1.1.0"
#define AppPublisher "TechZone"
#define AppURL       "https://zero-tax-pos.emergent.host"
#define AppExe       "START.bat"
#define PortableDir  "TechZone-Portable"

[Setup]
AppId={{A7F3D1C2-4E18-4B6F-9A3B-00FF112233AA}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
AppUpdatesURL={#AppURL}
DefaultDirName={autopf}\TechZone POS
DefaultGroupName={#AppName}
AllowNoIcons=yes
DisableProgramGroupPage=yes
OutputDir=dist
OutputBaseFilename=TechZone-POS-Setup-{#AppVersion}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
; POS software doesn't need admin — installing to AppData keeps it portable-friendly
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
UninstallDisplayIcon={app}\mongodb\mongod.exe
ChangesAssociations=no
MinVersion=10.0.17763   ; Windows 10 1809+ (tar / curl built in)
; If you have a code-signing cert, uncomment these to sign the setup + uninstaller:
; SignTool=signtool
; SignedUninstaller=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode
Name: "startmenuicon"; Description: "Create a Start Menu shortcut"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; The entire portable payload is pulled in verbatim. recursesubdirs copies
; everything under TechZone-Portable\ (python, mongodb, backend, frontend).
Source: "{#PortableDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Optional icon — falls back to mongod.exe's icon if not present.
Source: "SalesTax.ico"; DestDir: "{app}"; Flags: ignoreversion onlyifdoesntexist

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExe}"; WorkingDir: "{app}"; IconFilename: "{app}\SalesTax.ico"; Tasks: startmenuicon
Name: "{group}\Stop {#AppName}"; Filename: "{app}\STOP.bat"; WorkingDir: "{app}"; Tasks: startmenuicon
Name: "{group}\Reset admin password"; Filename: "{app}\RESET_ADMIN.bat"; WorkingDir: "{app}"; Tasks: startmenuicon
Name: "{group}\Uninstall {#AppName}"; Filename: "{uninstallexe}"; Tasks: startmenuicon
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"; WorkingDir: "{app}"; IconFilename: "{app}\SalesTax.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExe}"; Description: "Launch {#AppName}"; Flags: postinstall skipifsilent nowait

[UninstallRun]
; Gracefully stop any running mongod / python processes so uninstall can
; delete the folder cleanly. Non-fatal if they aren't running.
Filename: "{app}\STOP.bat"; RunOnceId: "StopTechZone"; Flags: runhidden

[UninstallDelete]
; Leave mongodb\data alone — that's the user's business data. Uninstall
; cleans up everything else; user can manually wipe mongodb\data later.
Type: filesandordirs; Name: "{app}\logs"
Type: filesandordirs; Name: "{app}\mongodb\logs"
Type: files; Name: "{app}\backend\.env"

[Code]
function InitializeUninstall(): Boolean;
var
  KeepData: Integer;
begin
  KeepData := MsgBox(
    'Do you want to KEEP your business data (customers, sales, inventory)?' + #13#10#13#10 +
    'Click YES to preserve it (mongodb\data will be left on disk).' + #13#10 +
    'Click NO to delete everything.' + #13#10 +
    'Click CANCEL to abort the uninstall.',
    mbConfirmation, MB_YESNOCANCEL);
  if KeepData = IDCANCEL then begin
    Result := False;
    exit;
  end;
  if KeepData = IDNO then begin
    DelTree(ExpandConstant('{app}\mongodb\data'), True, True, True);
  end;
  Result := True;
end;
