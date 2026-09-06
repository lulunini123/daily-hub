param([int]$Port = 8770)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

function Find-Python {
  $candidates = @(
    (Get-Command python -ErrorAction SilentlyContinue).Source,
    (Get-Command py -ErrorAction SilentlyContinue).Source,
    'C:\Users\56450\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
  )
  foreach ($c in $candidates) {
    if ($c -and (Test-Path $c)) { return $c }
  }
  return $null
}

function Show-Addresses {
  param([int]$port)
  $ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' }
  Write-Host ''
  Write-Host 'Daily Hub 手机访问地址（手机和电脑需在同一 Wi-Fi）：'
  foreach ($ip in $ips) {
    Write-Host ("  http://{0}:{1}/" -f $ip.IPAddress, $port)
  }
  Write-Host ''
  Write-Host '按 Ctrl+C 停止服务器。'
}

$py = Find-Python
if ($py) {
  Show-Addresses $Port
  & $py -m http.server $Port --bind 0.0.0.0 --directory $root
  exit $LASTEXITCODE
}

try {
  $listener = [System.Net.HttpListener]::new()
  $listener.Prefixes.Add("http://*:$Port/")
  $listener.Start()
  Show-Addresses $Port
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $rel = $ctx.Request.Url.LocalPath.TrimStart('/').Replace('/', '\')
    if ($rel -eq '') { $rel = 'index.html' }
    $file = Join-Path $root $rel
    if (-not (Test-Path $file -LiteralPath)) {
      $ctx.Response.StatusCode = 404
      $ctx.Response.Close()
      continue
    }
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    $mime = switch ($ext) {
      '.html' { 'text/html; charset=utf-8' }
      '.css' { 'text/css; charset=utf-8' }
      '.js' { 'application/javascript; charset=utf-8' }
      '.json' { 'application/json; charset=utf-8' }
      '.webmanifest' { 'application/manifest+json' }
      '.png' { 'image/png' }
      '.svg' { 'image/svg+xml' }
      '.ico' { 'image/x-icon' }
      default { 'application/octet-stream' }
    }
    $ctx.Response.ContentType = $mime
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $ctx.Response.Close()
  }
} catch {
  Write-Error "无法启动局域网服务器：$_"
  Write-Host '请尝试用管理员身份运行 PowerShell，或在 Codex 会话中让我帮你启动。'
  exit 1
}
