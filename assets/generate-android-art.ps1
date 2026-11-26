Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$green = [System.Drawing.ColorTranslator]::FromHtml('#0e2a2f')
$cream = [System.Drawing.ColorTranslator]::FromHtml('#eef4f1')
$gold = [System.Drawing.ColorTranslator]::FromHtml('#c99a3b')
$muted = [System.Drawing.ColorTranslator]::FromHtml('#b8cbc5')

function New-Canvas([int]$Width, [int]$Height) {
  $bitmap = [System.Drawing.Bitmap]::new($Width, $Height)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.Clear($green)
  return @{ Bitmap = $bitmap; Graphics = $g }
}

function Draw-Book($Graphics, [single]$X, [single]$Y, [single]$Size) {
  $scale = $Size / 300
  $creamBrush = [System.Drawing.SolidBrush]::new($cream)
  $goldBrush = [System.Drawing.SolidBrush]::new($gold)
  $mutedPen = [System.Drawing.Pen]::new($muted, 4 * $scale)
  $goldPen = [System.Drawing.Pen]::new($gold, 6 * $scale)
  $left = [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new($X + 18*$scale, $Y + 66*$scale),
    [System.Drawing.PointF]::new($X + 145*$scale, $Y + 98*$scale),
    [System.Drawing.PointF]::new($X + 145*$scale, $Y + 244*$scale),
    [System.Drawing.PointF]::new($X + 18*$scale, $Y + 211*$scale)
  )
  $right = [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new($X + 155*$scale, $Y + 98*$scale),
    [System.Drawing.PointF]::new($X + 282*$scale, $Y + 66*$scale),
    [System.Drawing.PointF]::new($X + 282*$scale, $Y + 211*$scale),
    [System.Drawing.PointF]::new($X + 155*$scale, $Y + 244*$scale)
  )
  $Graphics.FillPolygon($creamBrush, $left)
  $Graphics.FillPolygon($creamBrush, $right)
  $Graphics.DrawPolygon($goldPen, $left)
  $Graphics.DrawPolygon($goldPen, $right)
  $Graphics.DrawLine($goldPen, $X + 150*$scale, $Y + 94*$scale, $X + 150*$scale, $Y + 245*$scale)
  foreach ($lineY in @(126, 159, 192)) {
    $Graphics.DrawLine($mutedPen, $X + 38*$scale, $Y + $lineY*$scale, $X + 125*$scale, $Y + ($lineY+22)*$scale)
    $Graphics.DrawLine($mutedPen, $X + 175*$scale, $Y + ($lineY+22)*$scale, $X + 262*$scale, $Y + $lineY*$scale)
  }
  $creamBrush.Dispose(); $goldBrush.Dispose(); $mutedPen.Dispose(); $goldPen.Dispose()
}

function Save-Icon([string]$Path, [int]$Size) {
  $canvas = New-Canvas $Size $Size
  $g = $canvas.Graphics
  Draw-Book $g ($Size * .205) ($Size * .24) ($Size * .59)
  $canvas.Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $canvas.Bitmap.Dispose()
}

function Save-Splash([string]$Path, [int]$Width, [int]$Height) {
  $canvas = New-Canvas $Width $Height
  $g = $canvas.Graphics
  $size = [Math]::Min($Width, $Height) * .31
  Draw-Book $g (($Width-$size)/2) (($Height-$size)/2 - $size*.24) $size
  $fontSize = [Math]::Max(20, [Math]::Min($Width, $Height) * .034)
  $font = [System.Drawing.Font]::new('Georgia', $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $brush = [System.Drawing.SolidBrush]::new($cream)
  $format = [System.Drawing.StringFormat]::new()
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString('Daily Diary', $font, $brush, [System.Drawing.RectangleF]::new(0, $Height*.61, $Width, $fontSize*2), $format)
  $canvas.Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $format.Dispose(); $brush.Dispose(); $font.Dispose(); $g.Dispose(); $canvas.Bitmap.Dispose()
}

Save-Icon (Join-Path $root 'assets\icon-512.png') 512
Save-Splash (Join-Path $root 'assets\splash-1080x1920.png') 1080 1920
$res = Join-Path $root 'android\app\src\main\res'
foreach ($item in @(@('mipmap-mdpi',48),@('mipmap-hdpi',72),@('mipmap-xhdpi',96),@('mipmap-xxhdpi',144),@('mipmap-xxxhdpi',192))) {
  $folder = Join-Path $res $item[0]
  foreach ($name in @('ic_launcher.png','ic_launcher_round.png','ic_launcher_foreground.png')) { Save-Icon (Join-Path $folder $name) $item[1] }
}
Save-Splash (Join-Path $res 'drawable\splash.png') 480 960
foreach ($item in @(@('drawable-port-mdpi',360,800),@('drawable-port-hdpi',540,1200),@('drawable-port-xhdpi',720,1600),@('drawable-port-xxhdpi',1080,2400),@('drawable-port-xxxhdpi',1440,3200),@('drawable-land-mdpi',800,360),@('drawable-land-hdpi',1200,540),@('drawable-land-xhdpi',1600,720),@('drawable-land-xxhdpi',2400,1080),@('drawable-land-xxxhdpi',3200,1440))) {
  Save-Splash (Join-Path $res ($item[0] + '\splash.png')) $item[1] $item[2]
}
