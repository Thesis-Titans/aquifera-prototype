Add-Type -AssemblyName System.Drawing

$srcDir = "c:\Users\markc\_Projects\capstone-research\BSIT Capstone Research\Concepts\Aquifera\aquifera-prototype"
$outDir = Join-Path $srcDir "public\assets\maps"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

# Crop map viewport from 2D Subsidence Dashboard (approx x=334, y=70, w=1176, h=570)
$files = @(
  @{ Name = "AQUIFERA 2D Subsidence Dashboard.png"; Out = "metro_iloilo_2d_subsidence.png" },
  @{ Name = "AQUIFERA Groundwater Insights Dashboard.png"; Out = "metro_iloilo_2d_insights.png" },
  @{ Name = "AQUIFERA Metro Iloilo Simulation Dashboard.png"; Out = "metro_iloilo_3d_simulation.png" }
)

foreach ($f in $files) {
  $inPath = Join-Path $srcDir $f.Name
  $outPath = Join-Path $outDir $f.Out
  $bmp = [System.Drawing.Bitmap]::FromFile($inPath)
  
  # The central viewport rectangle:
  # In 1536x1024, the map container is at x=334, y=70, width=1176, height=570
  $rect = [System.Drawing.Rectangle]::new(334, 70, 1176, 570)
  $cropped = $bmp.Clone($rect, $bmp.PixelFormat)
  $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $cropped.Dispose()
  $bmp.Dispose()
  Write-Output "Successfully cropped $inPath -> $outPath (1176x570)"
}
