Add-Type -AssemblyName System.Drawing
$dir = Join-Path (Get-Location) "public\images\demo"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

function New-PartnerLogo([string]$file, [string]$name, [string]$tier) {
  $width = 960
  $height = 420
  $bitmap = New-Object System.Drawing.Bitmap $width, $height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.Color]::FromArgb(255, 26, 12, 42))
  $gold = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 232, 181, 58))
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 183, 166, 201))
  $bar = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 232, 181, 58))
  $graphics.FillRectangle($bar, 0, 0, $width, 8)
  $tierFont = New-Object System.Drawing.Font "Arial", 18, ([System.Drawing.FontStyle]::Bold)
  $nameFont = New-Object System.Drawing.Font "Arial", 54, ([System.Drawing.FontStyle]::Bold)
  $markFont = New-Object System.Drawing.Font "Arial", 16, ([System.Drawing.FontStyle]::Bold)
  $tierSize = $graphics.MeasureString($tier, $tierFont)
  $nameSize = $graphics.MeasureString($name, $nameFont)
  $graphics.DrawString($tier, $tierFont, $gold, ($width - $tierSize.Width) / 2, 78)
  $graphics.DrawString($name, $nameFont, $white, ($width - $nameSize.Width) / 2, 150)
  $mark = "UNITED TIGERS"
  $markSize = $graphics.MeasureString($mark, $markFont)
  $graphics.DrawString($mark, $markFont, $muted, ($width - $markSize.Width) / 2, 280)
  $path = Join-Path $dir $file
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
  $gold.Dispose(); $white.Dispose(); $muted.Dispose(); $bar.Dispose()
  $tierFont.Dispose(); $nameFont.Dispose(); $markFont.Dispose()
}

New-PartnerLogo "sponsor-title.png" "FMC DOCKYARD" "TITLE PARTNER"
New-PartnerLogo "sponsor-kit.png" "SWIFT KIT" "PRINCIPAL PARTNER"
New-PartnerLogo "sponsor-media.png" "DEN LIVE" "MEDIA PARTNER"
New-PartnerLogo "sponsor-official.png" "HARBOUR GOLD" "OFFICIAL PARTNER"
Write-Output "Partner logos written"
