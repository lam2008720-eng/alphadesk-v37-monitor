[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$env:GIT_TERMINAL_PROMPT = '0'

$siteRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$snapshotPath = Join-Path $siteRoot 'public\dashboard-data.json'

if (-not (Test-Path -LiteralPath $snapshotPath -PathType Leaf)) {
    throw "Dashboard snapshot is missing: $snapshotPath"
}

# Validate the public payload before publishing. These are the only fields the
# dashboard requires; no account, Vault, API, order, or credential data belongs here.
$snapshot = Get-Content -LiteralPath $snapshotPath -Raw -Encoding UTF8 | ConvertFrom-Json
$requiredProperties = @(
    'generated_at', 'strategy', 'mode', 'promoted', 'eligible_for_promotion',
    'orders_submitted', 'historical', 'forward', 'cron', 'equity_curve', 'drawdown_curve'
)
foreach ($property in $requiredProperties) {
    if ($snapshot.PSObject.Properties.Name -notcontains $property) {
        throw "Dashboard snapshot validation failed: missing '$property'."
    }
}

$forbiddenPattern = '(?i)(api[_-]?key|secret|passphrase|password|private[_-]?key|access[_-]?token|wallet[_-]?address|uid)'
$rawSnapshot = Get-Content -LiteralPath $snapshotPath -Raw -Encoding UTF8
if ($rawSnapshot -match $forbiddenPattern) {
    throw 'Dashboard snapshot validation failed: possible sensitive field detected.'
}

Push-Location $siteRoot
try {
    $insideWorkTree = (& git rev-parse --is-inside-work-tree 2>$null)
    if ($LASTEXITCODE -ne 0 -or $insideWorkTree -ne 'true') {
        throw 'Dashboard directory is not a Git working tree.'
    }

    & git diff --quiet -- public/dashboard-data.json
    $trackedChanged = $LASTEXITCODE -ne 0
    & git diff --cached --quiet -- public/dashboard-data.json
    $stagedChanged = $LASTEXITCODE -ne 0
    if (-not $trackedChanged -and -not $stagedChanged) {
        Write-Output 'Dashboard snapshot is unchanged; nothing to publish.'
        exit 0
    }

    # Stage and commit exactly the sanitized snapshot. Unrelated local changes stay local.
    & git add -- public/dashboard-data.json
    if ($LASTEXITCODE -ne 0) { throw 'Unable to stage dashboard snapshot.' }

    $timestamp = [DateTime]::UtcNow.ToString('yyyy-MM-dd HH:mm:ss')
    & git commit --only -m "Update dashboard snapshot ($timestamp UTC)" -- public/dashboard-data.json
    if ($LASTEXITCODE -ne 0) { throw 'Unable to commit dashboard snapshot.' }

    & git push origin main
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to push dashboard snapshot. GitHub authentication may need renewal.'
    }
    Write-Output 'Dashboard snapshot pushed; GitHub Pages deployment has started.'
}
finally {
    Pop-Location
}
