param([int]$Port = 8080)
$root = (Convert-Path .)
$prefix = "http://localhost:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Clear()
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Serving $root at $prefix"

function Get-ContentType($path) {
  switch ([System.IO.Path]::GetExtension($path).ToLower()) {
    ".html" { return "text/html; charset=utf-8" }
    ".css"  { return "text/css" }
    ".js"   { return "application/javascript" }
    ".json" { return "application/json" }
    ".svg"  { return "image/svg+xml" }
    ".png"  { return "image/png" }
    ".jpg"  { return "image/jpeg" }
    ".jpeg" { return "image/jpeg" }
    ".pdf"  { return "application/pdf" }
    default  { return "application/octet-stream" }
  }
}

while ($true) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response

  $path = $request.Url.AbsolutePath.TrimStart('/')
  if ([string]::IsNullOrWhiteSpace($path)) { $path = 'index.html' }
  $fullPath = Join-Path $root $path

  if (Test-Path $fullPath -PathType Leaf) {
    try {
      $bytes = [System.IO.File]::ReadAllBytes($fullPath)
      $response.ContentType = Get-ContentType $fullPath
      $response.ContentLength64 = $bytes.Length
      $response.Headers.Add("Access-Control-Allow-Origin", "*")
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch {
      $response.StatusCode = 500
      $msg = [System.Text.Encoding]::UTF8.GetBytes("Server error")
      $response.ContentType = "text/plain"
      $response.OutputStream.Write($msg, 0, $msg.Length)
    }
  } else {
    $response.StatusCode = 404
    $msg = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
    $response.ContentType = "text/plain"
    $response.OutputStream.Write($msg, 0, $msg.Length)
  }

  $response.OutputStream.Close()
}