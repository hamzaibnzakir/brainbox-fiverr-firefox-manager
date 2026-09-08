$ErrorActionPreference = "Stop"

# Generate the Windows application icon before Tauri starts.
$IconDir = "src-tauri\icons"
$IconPath = Join-Path $IconDir "icon.ico"
New-Item -ItemType Directory -Force -Path $IconDir | Out-Null

Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap 256, 256, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::FromArgb(18, 18, 22))

$font = New-Object System.Drawing.Font("Arial", 150, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString("B", $font, $brush, (New-Object System.Drawing.RectangleF(0, 0, 256, 256)), $format)

$pngPath = Join-Path $env:TEMP "brainbox-icon.png"
$bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
$stream = New-Object System.IO.FileStream($IconPath, [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Close()
$icon.Dispose()
$graphics.Dispose()
$brush.Dispose()
$font.Dispose()
$format.Dispose()
$bitmap.Dispose()
Remove-Item $pngPath -Force -ErrorAction SilentlyContinue
Write-Host "Generated $IconPath"

.\scripts\build_sidecar_windows.ps1
npm install
npm run tauri build -- --bundles nsis
Write-Host "Windows installer is in src-tauri\target\release\bundle\nsis"
