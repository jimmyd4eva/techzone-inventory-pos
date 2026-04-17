; TechZone POS - Inno Setup Installer Script
; Download Inno Setup from: https://jrsoftware.org/isdl.php

#define MyAppName "TechZone POS"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "TechZone"
#define MyAppURL "https://techzone.com"
#define MyAppExeName "START.bat"

[Setup]
; Unique ID for this application (generate new GUID for your app)
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
; Output settings
OutputDir=installer_output
OutputBaseFilename=TechZone-POS-Setup-{#MyAppVersion}
; Icon
SetupIconFile=SalesTax.ico
UninstallDisplayIcon={app}\SalesTax.ico
; Compression
Compression=lzma2/ultra64
SolidCompression=yes
; Requires admin for Program Files installation
PrivilegesRequired=admin
; Windows version
MinVersion=10.0
; Wizard style
WizardStyle=modern
WizardSizePercent=120

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Backend files
Source: "backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "__pycache__,*.pyc,*.pyo,.env"
; Frontend files (built version)
Source: "frontend\build\*"; DestDir: "{app}\frontend\build"; Flags: ignoreversion recursesubdirs createallsubdirs
; Frontend source (for npm start mode)
Source: "frontend\src\*"; DestDir: "{app}\frontend\src"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "frontend\public\*"; DestDir: "{app}\frontend\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "frontend\package.json"; DestDir: "{app}\frontend"; Flags: ignoreversion
Source: "frontend\package-lock.json"; DestDir: "{app}\frontend"; Flags: ignoreversion skipifsourcedoesntexist
; Batch files
Source: "START.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "STOP.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "SETUP.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "RESET_ADMIN.bat"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
; Icon
Source: "SalesTax.ico"; DestDir: "{app}"; Flags: ignoreversion
; Documentation
Source: "LOCAL_SETUP_GUIDE.md"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Dirs]
Name: "{app}\backend"; Permissions: users-full
Name: "{app}\frontend"; Permissions: users-full
Name: "{app}\data"; Permissions: users-full

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\SalesTax.ico"; WorkingDir: "{app}"
Name: "{group}\Stop {#MyAppName}"; Filename: "{app}\STOP.bat"; IconFilename: "{app}\SalesTax.ico"; WorkingDir: "{app}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\SalesTax.ico"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
; Create backend .env file after installation
Filename: "{cmd}"; Parameters: "/c echo MONGO_URL=mongodb://localhost:27017 > ""{app}\backend\.env"" && echo DB_NAME=salestax >> ""{app}\backend\.env"" && echo JWT_SECRET=techzone-local-secret-2024 >> ""{app}\backend\.env"" && echo EMAIL_ADDRESS= >> ""{app}\backend\.env"" && echo EMAIL_PASSWORD= >> ""{app}\backend\.env"""; Flags: runhidden
; Create frontend .env file
Filename: "{cmd}"; Parameters: "/c echo REACT_APP_BACKEND_URL=http://127.0.0.1:8001 > ""{app}\frontend\.env"""; Flags: runhidden
; Option to run setup after install
Filename: "{app}\SETUP.bat"; Description: "Run first-time setup (install dependencies)"; Flags: nowait postinstall skipifsilent unchecked
; Option to launch app after install
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}\backend\__pycache__"
Type: filesandordirs; Name: "{app}\frontend\node_modules"
Type: files; Name: "{app}\backend\.env"
Type: files; Name: "{app}\frontend\.env"

[Messages]
WelcomeLabel2=This will install [name/ver] on your computer.%n%nPREREQUISITES REQUIRED:%n- Python 3.10+ (with PATH)%n- Node.js LTS%n- MongoDB (as Windows service)%n%nMake sure these are installed before continuing.

[Code]
// Check if Python is installed
function IsPythonInstalled: Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('py', '--version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

// Check if Node.js is installed
function IsNodeInstalled: Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('node', '--version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

// Check prerequisites before installation
function InitializeSetup: Boolean;
var
  ErrMsg: String;
begin
  Result := True;
  ErrMsg := '';
  
  if not IsPythonInstalled then
    ErrMsg := ErrMsg + '- Python is not installed or not in PATH' + #13#10;
  
  if not IsNodeInstalled then
    ErrMsg := ErrMsg + '- Node.js is not installed or not in PATH' + #13#10;
  
  if ErrMsg <> '' then
  begin
    if MsgBox('The following prerequisites are missing:' + #13#10 + #13#10 + ErrMsg + #13#10 + 'Do you want to continue anyway?', mbConfirmation, MB_YESNO) = IDNO then
      Result := False;
  end;
end;
