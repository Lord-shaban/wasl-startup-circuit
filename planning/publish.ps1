param(
  [ValidateSet('Metadata','Issues','Dependencies','CloseM0')]
  [string]$Phase
)

$ErrorActionPreference = 'Stop'
$repo = 'Lord-shaban/wasl-startup-circuit'
$apiBase = "https://api.github.com/repos/$repo"
$env:GCM_INTERACTIVE = 'never'
$credential = "protocol=https`nhost=github.com`n`n" | git credential fill 2>$null
$token = (($credential | Where-Object { $_ -like 'password=*' } | Select-Object -First 1) -replace '^password=', '')
if (-not $token) { throw 'GitHub credential not available' }
$headers = @{
  Authorization = "Bearer $token"
  Accept = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2026-03-10'
  'User-Agent' = 'wasl-planning'
}

function Call-GitHub([string]$Method, [string]$Path, $Body = $null) {
  $params = @{ Method = $Method; Uri = "$apiBase$Path"; Headers = $headers; ErrorAction = 'Stop' }
  if ($null -ne $Body) {
    $params['ContentType'] = 'application/json; charset=utf-8'
    $params['Body'] = ConvertTo-Json -InputObject $Body -Depth 12 -Compress
  }
  $response = Invoke-RestMethod @params
  if ($response -is [array]) {
    foreach ($item in $response) { Write-Output $item }
  } elseif ($null -ne $response) {
    Write-Output $response
  }
}

$rows = Import-Csv -LiteralPath (Join-Path $PSScriptRoot 'issues.tsv') -Delimiter '|'
$milestones = @(
  @{key='M0'; title='M0 — Research & planning'; description='Research, concept, architecture, art direction and a complete GitHub-first roadmap.'},
  @{key='M1'; title='M1 — Web foundation'; description='Arabic web shell, deterministic simulation base, rendering shell and CI.'},
  @{key='M2'; title='M2 — Interaction prototype'; description='The first mouse-only opportunity, placement, processing and referral chain; fun gate.'},
  @{key='M3'; title='M3 — Playable round'; description='Economy, pressure, win/failure and replay; first public playable build.'},
  @{key='M4'; title='M4 — Builds & automation'; description='Upgrade branches, placement synergies, automated routing and balance.'},
  @{key='M5'; title='M5 — Phases & feel'; description='Later phases, original art and audio, readable escalation.'},
  @{key='M6'; title='M6 — Alpha & optimization'; description='Performance, save resilience, browser compatibility and alpha QA.'},
  @{key='M7'; title='M7 — Beta & release'; description='External playtest, polish, stable deployment and release documentation.'}
)

if ($Phase -eq 'Metadata') {
  $colors = @{
    gameplay='F4995C'; design='C478C7'; art='AE91ED'; 'ui-ux'='6DC8F6'; audio='DCA66F';
    technical='4A90E2'; performance='28A69A'; bug='D73A4A'; testing='B7C66A';
    documentation='7A8696'; localization='7AC3D4'; 'high-priority'='E26569';
    'priority:P0'='D73A4A'; 'priority:P1'='F0AD4E'; 'priority:P2'='7DBE80'
  }
  $existing = @(Call-GitHub GET '/labels?per_page=100' | ForEach-Object { $_.name })
  foreach ($label in $colors.Keys) {
    if ($label -notin $existing) {
      $null = Call-GitHub POST '/labels' @{name=$label;color=$colors[$label];description="Wasl roadmap: $label"}
    }
  }
  $allMilestones = @(Call-GitHub GET '/milestones?state=all&per_page=100')
  foreach ($m in $milestones) {
    if ($m.title -notin @($allMilestones | ForEach-Object { $_.title })) {
      $null = Call-GitHub POST '/milestones' @{title=$m.title;description=$m.description}
    }
  }
  Write-Output "Metadata complete: $($colors.Count) labels, $($milestones.Count) milestones."
  exit
}

$allMilestones = @(Call-GitHub GET '/milestones?state=all&per_page=100')
$milestoneNumbers = @{}
foreach ($m in $milestones) {
  $match = $allMilestones | Where-Object title -eq $m.title | Select-Object -First 1
  if (-not $match) { throw "Missing milestone $($m.title)" }
  $milestoneNumbers[$m.key] = $match.number
}
$existingIssues = @(Call-GitHub GET '/issues?state=all&per_page=100')
$issueMap = @{}
foreach ($row in $rows) {
  $prefix = "[$($row.id)] "
  $match = $existingIssues | Where-Object { $_.title.StartsWith($prefix) } | Select-Object -First 1
  if ($match) { $issueMap[$row.id] = $match }
}

function Issue-Body($row, $map) {
  $dependencies = @($row.deps -split ',' | Where-Object { $_ })
  $dependencyText = if ($dependencies.Count -eq 0) { 'None.' } else {
    ($dependencies | ForEach-Object {
      if ($map.ContainsKey($_)) { "- #$($map[$_].number) ($_)" }
      else { "- $_" }
    }) -join "`n"
  }
  $doc = if ($row.labels -match 'technical|performance|testing') { 'docs/technical-design.md' } elseif ($row.labels -match 'art|audio') { 'docs/art-bible.md' } else { 'docs/game-design.md' }
  @"
## Objective
$($row.goal)

## Why this exists
$($row.why)

## Scope
$($row.scope)

## Acceptance criteria
- $($row.acceptance)

## Dependencies
$dependencyText

## Technical notes
See [$doc](https://github.com/$repo/blob/main/$doc). Document any rule or scope change before expanding implementation.

## Required testing
- $($row.test)

**Priority:** $($row.priority) · **Tracking ID:** $($row.id)
"@
}

if ($Phase -eq 'Issues') {
  foreach ($row in $rows) {
    if ($issueMap.ContainsKey($row.id)) { continue }
    $key = $row.id.Split('.')[0]
    $labels = @($row.labels -split ',') + @("priority:$($row.priority)")
    if ($row.priority -eq 'P0') { $labels += 'high-priority' }
    $issue = Call-GitHub POST '/issues' @{
      title="[$($row.id)] $($row.title)"
      body=(Issue-Body $row $issueMap)
      milestone=$milestoneNumbers[$key]
      labels=$labels
    }
    $issueMap[$row.id] = $issue
    Write-Output "Created #$($issue.number) $($row.id)"
    Start-Sleep -Milliseconds 350
  }
  foreach ($row in $rows) {
    $issue = $issueMap[$row.id]
    $labels = @($row.labels -split ',') + @("priority:$($row.priority)")
    if ($row.priority -eq 'P0') { $labels += 'high-priority' }
    $null = Call-GitHub PATCH "/issues/$($issue.number)" @{
      title="[$($row.id)] $($row.title)"
      body=(Issue-Body $row $issueMap)
      milestone=$milestoneNumbers[$row.id.Split('.')[0]]
      labels=$labels
    }
  }
  Write-Output "Issues complete: $($issueMap.Count)."
  exit
}

if ($Phase -eq 'Dependencies') {
  foreach ($row in $rows) {
    $issue = $issueMap[$row.id]
    foreach ($dep in @($row.deps -split ',' | Where-Object { $_ })) {
      $blocker = $issueMap[$dep]
      $already = @(Call-GitHub GET "/issues/$($issue.number)/dependencies/blocked_by?per_page=100")
      if ($blocker.id -notin @($already | ForEach-Object { $_.id })) {
        $null = Call-GitHub POST "/issues/$($issue.number)/dependencies/blocked_by" @{issue_id=$blocker.id}
      }
      Start-Sleep -Milliseconds 350
    }
  }
  Write-Output 'Native GitHub issue dependencies complete.'
  exit
}

if ($Phase -eq 'CloseM0') {
  foreach ($row in @($rows | Where-Object { $_.id -like 'M0.*' })) {
    $issue = $issueMap[$row.id]
    if ($issue.state -ne 'closed') { $null = Call-GitHub PATCH "/issues/$($issue.number)" @{state='closed';state_reason='completed'} }
  }
  Write-Output 'M0 closed.'
}
