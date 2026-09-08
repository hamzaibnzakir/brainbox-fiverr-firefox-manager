# Brainbox Firefox Manager Windows Build

This project is ready to build a Windows x64 installer.

## On a Windows 10/11 development machine

Install:

1. Node.js 22
2. Python 3.12
3. Rust stable with the MSVC toolchain
4. Visual Studio Build Tools with Desktop development with C++

Then open PowerShell in this folder and run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\build-windows.ps1
```

The installer will be created under:

`src-tauri\target\release\bundle\nsis\`

## GitHub Actions

The repository also contains `.github/workflows/build-windows.yml`. Push the project to GitHub and run the `Build Windows` workflow manually, or create a `v*` tag. GitHub will produce the Windows setup executable as an artifact.

The installer contains the Brainbox engine and geckodriver. End users do not need Node.js, Python, Rust or geckodriver installed.
