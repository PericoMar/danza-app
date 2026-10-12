# Plays a short notification sound for Claude Code hooks.
# Usage: powershell -File .claude/play-sound.ps1 -Name claude-finish-task.mp3
param(
  [Parameter(Mandatory = $true)]
  [string]$Name
)

$ErrorActionPreference = "SilentlyContinue"

$path = Join-Path (Join-Path $HOME ".claude\sounds") $Name
if (-not (Test-Path $path)) { exit 0 }
$uri = (Resolve-Path $path).Path

try {
  Add-Type -AssemblyName presentationCore
  $player = New-Object System.Windows.Media.MediaPlayer
  $player.Open([System.Uri]::new($uri))
  # Give MediaPlayer a moment to buffer, then play.
  Start-Sleep -Milliseconds 250
  $player.Volume = 1.0
  $player.Play()
  Start-Sleep -Seconds 6
  $player.Stop()
  $player.Close()
}
catch {
  # Fallback: Windows Media Player COM object.
  try {
    $wmp = New-Object -ComObject WMPlayer.OCX
    $wmp.settings.volume = 100
    $wmp.URL = $uri
    $wmp.controls.play() | Out-Null
    Start-Sleep -Seconds 6
    $wmp.controls.stop() | Out-Null
  }
  catch { }
}
