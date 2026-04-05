param(
  [string]$SourcePath = 'C:\Users\JV\Downloads\ireside-system-erd.drawio.xml',
  [string]$FallbackSourcePath = 'C:\Users\JV\Documents\GitHub\iReside\docs\erd\ireside-system-erd.drawio',
  [string]$OutputPath = 'C:\Users\JV\Documents\GitHub\iReside\docs\erd\ireside-system-erd-clean.html'
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Web

function Clean-Text {
  param([string]$Value)

  if ($null -eq $Value) {
    return ''
  }

  return [System.Web.HttpUtility]::HtmlDecode(($Value -replace '<[^>]+>', '')).Trim()
}

function Normalize-FieldName {
  param([string]$Value)

  switch ($Value) {
    'business name' { return 'business_name' }
    default { return $Value }
  }
}

function Normalize-TableName {
  param(
    [string]$Value,
    [object[]]$Rows = @()
  )

  switch ($Value) {
    'communuity_posts' { return 'community_posts' }
    'content_report' { return 'content_reports' }
    'messages' {
      $fields = @($Rows | ForEach-Object { $_.field })
      if ($fields -contains 'reporter_user_id' -and $fields -contains 'target_user_id') {
        return 'message_user_reports'
      }

      return 'messages'
    }
    default { return $Value }
  }
}

function Has-StyleToken {
  param(
    $Cell,
    [string]$Token
  )

  if (-not $Cell -or -not $Cell.style) {
    return $false
  }

  return $Cell.style -match "(^|;)$([regex]::Escape($Token))(;|$)"
}

function Get-Children {
  param(
    [hashtable]$ChildrenMap,
    [string]$Id
  )

  if ($ChildrenMap.ContainsKey($Id)) {
    return $ChildrenMap[$Id]
  }

  return @()
}

function Get-TableAncestor {
  param(
    [hashtable]$CellsById,
    [string]$CellId
  )

  $current = $CellsById[$CellId]

  while ($current) {
    if ($current.vertex -eq '1' -and (Has-StyleToken $current 'shape=table')) {
      return $current
    }

    if (-not $current.parent) {
      break
    }

    $current = $CellsById[$current.parent]
  }

  return $null
}

function Get-FieldName {
  param(
    [hashtable]$CellsById,
    [hashtable]$ChildrenMap,
    [string]$CellId
  )

  $current = $CellsById[$CellId]

  while ($current) {
    if ($current.vertex -eq '1' -and (Has-StyleToken $current 'shape=tableRow')) {
      foreach ($part in (Get-Children -ChildrenMap $ChildrenMap -Id $current.id)) {
        if (Has-StyleToken $part 'align=left') {
          return (Normalize-FieldName (Clean-Text $part.value))
        }
      }

      return ''
    }

    if (-not $current.parent) {
      break
    }

    $current = $CellsById[$current.parent]
  }

  return ''
}

function Get-Domain {
  param([string]$TableName)

  switch -Regex ($TableName) {
    '^(auth\.users|profiles|tenant_product_tour_states|tenant_product_tour_events|notifications|iris_chat_messages|landlord_statistics_exports)$' { return 'Identity + Insights' }
    '^(properties|units)$' { return 'Inventory' }
    '^(applications|leases|lease_signing_audit|payments|payment_items|move_out_requests|unit_transfer_requests|maintenance_requests)$' { return 'Leasing + Operations' }
    '^(conversations|conversation_participants|messages|message_user_actions|message_user_reports)$' { return 'Messaging' }
    '^(communuity_posts|community_posts|community_comments|community_reactions|community_poll_votes|content_report|content_reports|community_albums|community_photos|post_views)$' { return 'Community' }
    default { return 'Other' }
  }
}

function Get-DomainColor {
  param([string]$Domain)

  switch ($Domain) {
    'Identity + Insights' { return '#1d4ed8' }
    'Inventory' { return '#0f766e' }
    'Leasing + Operations' { return '#b45309' }
    'Messaging' { return '#7c3aed' }
    'Community' { return '#be123c' }
    default { return '#475569' }
  }
}

function Escape-Json {
  param([string]$Value)
  return [System.Web.HttpUtility]::JavaScriptStringEncode($Value)
}

$resolvedSource = if (Test-Path -LiteralPath $SourcePath) { $SourcePath } else { $FallbackSourcePath }

if (-not (Test-Path -LiteralPath $resolvedSource)) {
  throw "Could not find Draw.io source at '$SourcePath' or fallback '$FallbackSourcePath'."
}

[xml]$xml = Get-Content -LiteralPath $resolvedSource -Raw
$diagramNodes = @($xml.mxfile.diagram)
$diagramNode = $diagramNodes | Where-Object { $_.name -eq 'iReside System ERD' } | Select-Object -First 1

if (-not $diagramNode) {
  $diagramNode = $diagramNodes | Select-Object -First 1
}

$allCells = @($diagramNode.mxGraphModel.root.mxCell)

$cellsById = @{}
$childrenMap = @{}

foreach ($cell in $allCells) {
  $cellsById[$cell.id] = $cell

  if ($cell.parent) {
    if (-not $childrenMap.ContainsKey($cell.parent)) {
      $childrenMap[$cell.parent] = [System.Collections.ArrayList]::new()
    }

    [void]$childrenMap[$cell.parent].Add($cell)
  }
}

$tables = [System.Collections.ArrayList]::new()

foreach ($cell in $allCells) {
  if ($cell.vertex -ne '1' -or -not (Has-StyleToken $cell 'shape=table')) {
    continue
  }

  $rows = [System.Collections.ArrayList]::new()

  foreach ($row in (Get-Children -ChildrenMap $childrenMap -Id $cell.id)) {
    if ($row.vertex -ne '1' -or -not (Has-StyleToken $row 'shape=tableRow')) {
      continue
    }

    $flag = ''
    $field = ''

    foreach ($part in (Get-Children -ChildrenMap $childrenMap -Id $row.id)) {
      $text = Clean-Text $part.value

      if (-not $text) {
        continue
      }

      if (Has-StyleToken $part 'align=left') {
        $field = Normalize-FieldName $text
        continue
      }

      if ($text -match '^(PK|FK|PK, FK)$') {
        $flag = $text
      }
    }

    if ($field) {
      [void]$rows.Add([pscustomobject]@{
        field = $field
        flag  = $flag
      })
    }
  }

  $name = Normalize-TableName -Value (Clean-Text $cell.value) -Rows @($rows)
  [void]$tables.Add([pscustomobject]@{
    id     = $cell.id
    name   = $name
    domain = Get-Domain $name
    color  = Get-DomainColor (Get-Domain $name)
    rows   = @($rows)
  })
}

$relationships = [System.Collections.ArrayList]::new()

foreach ($cell in $allCells) {
  if ($cell.edge -ne '1' -or -not $cell.source -or -not $cell.target) {
    continue
  }

  $fromTableCell = Get-TableAncestor -CellsById $cellsById -CellId $cell.source
  $toTableCell = Get-TableAncestor -CellsById $cellsById -CellId $cell.target

  if (-not $fromTableCell -or -not $toTableCell) {
    continue
  }

  $fromTable = Normalize-TableName -Value (Clean-Text $fromTableCell.value)
  $toTable = Normalize-TableName -Value (Clean-Text $toTableCell.value)

  [void]$relationships.Add([pscustomobject]@{
    fromTable = $fromTable
    fromField = Get-FieldName -CellsById $cellsById -ChildrenMap $childrenMap -CellId $cell.source
    toTable   = $toTable
    toField   = Get-FieldName -CellsById $cellsById -ChildrenMap $childrenMap -CellId $cell.target
    label     = Clean-Text $cell.value
  })
}

$relationships = @(
  $relationships |
    Group-Object fromTable, fromField, toTable, toField, label |
    ForEach-Object { $_.Group[0] }
)

$domainOrder = @(
  'Identity + Insights',
  'Inventory',
  'Leasing + Operations',
  'Messaging',
  'Community',
  'Other'
)

$columnX = @{
  'Identity + Insights' = 60
  'Inventory'           = 420
  'Leasing + Operations'= 780
  'Messaging'           = 1140
  'Community'           = 1500
  'Other'               = 1860
}

$cardWidth = 300
$rowHeight = 28
$headerHeight = 56
$cardGap = 28
$boardPaddingTop = 90
$domainTitleHeight = 30

$layoutLookup = @{}
$domainLabels = [System.Collections.ArrayList]::new()
$maxY = 0

foreach ($domain in $domainOrder) {
  $domainTables = @($tables | Where-Object { $_.domain -eq $domain } | Sort-Object name)

  if (-not $domainTables.Count) {
    continue
  }

  $currentY = $boardPaddingTop + $domainTitleHeight
  $x = $columnX[$domain]

  [void]$domainLabels.Add([pscustomobject]@{
    domain = $domain
    x = $x
    y = 28
    width = $cardWidth
  })

  foreach ($table in $domainTables) {
    $height = $headerHeight + ([Math]::Max($table.rows.Count, 1) * $rowHeight)

    $layoutLookup[$table.name] = [pscustomobject]@{
      x      = $x
      y      = $currentY
      width  = $cardWidth
      height = $height
    }

    $currentY += $height + $cardGap
    if ($currentY -lt $maxY) {
      continue
    }

    $maxY = $currentY
  }
}

$boardWidth = 2160
$boardHeight = [Math]::Max($maxY + 60, 1200)

$cardsJson = @()
foreach ($table in ($tables | Sort-Object domain, name)) {
  $layout = $layoutLookup[$table.name]
  if (-not $layout) {
    continue
  }

  $rowsJson = @()
  foreach ($row in $table.rows) {
    $rowsJson += "{""field"":""$(Escape-Json $row.field)"",""flag"":""$(Escape-Json $row.flag)""}"
  }

  $cardsJson += @"
{"name":"$(Escape-Json $table.name)","domain":"$(Escape-Json $table.domain)","color":"$(Escape-Json $table.color)","x":$($layout.x),"y":$($layout.y),"width":$($layout.width),"height":$($layout.height),"rows":[$([string]::Join(',', $rowsJson))]}
"@
}

$linksJson = @()
foreach ($relationship in $relationships) {
  $linksJson += @"
{"fromTable":"$(Escape-Json $relationship.fromTable)","fromField":"$(Escape-Json $relationship.fromField)","toTable":"$(Escape-Json $relationship.toTable)","toField":"$(Escape-Json $relationship.toField)","label":"$(Escape-Json $relationship.label)"}
"@
}

$domainLabelHtml = [string]::Join("`n", (
  $domainLabels | ForEach-Object {
    "<div class=""domain-label"" style=""left:$($_.x)px; top:$($_.y)px; width:$($_.width)px;"">$($_.domain)</div>"
  }
))

$presentDomains = @($tables | Select-Object -ExpandProperty domain -Unique)
$legendHtml = [string]::Join("`n", (
  ($domainOrder | Where-Object { $presentDomains -contains $_ }) | ForEach-Object {
    $color = Get-DomainColor $_
    "<span class=""legend-item""><span class=""legend-swatch"" style=""background:$color;""></span>$($_)</span>"
  }
))

$html = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>iReside System ERD</title>
  <style>
    :root {
      --bg: #f4efe6;
      --paper: #fffdfa;
      --ink: #1f2937;
      --muted: #667085;
      --line: rgba(15, 23, 42, 0.14);
      --shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
      --card-shadow: 0 18px 42px rgba(15, 23, 42, 0.10);
      --accent: #0f766e;
      --link: rgba(15, 23, 42, 0.18);
      --link-active: rgba(15, 23, 42, 0.62);
      --chip: rgba(255, 255, 255, 0.82);
      --chip-border: rgba(15, 23, 42, 0.08);
      font-family: "Segoe UI", "Aptos", "Helvetica Neue", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(13, 148, 136, 0.10), transparent 28%),
        radial-gradient(circle at top right, rgba(29, 78, 216, 0.10), transparent 30%),
        linear-gradient(180deg, #fcfaf6 0%, var(--bg) 100%);
    }

    .page {
      padding: 28px;
    }

    .hero {
      max-width: 1280px;
      margin: 0 auto 18px;
      padding: 28px 30px;
      border: 1px solid rgba(15, 23, 42, 0.06);
      border-radius: 24px;
      background: rgba(255, 253, 250, 0.88);
      box-shadow: var(--shadow);
      backdrop-filter: blur(8px);
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border-radius: 999px;
      border: 1px solid rgba(15, 23, 42, 0.08);
      background: rgba(255, 255, 255, 0.72);
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }

    h1 {
      margin: 16px 0 10px;
      font-size: clamp(2rem, 3vw, 3.1rem);
      line-height: 1.03;
      letter-spacing: -0.04em;
    }

    .subtitle {
      max-width: 72ch;
      margin: 0;
      color: #475467;
      font-size: 15px;
      line-height: 1.6;
    }

    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 18px;
    }

    .stat {
      min-width: 140px;
      padding: 12px 14px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.88);
      border: 1px solid rgba(15, 23, 42, 0.07);
    }

    .stat strong {
      display: block;
      font-size: 1.25rem;
      letter-spacing: -0.03em;
    }

    .stat span {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .toolbar {
      max-width: 1280px;
      margin: 0 auto 18px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.84);
      border: 1px solid rgba(15, 23, 42, 0.08);
      font-size: 12px;
      color: #475467;
    }

    .legend-swatch {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      display: inline-block;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.84);
    }

    .controls {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .controls input {
      width: min(320px, 78vw);
      padding: 11px 14px;
      border-radius: 999px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255, 255, 255, 0.9);
      font: inherit;
      color: inherit;
    }

    .hint {
      color: var(--muted);
      font-size: 13px;
    }

    .board-shell {
      max-width: 100%;
      overflow: auto;
      border-radius: 30px;
      border: 1px solid rgba(15, 23, 42, 0.08);
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.82)),
        linear-gradient(90deg, rgba(15, 23, 42, 0.03) 1px, transparent 1px),
        linear-gradient(rgba(15, 23, 42, 0.03) 1px, transparent 1px);
      background-size: auto, 24px 24px, 24px 24px;
      box-shadow: var(--shadow);
    }

    .board {
      position: relative;
      width: ${boardWidth}px;
      height: ${boardHeight}px;
      margin: 0 auto;
    }

    .domain-group {
      position: absolute;
      z-index: 0;
      border-radius: 26px;
      border: 1px solid rgba(15, 23, 42, 0.08);
      background: linear-gradient(180deg, rgba(255, 253, 250, 0.76), rgba(255, 255, 255, 0.48));
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
    }

    .domain-label {
      position: absolute;
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(255, 253, 250, 0.92);
      border: 1px solid rgba(15, 23, 42, 0.08);
      color: #344054;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
    }

    svg.links {
      position: absolute;
      inset: 0;
      z-index: 1;
      overflow: visible;
    }

    .link-path {
      fill: none;
      stroke: var(--link);
      stroke-width: 2;
      transition: opacity 160ms ease, stroke 160ms ease, stroke-width 160ms ease;
    }

    .link-label {
      font-size: 11px;
      fill: #667085;
      paint-order: stroke;
      stroke: rgba(255, 253, 250, 0.95);
      stroke-width: 5px;
      stroke-linejoin: round;
    }

    .card {
      position: absolute;
      z-index: 2;
      overflow: hidden;
      border-radius: 22px;
      background: rgba(255, 253, 250, 0.96);
      border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: var(--card-shadow);
      transition: transform 180ms ease, box-shadow 180ms ease, opacity 160ms ease, filter 160ms ease;
      cursor: pointer;
    }

    .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 22px 48px rgba(15, 23, 42, 0.14);
    }

    .card-header {
      padding: 14px 16px 12px;
      color: white;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.12), rgba(255, 255, 255, 0)) var(--card-color);
    }

    .card-domain {
      display: inline-flex;
      margin-bottom: 8px;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.16);
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .card-title {
      margin: 0;
      font-size: 1rem;
      line-height: 1.25;
      letter-spacing: -0.02em;
      word-break: break-word;
    }

    .card-body {
      padding: 10px 12px 12px;
    }

    .row {
      display: grid;
      grid-template-columns: 54px 1fr;
      gap: 10px;
      align-items: center;
      min-height: 28px;
      padding: 6px 8px;
      border-radius: 12px;
    }

    .row:nth-child(odd) {
      background: rgba(15, 23, 42, 0.025);
    }

    .row-flag {
      min-width: 46px;
      padding: 3px 7px;
      border-radius: 999px;
      background: var(--chip);
      border: 1px solid var(--chip-border);
      color: #475467;
      font-size: 10px;
      text-align: center;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .row-flag.empty {
      opacity: 0;
    }

    .row-name {
      font-size: 12px;
      color: #101828;
      overflow-wrap: anywhere;
    }

    .row.is-key .row-name {
      font-weight: 700;
    }

    .card.is-selected,
    .card.is-related {
      opacity: 1;
      filter: none;
    }

    .board.has-selection .card:not(.is-selected):not(.is-related) {
      opacity: 0.26;
      filter: grayscale(0.2);
    }

    .board.has-selection .link-path,
    .board.has-selection .link-label {
      opacity: 0.12;
    }

    .link-path.is-active {
      opacity: 1 !important;
      stroke: var(--link-active);
      stroke-width: 3;
    }

    .link-label.is-active {
      opacity: 1 !important;
      fill: #111827;
      font-weight: 700;
    }

    @media (max-width: 900px) {
      .page {
        padding: 18px;
      }

      .hero {
        padding: 22px 20px;
        border-radius: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <div class="eyebrow">Standalone HTML ERD</div>
      <h1>iReside System ERD</h1>
      <p class="subtitle">
        A cleaned-up HTML version of the Draw.io schema grouped by domain so the major flows are easier to follow.
        Links are routed orthogonally through open gaps between tables so distant relationships stay readable.
        Click any table to focus its connected relationships, or use search to jump around faster.
      </p>
      <div class="stats">
        <div class="stat"><strong>$($tables.Count)</strong><span>Tables</span></div>
        <div class="stat"><strong>$($relationships.Count)</strong><span>Relationships</span></div>
        <div class="stat"><strong>$([System.IO.Path]::GetFileName($resolvedSource))</strong><span>Source</span></div>
      </div>
    </section>

    <div class="toolbar">
      <div class="legend">
        $legendHtml
      </div>
      <div class="controls">
        <input id="table-search" type="search" placeholder="Search tables or fields" aria-label="Search tables or fields" />
        <span class="hint">Click a table to isolate its routed links.</span>
      </div>
    </div>

    <div class="board-shell">
      <div class="board" id="erd-board">
        $domainLabelHtml
        <svg class="links" id="erd-links" width="$boardWidth" height="$boardHeight" viewBox="0 0 $boardWidth $boardHeight" aria-hidden="true"></svg>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/elkjs@0.9.3/lib/elk.bundled.js"></script>
  <script>
    const cards = [$([string]::Join(",`n", $cardsJson))];
    const links = [$([string]::Join(",`n", $linksJson))];
    const board = document.getElementById('erd-board');
    const svg = document.getElementById('erd-links');
    const search = document.getElementById('table-search');
    const hint = document.querySelector('.hint');

    const domainOrder = [...new Set(cards.map(card => card.domain))];
    const domainRank = new Map(domainOrder.map((domain, index) => [domain, index]));
    const cardRank = new Map(cards.map((card, index) => [card.name, index]));
    const cardEls = new Map();
    const linkEls = [];
    const elk = typeof ELK !== 'undefined' ? new ELK() : null;

    function el(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function portId(tableName, side, slot) {
      return tableName + ':' + side + ':' + slot;
    }

    function choosePortSides(source, target) {
      const sourceDomain = domainRank.get(source.domain);
      const targetDomain = domainRank.get(target.domain);
      if (sourceDomain < targetDomain) return { sourceSide: 'EAST', targetSide: 'WEST' };
      if (sourceDomain > targetDomain) return { sourceSide: 'WEST', targetSide: 'EAST' };
      return cardRank.get(source.name) <= cardRank.get(target.name)
        ? { sourceSide: 'SOUTH', targetSide: 'NORTH' }
        : { sourceSide: 'NORTH', targetSide: 'SOUTH' };
    }

    function buildGraphModel() {
      const nodeMeta = new Map(cards.map(card => [card.name, { ...card, sideCounts: { WEST: 0, EAST: 0, NORTH: 0, SOUTH: 0 } }]));
      const slotUsage = new Map();

      function takeSlot(tableName, side) {
        const key = tableName + ':' + side;
        const current = slotUsage.get(key) || 0;
        slotUsage.set(key, current + 1);
        return current;
      }

      const edgeModels = links.map((link, index) => {
        const source = nodeMeta.get(link.fromTable);
        const target = nodeMeta.get(link.toTable);
        const sides = choosePortSides(source, target);
        const sourceSlot = takeSlot(link.fromTable, sides.sourceSide);
        const targetSlot = takeSlot(link.toTable, sides.targetSide);
        source.sideCounts[sides.sourceSide] = Math.max(source.sideCounts[sides.sourceSide], sourceSlot + 1);
        target.sideCounts[sides.targetSide] = Math.max(target.sideCounts[sides.targetSide], targetSlot + 1);
        return {
          id: 'edge-' + index,
          sources: [portId(link.fromTable, sides.sourceSide, sourceSlot)],
          targets: [portId(link.toTable, sides.targetSide, targetSlot)],
          meta: link,
        };
      });

      const groupModels = domainOrder.map(domain => {
        const children = cards
          .filter(card => card.domain === domain)
          .map(card => {
            const meta = nodeMeta.get(card.name);
            const ports = [];
            for (const side of ['WEST', 'EAST', 'NORTH', 'SOUTH']) {
              const count = Math.max(meta.sideCounts[side], 1);
              for (let slot = 0; slot < count; slot += 1) {
                ports.push({
                  id: portId(card.name, side, slot),
                  width: 4,
                  height: 4,
                  layoutOptions: { 'org.eclipse.elk.port.side': side },
                });
              }
            }
            return {
              id: card.name,
              width: card.width,
              height: card.height,
              ports,
              meta: card,
              layoutOptions: {
                'org.eclipse.elk.portConstraints': 'FIXED_ORDER',
              },
            };
          });

        return {
          id: 'group:' + domain,
          meta: { domain },
          children,
          layoutOptions: {
            'elk.algorithm': 'box',
            'elk.direction': 'DOWN',
            'org.eclipse.elk.spacing.nodeNode': '18',
            'org.eclipse.elk.padding': '[top=54,left=18,bottom=18,right=18]',
          },
        };
      });

      return {
        id: 'root',
        children: groupModels,
        edges: edgeModels,
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'RIGHT',
          'org.eclipse.elk.hierarchyHandling': 'INCLUDE_CHILDREN',
          'org.eclipse.elk.edgeRouting': 'ORTHOGONAL',
          'org.eclipse.elk.layered.mergeEdges': 'false',
          'org.eclipse.elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
          'org.eclipse.elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
          'org.eclipse.elk.spacing.nodeNode': '24',
          'org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers': '52',
          'org.eclipse.elk.spacing.edgeNode': '14',
          'org.eclipse.elk.spacing.edgeEdge': '10',
          'org.eclipse.elk.padding': '[top=52,left=24,bottom=24,right=24]',
        },
      };
    }

    function clearBoard() {
      for (const cardEl of cardEls.values()) cardEl.remove();
      cardEls.clear();
      linkEls.length = 0;
      svg.replaceChildren();
      board.querySelectorAll('.domain-group').forEach(node => node.remove());
      board.querySelectorAll('.domain-label').forEach(node => node.remove());
    }

    function collectCardNodes(nodes, offsetX = 0, offsetY = 0, bucket = []) {
      for (const node of nodes || []) {
        const absoluteX = (node.x || 0) + offsetX;
        const absoluteY = (node.y || 0) + offsetY;
        if (cards.some(card => card.name === node.id)) {
          bucket.push({
            ...node,
            x: absoluteX,
            y: absoluteY,
            meta: cards.find(card => card.name === node.id),
          });
        }
        collectCardNodes(node.children, absoluteX, absoluteY, bucket);
      }
      return bucket;
    }

    function collectDomainGroups(nodes, offsetX = 0, offsetY = 0, bucket = []) {
      for (const node of nodes || []) {
        const absoluteX = (node.x || 0) + offsetX;
        const absoluteY = (node.y || 0) + offsetY;
        if (String(node.id || '').startsWith('group:')) {
          bucket.push({
            ...node,
            x: absoluteX,
            y: absoluteY,
            meta: { domain: String(node.id).replace(/^group:/, '') },
          });
        }
        collectDomainGroups(node.children, absoluteX, absoluteY, bucket);
      }
      return bucket;
    }

    function renderCards(positionedNodes) {
      for (const node of positionedNodes) {
        const card = node.meta;
        const cardEl = el('article', 'card');
        cardEl.dataset.table = card.name;
        cardEl.style.left = node.x + 'px';
        cardEl.style.top = node.y + 'px';
        cardEl.style.width = card.width + 'px';
        cardEl.style.height = card.height + 'px';
        cardEl.style.setProperty('--card-color', card.color);

        const header = el('div', 'card-header');
        header.append(el('div', 'card-domain', card.domain), el('h2', 'card-title', card.name));

        const body = el('div', 'card-body');
        for (const row of card.rows) {
          const rowEl = el('div', 'row');
          if (row.flag.includes('PK') || row.flag.includes('FK')) rowEl.classList.add('is-key');
          const flag = el('span', 'row-flag', row.flag || ' ');
          if (!row.flag) flag.classList.add('empty');
          rowEl.append(flag, el('span', 'row-name', row.field));
          body.append(rowEl);
        }

        cardEl.append(header, body);
        board.append(cardEl);
        cardEls.set(card.name, cardEl);
      }
    }

    function renderDomainLabels(domainGroups) {
      for (const group of domainGroups) {
        const panel = el('div', 'domain-group');
        panel.style.left = group.x + 'px';
        panel.style.top = group.y + 'px';
        panel.style.width = group.width + 'px';
        panel.style.height = group.height + 'px';
        board.append(panel);

        const label = el('div', 'domain-label', group.meta.domain);
        label.style.left = group.x + 16 + 'px';
        label.style.top = group.y + 12 + 'px';
        label.style.width = Math.max(group.width - 32, 120) + 'px';
        board.append(label);
      }
    }

    function fallbackDomainGroups() {
      const grouped = new Map();
      for (const card of cards) {
        const current = grouped.get(card.domain);
        const right = card.x + card.width;
        const bottom = card.y + card.height;
        if (!current) {
          grouped.set(card.domain, {
            meta: { domain: card.domain },
            x: Math.max(card.x - 18, 0),
            y: Math.max(card.y - 54, 0),
            width: card.width + 36,
            height: card.height + 72,
          });
          continue;
        }

        current.x = Math.min(current.x, Math.max(card.x - 18, 0));
        current.y = Math.min(current.y, Math.max(card.y - 54, 0));
        current.width = Math.max(current.width, right - current.x + 18);
        current.height = Math.max(current.height, bottom - current.y + 18);
      }

      return domainOrder
        .map(domain => grouped.get(domain))
        .filter(Boolean);
    }

    function buildFallbackEdgeGraph(positionedNodes) {
      const nodeMap = new Map(positionedNodes.map(node => [node.meta.name, node]));
      const nodeMeta = new Map(cards.map(card => [card.name, { ...card, sideCounts: { WEST: 0, EAST: 0, NORTH: 0, SOUTH: 0 } }]));
      const slotUsage = new Map();
      const edgeModels = [];

      function takeSlot(tableName, side) {
        const key = tableName + ':' + side;
        const current = slotUsage.get(key) || 0;
        slotUsage.set(key, current + 1);
        return current;
      }

      for (const link of links) {
        const sourceMeta = nodeMeta.get(link.fromTable);
        const targetMeta = nodeMeta.get(link.toTable);
        if (!sourceMeta || !targetMeta) continue;

        const sides = choosePortSides(sourceMeta, targetMeta);
        const sourceSlot = takeSlot(link.fromTable, sides.sourceSide);
        const targetSlot = takeSlot(link.toTable, sides.targetSide);
        sourceMeta.sideCounts[sides.sourceSide] = Math.max(sourceMeta.sideCounts[sides.sourceSide], sourceSlot + 1);
        targetMeta.sideCounts[sides.targetSide] = Math.max(targetMeta.sideCounts[sides.targetSide], targetSlot + 1);

        edgeModels.push({
          meta: link,
          sourceSide: sides.sourceSide,
          targetSide: sides.targetSide,
          sourceSlot,
          targetSlot,
        });
      }

      function anchorPoint(node, side, slot, count) {
        const spacingPadding = 26;
        const usableWidth = Math.max(node.width - spacingPadding * 2, 24);
        const usableHeight = Math.max(node.height - spacingPadding * 2, 24);
        if (side === 'WEST') {
          return {
            x: node.x,
            y: node.y + spacingPadding + ((slot + 1) * usableHeight) / (count + 1),
          };
        }
        if (side === 'EAST') {
          return {
            x: node.x + node.width,
            y: node.y + spacingPadding + ((slot + 1) * usableHeight) / (count + 1),
          };
        }
        if (side === 'NORTH') {
          return {
            x: node.x + spacingPadding + ((slot + 1) * usableWidth) / (count + 1),
            y: node.y,
          };
        }
        return {
          x: node.x + spacingPadding + ((slot + 1) * usableWidth) / (count + 1),
          y: node.y + node.height,
        };
      }

      function extendPoint(point, side, amount) {
        if (side === 'WEST') return { x: point.x - amount, y: point.y };
        if (side === 'EAST') return { x: point.x + amount, y: point.y };
        if (side === 'NORTH') return { x: point.x, y: point.y - amount };
        return { x: point.x, y: point.y + amount };
      }

      return {
        edges: edgeModels
          .map(edge => {
            const sourceNode = nodeMap.get(edge.meta.fromTable);
            const targetNode = nodeMap.get(edge.meta.toTable);
            const sourceCounts = nodeMeta.get(edge.meta.fromTable).sideCounts;
            const targetCounts = nodeMeta.get(edge.meta.toTable).sideCounts;
            if (!sourceNode || !targetNode) return null;

            const start = anchorPoint(sourceNode, edge.sourceSide, edge.sourceSlot, sourceCounts[edge.sourceSide]);
            const end = anchorPoint(targetNode, edge.targetSide, edge.targetSlot, targetCounts[edge.targetSide]);
            const startStub = extendPoint(start, edge.sourceSide, 18);
            const endStub = extendPoint(end, edge.targetSide, 18);
            const horizontal = (edge.sourceSide === 'EAST' || edge.sourceSide === 'WEST') &&
              (edge.targetSide === 'EAST' || edge.targetSide === 'WEST');

            const points = horizontal
              ? [
                  start,
                  startStub,
                  { x: (startStub.x + endStub.x) / 2, y: startStub.y },
                  { x: (startStub.x + endStub.x) / 2, y: endStub.y },
                  endStub,
                  end,
                ]
              : [
                  start,
                  startStub,
                  { x: startStub.x, y: (startStub.y + endStub.y) / 2 },
                  { x: endStub.x, y: (startStub.y + endStub.y) / 2 },
                  endStub,
                  end,
                ];

            return {
              meta: edge.meta,
              sections: [{
                startPoint: points[0],
                bendPoints: points.slice(1, -1),
                endPoint: points[points.length - 1],
              }],
            };
          })
          .filter(Boolean),
      };
    }

    function pointsForEdge(edge) {
      const section = edge.sections && edge.sections[0];
      if (!section) return [];
      return [section.startPoint, ...(section.bendPoints || []), section.endPoint];
    }

    function pathData(points) {
      return points.map((point, index) => (index === 0 ? 'M ' : 'L ') + point.x + ' ' + point.y).join(' ');
    }

    function labelPoint(points) {
      if (points.length < 2) return points[0] || { x: 0, y: 0 };
      let total = 0;
      const lengths = [];
      for (let index = 0; index < points.length - 1; index += 1) {
        const start = points[index];
        const end = points[index + 1];
        const length = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
        lengths.push(length);
        total += length;
      }
      let cursor = total / 2;
      for (let index = 0; index < lengths.length; index += 1) {
        const start = points[index];
        const end = points[index + 1];
        if (cursor > lengths[index]) { cursor -= lengths[index]; continue; }
        if (start.x === end.x) return { x: start.x + 8, y: Math.min(start.y, end.y) + cursor };
        return { x: Math.min(start.x, end.x) + cursor, y: start.y - 8 };
      }
      return points[0];
    }

    function renderEdges(positionedGraph) {
      const ns = 'http://www.w3.org/2000/svg';
      const defs = document.createElementNS(ns, 'defs');
      const marker = document.createElementNS(ns, 'marker');
      marker.setAttribute('id', 'arrow');
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '8');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '8');
      marker.setAttribute('markerHeight', '8');
      marker.setAttribute('orient', 'auto-start-reverse');
      const arrowPath = document.createElementNS(ns, 'path');
      arrowPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
      arrowPath.setAttribute('fill', 'rgba(15, 23, 42, 0.38)');
      marker.appendChild(arrowPath);
      defs.appendChild(marker);
      svg.append(defs);

      for (const edge of positionedGraph.edges || []) {
        const points = pointsForEdge(edge);
        if (points.length < 2) continue;
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', pathData(points));
        path.setAttribute('class', 'link-path');
        path.setAttribute('marker-end', 'url(#arrow)');
        path.dataset.from = edge.meta.fromTable;
        path.dataset.to = edge.meta.toTable;

        const label = document.createElementNS(ns, 'text');
        const anchor = labelPoint(points);
        label.setAttribute('x', anchor.x);
        label.setAttribute('y', anchor.y);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('class', 'link-label');
        label.dataset.from = edge.meta.fromTable;
        label.dataset.to = edge.meta.toTable;
        label.textContent = [edge.meta.label, edge.meta.fromField && edge.meta.toField ? '(' + edge.meta.fromField + ' -> ' + edge.meta.toField + ')' : ''].filter(Boolean).join(' ');

        svg.append(path, label);
        linkEls.push({ path, label, link: edge.meta });
      }
    }

    function bindCardInteractions() {
      for (const [name, cardEl] of cardEls) {
        cardEl.addEventListener('click', event => {
          event.stopPropagation();
          if (cardEl.classList.contains('is-selected')) {
            clearSelection();
            return;
          }
          selectTable(name);
        });
      }
    }

    function renderScene(positionedNodes, domainGroups, width, height, edgeGraph) {
      board.style.width = width + 'px';
      board.style.height = height + 'px';
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
      renderCards(positionedNodes);
      renderDomainLabels(domainGroups);
      if (edgeGraph) renderEdges(edgeGraph);
      bindCardInteractions();
    }

    function clearSelection() {
      board.classList.remove('has-selection');
      for (const cardEl of cardEls.values()) cardEl.classList.remove('is-selected', 'is-related');
      for (const { path, label } of linkEls) {
        path.classList.remove('is-active');
        label.classList.remove('is-active');
      }
    }

    function selectTable(tableName) {
      clearSelection();
      board.classList.add('has-selection');
      const selected = cardEls.get(tableName);
      if (!selected) return;
      selected.classList.add('is-selected');

      const related = new Set([tableName]);
      for (const { path, label, link } of linkEls) {
        const active = link.fromTable === tableName || link.toTable === tableName;
        if (!active) continue;
        path.classList.add('is-active');
        label.classList.add('is-active');
        related.add(link.fromTable);
        related.add(link.toTable);
      }

      for (const table of related) {
        const cardEl = cardEls.get(table);
        if (cardEl && table !== tableName) cardEl.classList.add('is-related');
      }
    }

    function applySearch(value) {
      const query = value.trim().toLowerCase();
      if (!query) {
        for (const cardEl of cardEls.values()) cardEl.style.opacity = '';
        return;
      }
      for (const card of cards) {
        const haystack = (card.name + ' ' + card.rows.map(row => row.field).join(' ')).toLowerCase();
        const cardEl = cardEls.get(card.name);
        if (!cardEl) continue;
        cardEl.style.opacity = haystack.includes(query) ? '1' : '0.18';
      }
    }

    async function layoutAndRender() {
      clearBoard();
      const fallbackNodes = cards.map(card => ({ ...card, id: card.name, meta: card }));
      const fallbackGroups = fallbackDomainGroups();
      const fallbackWidth = Math.max(...cards.map(card => card.x + card.width), 1500) + 60;
      const fallbackHeight = Math.max(...cards.map(card => card.y + card.height), 980) + 60;

      if (!elk) {
        renderScene(fallbackNodes, fallbackGroups, fallbackWidth, fallbackHeight, buildFallbackEdgeGraph(fallbackNodes));
        return { mode: 'fallback' };
      }

      try {
        const graph = buildGraphModel();
        const laidOut = await elk.layout(graph);
        const positionedNodes = collectCardNodes(laidOut.children);
        const domainGroups = collectDomainGroups(laidOut.children);
        const width = Math.max(laidOut.width || 0, 1500);
        const height = Math.max(laidOut.height || 0, 980);
        renderScene(positionedNodes, domainGroups, width, height, laidOut);
        return { mode: 'elk' };
      } catch (error) {
        console.error(error);
        renderScene(fallbackNodes, fallbackGroups, fallbackWidth, fallbackHeight, buildFallbackEdgeGraph(fallbackNodes));
        return { mode: 'fallback' };
      }
    }

    board.addEventListener('click', event => {
      if (event.target === board || event.target === svg) clearSelection();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') clearSelection();
    });

    search.addEventListener('input', event => {
      applySearch(event.target.value);
    });

    if (hint) hint.textContent = 'Loading ELK orthogonal layout...';
    layoutAndRender()
      .then(result => {
        if (!hint) return;
        hint.textContent = result.mode === 'elk'
          ? 'Click a table to isolate its routed links.'
          : 'Showing fallback grouped layout. Reload with internet access for orthogonal routed links.';
      })
      .catch(error => {
        console.error(error);
        if (hint) hint.textContent = 'Layout rendering failed.';
      });
  </script>
</body>
</html>
"@

$outputDir = Split-Path -Parent $OutputPath

if (-not (Test-Path -LiteralPath $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

Set-Content -LiteralPath $OutputPath -Value $html -Encoding UTF8

Write-Output "Generated: $OutputPath"
Write-Output "Source: $resolvedSource"
Write-Output "Tables: $($tables.Count)"
Write-Output "Relationships: $($relationships.Count)"

