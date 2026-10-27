param(
    [switch]$Backend,
    [switch]$Frontend
)

$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
Set-Location -LiteralPath $projectRoot

if ($Backend) {
    & (Join-Path $projectRoot '.venv\Scripts\python.exe') manage.py runserver 127.0.0.1:8000
    exit $LASTEXITCODE
}

if ($Frontend) {
    Set-Location -LiteralPath (Join-Path $projectRoot 'frontend')
    npm run dev
    exit $LASTEXITCODE
}

$python = Get-Command py -ErrorAction SilentlyContinue
if (-not $python) {
    throw 'Python launcher "py" is required. Install Python 3.10 or newer and try again.'
}

if (-not (Test-Path (Join-Path $projectRoot '.venv\Scripts\python.exe'))) {
    & $python.Source -m venv (Join-Path $projectRoot '.venv')
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not create the Python virtual environment.'
    }
}

$venvPython = Join-Path $projectRoot '.venv\Scripts\python.exe'
& $venvPython -m pip install -r (Join-Path $projectRoot 'backend\requirements.txt')
if ($LASTEXITCODE -ne 0) {
    throw 'Could not install backend dependencies.'
}

& $venvPython manage.py migrate
if ($LASTEXITCODE -ne 0) {
    throw 'Database migrations failed.'
}

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    throw 'Node.js and npm are required. Install the current Node.js LTS release and try again.'
}

if (-not (Test-Path (Join-Path $projectRoot 'frontend\node_modules'))) {
    Push-Location (Join-Path $projectRoot 'frontend')
    try {
        & $npm.Source install
        if ($LASTEXITCODE -ne 0) {
            throw 'Could not install frontend dependencies.'
        }
    }
    finally {
        Pop-Location
    }
}

$scriptPath = $PSCommandPath.Replace("'", "''")
$backendCommand = "& '$scriptPath' -Backend"
$frontendCommand = "& '$scriptPath' -Frontend"
$backendEncoded = [Convert]::ToBase64String(
    [Text.Encoding]::Unicode.GetBytes($backendCommand)
)
$frontendEncoded = [Convert]::ToBase64String(
    [Text.Encoding]::Unicode.GetBytes($frontendCommand)
)
$powershellPath = Join-Path $PSHOME 'powershell.exe'

Start-Process -FilePath $powershellPath -ArgumentList @(
    '-NoExit', '-EncodedCommand', $backendEncoded
)
Start-Process -FilePath $powershellPath -ArgumentList @(
    '-NoExit', '-EncodedCommand', $frontendEncoded
)

$ready = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    try {
        $apiResponse = Invoke-WebRequest `
            -Uri 'http://127.0.0.1:8000/api/health/' `
            -TimeoutSec 2 `
            -UseBasicParsing
        $webResponse = Invoke-WebRequest `
            -Uri 'http://127.0.0.1:5173/' `
            -TimeoutSec 2 `
            -UseBasicParsing
        if ($apiResponse.StatusCode -eq 200 -and $webResponse.StatusCode -eq 200) {
            $ready = $true
            break
        }
    }
    catch {
        Start-Sleep -Milliseconds 750
    }
}

if (-not $ready) {
    throw 'FixIt did not start in time. Check the backend and frontend windows for errors.'
}

$url = 'http://127.0.0.1:5173/'
$chromePaths = @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:LOCALAPPDATA) |
    Where-Object { $_ } |
    ForEach-Object { Join-Path $_ 'Google\Chrome\Application\chrome.exe' }
$chrome = $chromePaths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if ($chrome) {
    Start-Process -FilePath $chrome -ArgumentList $url
}
else {
    Start-Process $url
    Write-Host 'Google Chrome was not found; opened the default browser instead.'
}

Write-Host "FixIt is running at $url"
Write-Host 'To stop it, press Ctrl+C in each server window.'
