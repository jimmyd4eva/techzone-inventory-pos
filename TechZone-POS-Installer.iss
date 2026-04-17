; TechZone POS - Inno Setup Installer Script
; Download Inno Setup from: https://jrsoftware.org/isdl.php

#define MyAppName "TechZone POS"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "TechZone"
#define MyAppExeName "START.bat"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=installer_output
OutputBaseFilename=TechZone-POS-Setup-{#MyAppVersion}
SetupIconFile=SalesTax.ico
UninstallDisplayIcon={app}\SalesTax.ico
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=admin
MinVersion=10.0
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checked

[Files]
; Backend files
Source: "backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "__pycache__,*.pyc,*.pyo,.env"

; Frontend files - INCLUDING node_modules
Source: "frontend\node_modules\*"; DestDir: "{app}\frontend\node_modules"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "frontend\src\*"; DestDir: "{app}\frontend\src"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "frontend\public\*"; DestDir: "{app}\frontend\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "frontend\package.json"; DestDir: "{app}\frontend"; Flags: ignoreversion
Source: "frontend\craco.config.js"; DestDir: "{app}\frontend"; Flags: ignoreversion skipifsourcedoesntexist

; Batch files
Source: "START.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "STOP.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "SETUP.bat"; DestDir: "{app}"; Flags: ignoreversion

; Icon
Source: "SalesTax.ico"; DestDir: "{app}"; Flags: ignoreversion

[Dirs]
Name: "{app}\backend"; Permissions: users-full
Name: "{app}\frontend"; Permissions: users-full

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\SalesTax.ico"; WorkingDir: "{app}"
Name: "{group}\Stop {#MyAppName}"; Filename: "{app}\STOP.bat"; WorkingDir: "{app}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\SalesTax.ico"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
; Create backend .env file
Filename: "{cmd}"; Parameters: "/c echo MONGO_URL=mongodb://localhost:27017 > ""{app}\backend\.env"" && echo DB_NAME=salestax >> ""{app}\backend\.env"" && echo JWT_SECRET=techzone-local-2024 >> ""{app}\backend\.env"" && echo EMAIL_ADDRESS= >> ""{app}\backend\.env"" && echo EMAIL_PASSWORD= >> ""{app}\backend\.env"""; Flags: runhidden

; Create frontend .env file
Filename: "{cmd}"; Parameters: "/c echo REACT_APP_BACKEND_URL=http://127.0.0.1:8001 > ""{app}\frontend\.env"""; Flags: runhidden

; Launch app after install
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}\backend\__pycache__"
Type: files; Name: "{app}\backend\.env"
Type: files; Name: "{app}\frontend\.env"

[Messages]
WelcomeLabel2=This will install [name/ver] on your computer.%n%nPREREQUISITES REQUIRED:%n- Python 3.10+%n- Node.js LTS%n- MongoDB (as Windows service)%n%nMake sure these are installed before continuing.
