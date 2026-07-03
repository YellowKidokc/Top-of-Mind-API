param(
    [string]$OutputDir = ".\dist"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$spkRoot = Join-Path $PSScriptRoot "spk"
$stage = Join-Path $PSScriptRoot ".spk-stage"
$packageName = "TopOfMindAPI-0.1.0-001.spk"

if (Test-Path $stage) {
    Remove-Item -Recurse -Force $stage
}
New-Item -ItemType Directory -Force $stage | Out-Null
New-Item -ItemType Directory -Force $OutputDir | Out-Null

Copy-Item (Join-Path $spkRoot "INFO") (Join-Path $stage "INFO")
New-Item -ItemType Directory -Force (Join-Path $stage "scripts") | Out-Null
Copy-Item (Join-Path $spkRoot "scripts\start-stop-status") (Join-Path $stage "scripts\start-stop-status")
New-Item -ItemType Directory -Force (Join-Path $stage "conf") | Out-Null
Copy-Item (Join-Path $spkRoot "conf\privilege") (Join-Path $stage "conf\privilege")

$packageStage = Join-Path $PSScriptRoot ".package-stage"
if (Test-Path $packageStage) {
    Remove-Item -Recurse -Force $packageStage
}
New-Item -ItemType Directory -Force $packageStage | Out-Null
New-Item -ItemType Directory -Force (Join-Path $packageStage "deploy\synology") | Out-Null
New-Item -ItemType Directory -Force (Join-Path $packageStage "apps") | Out-Null

Copy-Item -Recurse (Join-Path $root "apps\api") (Join-Path $packageStage "apps\api")
Copy-Item (Join-Path $PSScriptRoot "docker-compose.yml") (Join-Path $packageStage "deploy\synology\docker-compose.yml")
Copy-Item (Join-Path $PSScriptRoot "docker-compose.bundle.yml") (Join-Path $packageStage "deploy\synology\docker-compose.bundle.yml")
Copy-Item (Join-Path $PSScriptRoot ".env.example") (Join-Path $packageStage "deploy\synology\.env.example")
Copy-Item (Join-Path $PSScriptRoot "README.md") (Join-Path $packageStage "deploy\synology\README.md")
Copy-Item (Join-Path $PSScriptRoot "BUNDLE_README.md") (Join-Path $packageStage "deploy\synology\BUNDLE_README.md")
Copy-Item (Join-Path $PSScriptRoot "test_synology_hub.ps1") (Join-Path $packageStage "deploy\synology\test_synology_hub.ps1")

Push-Location $packageStage
try {
    tar -czf (Join-Path $stage "package.tgz") .
}
finally {
    Pop-Location
}

Push-Location $stage
try {
    tar -cf (Join-Path (Resolve-Path $OutputDir) $packageName) INFO conf scripts package.tgz
}
finally {
    Pop-Location
}

Write-Host "Built $OutputDir\$packageName"
