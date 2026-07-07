Add-Type -AssemblyName System.Drawing

$bricks = @("Bivio","Hubertus","Imperia","Lima","Lupus","Perla","Tigra","Vecto")
$mortars = @(
    @{ Suffix = "1_White";        Label = "White";        Bg = [System.Drawing.Color]::FromArgb(230,227,220); Grout = [System.Drawing.Color]::FromArgb(245,244,240) },
    @{ Suffix = "2_Cement_Grey";  Label = "Cement Grey";  Bg = [System.Drawing.Color]::FromArgb(200,198,192); Grout = [System.Drawing.Color]::FromArgb(140,140,138) },
    @{ Suffix = "3_Buff";         Label = "Buff";         Bg = [System.Drawing.Color]::FromArgb(214,198,168); Grout = [System.Drawing.Color]::FromArgb(196,176,140) }
)

$outDir = "C:\Brick Viewer\images"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$size = 900
$rows = 14
$rowH = [int]($size / $rows)

foreach ($brick in $bricks) {
    $seed = [System.BitConverter]::ToInt32([System.Text.Encoding]::UTF8.GetBytes($brick.PadRight(4).Substring(0,4)), 0)
    $rnd = New-Object System.Random([Math]::Abs($seed))

    foreach ($m in $mortars) {
        $bmp = New-Object System.Drawing.Bitmap($size, $size)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.SmoothingMode = 'AntiAlias'
        $g.TextRenderingHint = 'AntiAlias'

        $groutBrush = New-Object System.Drawing.SolidBrush($m.Grout)
        $g.FillRectangle($groutBrush, 0, 0, $size, $size)

        $brickBrush = New-Object System.Drawing.SolidBrush($m.Bg)
        for ($r = 0; $r -lt $rows; $r++) {
            $offset = if ($r % 2 -eq 0) { 0 } else { [int]($size * 0.12) }
            $x = -$offset
            while ($x -lt $size) {
                $shade = $rnd.Next(-14, 14)
                $c = $m.Bg
                $rr = [Math]::Max(0, [Math]::Min(255, $c.R + $shade))
                $gg = [Math]::Max(0, [Math]::Min(255, $c.G + $shade))
                $bb = [Math]::Max(0, [Math]::Min(255, $c.B + $shade))
                $shadeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($rr,$gg,$bb))
                $brickW = [int]($size * 0.22)
                $g.FillRectangle($shadeBrush, $x + 4, $r * $rowH + 3, $brickW - 6, $rowH - 6)
                $shadeBrush.Dispose()
                $x += $brickW
            }
        }

        $font = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold)
        $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $label = "$brick`n$($m.Label)"
        $bannerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90,0,0,0))
        $bannerW = $size - 40
        $g.FillRectangle($bannerBrush, 20, 20, $bannerW, 150)
        $textRect = New-Object System.Drawing.RectangleF -ArgumentList @(30.0, 30.0, [float]($size - 64), 160.0)
        $g.DrawString($label, $font, $textBrush, $textRect)
        $bannerBrush.Dispose()

        $path = Join-Path $outDir ("{0}_{1}.jpg" -f $brick, $m.Suffix)
        $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]85)
        $bmp.Save($path, $jpegCodec, $encParams)

        $g.Dispose()
        $bmp.Dispose()
        $groutBrush.Dispose()
        $brickBrush.Dispose()
        $textBrush.Dispose()
        $font.Dispose()

        Write-Host "Wrote $path"
    }
}

Write-Host "Done."
