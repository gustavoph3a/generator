# Re-download Stitch screens for PH3A Studio v2.
# Usage: $env:STITCH_API_KEY = "..." ; .\ph3a\scripts\fetch-stitch-layout.ps1

$ErrorActionPreference = "Stop"
$Ph3a = Split-Path $PSScriptRoot -Parent
$Root = Split-Path $Ph3a -Parent
$OutDir = Join-Path $Ph3a "layout\stitch"
$Meta = Get-Content (Join-Path $Ph3a ".stitch-project.json") -Raw | ConvertFrom-Json

$key = $env:STITCH_API_KEY
if (-not $key) {
    Write-Error "Defina STITCH_API_KEY no ambiente (nao commitar a chave)."
}

$mcpUrl = $Meta.mcpUrl
$projectId = $Meta.projectId

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Invoke-StitchMcp($method, $params) {
    $body = @{
        jsonrpc = "2.0"
        id      = 1
        method  = $method
        params  = $params
    } | ConvertTo-Json -Depth 10 -Compress

    $headers = @{
        "Content-Type"   = "application/json"
        "X-Goog-Api-Key" = $key
    }

    $resp = Invoke-RestMethod -Uri $mcpUrl -Method Post -Headers $headers -Body $body
    if ($resp.error) {
        throw "MCP error: $($resp.error.message)"
    }
    return $resp.result
}

Write-Host "Projeto Stitch: $($Meta.name) ($projectId)"
Write-Host "Destino: $OutDir"

$manifest = @()
foreach ($screen in $Meta.screens) {
    $slug = $screen.slug
    $screenId = $screen.screenId
    Write-Host "  Baixando $slug ..."

    $result = Invoke-StitchMcp "tools/call", @{
        name = "get_screen"
        arguments = @{
            projectId = $projectId
            screenId  = $screenId
        }
    }

    $htmlPath = Join-Path $OutDir "$slug.html"
    $content = $result.content
    if ($content -is [array]) {
        foreach ($part in $content) {
            if ($part.type -eq "text" -and $part.text -match "<!DOCTYPE|<html") {
                Set-Content -Path $htmlPath -Value $part.text -Encoding UTF8
            }
        }
    } elseif ($content -is [string]) {
        Set-Content -Path $htmlPath -Value $content -Encoding UTF8
    }

    $manifest += [ordered]@{
        title    = "$slug"
        slug     = $slug
        screenId = $screenId
    }
}

$manifest | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $OutDir "manifest.json") -Encoding UTF8
Write-Host "Concluido. Veja preview.html"
