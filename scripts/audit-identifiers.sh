#!/usr/bin/env bash
#
# audit-identifiers.sh — Naming Convention Auditor
#
# Scans TypeScript/TSX files for identifier naming convention violations:
#   1. Single-letter variables (excluding loop indices i, j, k)
#   2. Abbreviated names (usr, prof, req, res, ctx, cfg, btn, msg, tmp, etc.)
#   3. Booleans without is/has/should/can/will/does prefix
#   4. Functions without verb prefix
#
# Usage:
#   ./scripts/audit-identifiers.sh              # scan entire src/
#   ./scripts/audit-identifiers.sh src/lib      # scan specific path
#   ./scripts/audit-identifiers.sh --strict     # exit non-zero on any violation
#
# Output:
#   Prints violations grouped by category with file:line references.
#   Exit code 0 = clean (or warnings only in non-strict mode).
#   Exit code 1 = violations found.

set -o pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Directories to scan (default: src/)
TARGET="${1:-src}"

# If --strict flag is set anywhere, exit non-zero on violations.
STRICT_MODE="false"
if echo "$*" | grep -q -- "--strict"; then
  STRICT_MODE="true"
fi

# Allowed single-letter variables (loop indices, common math symbols).
# Format: space-separated list of letters
ALLOWED_SINGLE_LETTERS="i j k x y z"

# Abbreviations that should be expanded.
# Format: "abbr=preferred" pairs
declare -A ABBREVIATION_MAP=(
  ["usr"]="user"
  ["prof"]="profile"
  ["prp"]="property"
  ["prop"]="property"
  ["req"]="request"
  ["res"]="response"
  ["ctx"]="context"
  ["cfg"]="config"
  ["btn"]="button"
  ["msg"]="message"
  ["tmp"]="temporary"
  ["val"]="value"
  ["obj"]="object"
  ["arr"]="array"
  ["el"]="element"
  ["elem"]="element"
  ["idx"]="index"
  ["cnt"]="count"
  ["err"]="error"
  ["svc"]="service"
  ["repo"]="repository"
  ["util"]="utility"
  ["impl"]="implementation"
  ["mgr"]="manager"
  ["fld"]="field"
  ["sel"]="select"
  ["init"]="initialize"
)

# Words that should not be used as standalone identifiers (too generic).
GENERIC_WORDS=(
  "data" "info" "details" "item" "stuff" "temp" "foo" "bar"
  "baz" "qux" "thing" "result" "output" "input" "param"
)

# Boolean prefixes that are acceptable.
BOOLEAN_PREFIXES="is[A-Z]|has[A-Z]|should[A-Z]|can[A-Z]|will[A-Z]|does[A-Z]|was[A-Z]|did[A-Z]|needs[A-Z]"

# Verb prefixes for function names.
VERB_PREFIXES="get|set|create|update|delete|fetch|validate|compute|build|handle|process|send|check|find|resolve|format|parse|generate|convert|apply|remove|clear|register|unregister|enable|disable|toggle|merge|split|calculate|prepare|execute|compare|extract|transform|initialize|load|save|render|refresh|reset|search|sort|filter|submit|cancel|confirm|reject|approve|verify|authorize|redirect|navigate|upload|download|connect|disconnect|open|close|start|stop|resume|pause|map|reduce|filter"

# Counters
VIOLATION_COUNT=0
TOTAL_FILES_SCANNED=0

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

log_section() {
  echo ""
  echo -e "${YELLOW}━━━ $1 ━━━${NC}"
}

log_pass() {
  echo -e "  ${GREEN}✓${NC} $1"
}

log_violation() {
  echo -e "  ${RED}✗${NC} $1"
  VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
}

build_abbreviation_pattern() {
  local pattern=""
  for abbr in "${!ABBREVIATION_MAP[@]}"; do
    if [ -z "$pattern" ]; then
      pattern="$abbr"
    else
      pattern="$pattern|$abbr"
    fi
  done
  echo "$pattern"
}

# ---------------------------------------------------------------------------
# Audit 1: Single-letter variables
# ---------------------------------------------------------------------------
audit_single_letters() {
  log_section "Audit 1: Single-letter variables"

  local found_any="false"

  for letter in {a..z}; do
    # Skip allowed letters
    if echo "$ALLOWED_SINGLE_LETTERS" | grep -qw "$letter"; then
      continue
    fi

    # Search for `let $letter`, `const $letter`, `var $letter`, or destructured `{ $letter }`
    local matches
    matches=$(grep -rPn \
      --include="*.ts" --include="*.tsx" \
      -e "(let|const|var)\s+${letter}\b" \
      -e "\b(?:function|const)\s+${letter}\s*\(" \
      -e "\bfor\s*\(\s*(let|const|var)\s+${letter}\b" \
      "$TARGET" 2>/dev/null || true)

    # Also check for destructured single-letter variables: { a }, { b: c }
    if [ -z "$matches" ]; then
      matches=$(grep -rPn \
        --include="*.ts" --include="*.tsx" \
        -e "\{\s*${letter}\s*[,}]" \
        -e ",\s*${letter}\s*[,}]" \
        "$TARGET" 2>/dev/null | grep -v "import\b" | grep -v "export\b" || true)
    fi

    if [ -n "$matches" ]; then
      found_any="true"
      while IFS= read -r line; do
        log_violation "$line"
      done <<< "$matches"
    fi
  done

  if [ "$found_any" = "false" ]; then
    log_pass "No single-letter variable violations found"
  fi
}

# ---------------------------------------------------------------------------
# Audit 2: Abbreviated names
# ---------------------------------------------------------------------------
audit_abbreviations() {
  log_section "Audit 2: Abbreviated names"

  local abbreviation_pattern
  abbreviation_pattern=$(build_abbreviation_pattern)

  if [ -z "$abbreviation_pattern" ]; then
    log_pass "No abbreviation rules configured"
    return
  fi

  # Search for variable/parameter/function declarations with abbreviations
  local matches
  matches=$(grep -rPn \
    --include="*.ts" --include="*.tsx" \
    -e "\b(let|const|var|function|class|interface|type|enum)\s+(${abbreviation_pattern})\b" \
    -e "\b(?:\(|,\s*)\s*(${abbreviation_pattern})\s*(?::|\)|,)" \
    "$TARGET" 2>/dev/null || true)

  if [ -n "$matches" ]; then
    while IFS= read -r line; do
      # Extract the abbreviation for context
      local abbr_found
      abbr_found=$(echo "$line" | grep -oP "\b(${abbreviation_pattern})\b" | head -1)
      local suggestion="${ABBREVIATION_MAP[$abbr_found]:-descriptive_word}"
      log_violation "$line  →  suggest: $suggestion"
    done <<< "$matches"
  else
    log_pass "No abbreviation violations found"
  fi
}

# ---------------------------------------------------------------------------
# Audit 3: Boolean naming (must use is/has/should prefix)
# ---------------------------------------------------------------------------
audit_boolean_naming() {
  log_section "Audit 3: Boolean naming (is/has/should prefix)"

  # Search for boolean-typed variables without proper prefix.
  # Pattern: `let/const someName: boolean` or `let/const someName = true/false`
  local matches
  matches=$(grep -rPn \
    --include="*.ts" --include="*.tsx" \
    -e "\b(let|const)\s+\w+\s*(?::\s*(?:boolean|Boolean))" \
    -e "\b(let|const)\s+\w+\s*=\s*(true|false)\b" \
    "$TARGET" 2>/dev/null | grep -vE "\b(let|const)\s+(${BOOLEAN_PREFIXES})" || true)

  if [ -n "$matches" ]; then
    while IFS= read -r line; do
      log_violation "$line  →  should start with is/has/should/can/will/does"
    done <<< "$matches"
  else
    log_pass "No boolean naming violations found"
  fi
}

# ---------------------------------------------------------------------------
# Audit 4: Function naming (must use verb prefix)
# ---------------------------------------------------------------------------
audit_function_naming() {
  log_section "Audit 4: Function naming (verb prefix)"

  # Search for exported function declarations and const arrow functions
  # that don't start with a verb prefix.
  local matches
  matches=$(grep -rPn \
    --include="*.ts" --include="*.tsx" \
    -e "^\s*export\s+(async\s+)?function\s+(\w+)" \
    -e "^\s*export\s+const\s+(\w+)\s*=\s*(async\s*)?\(" \
    "$TARGET" 2>/dev/null | grep -vE "\bfunction\s+(${VERB_PREFIXES})[A-Z_]" | grep -vE "\bconst\s+(${VERB_PREFIXES})[A-Z_]" || true)

  if [ -n "$matches" ]; then
    while IFS= read -r line; do
      log_violation "$line  →  function should start with a verb (get, create, fetch, etc.)"
    done <<< "$matches"
  else
    log_pass "No function naming violations found"
  fi
}

# ---------------------------------------------------------------------------
# Audit 5: Generic/placeholder names
# ---------------------------------------------------------------------------
audit_generic_names() {
  log_section "Audit 5: Generic/placeholder names"

  local found_any="false"

  for word in "${GENERIC_WORDS[@]}"; do
    local matches
    matches=$(grep -rPn \
      --include="*.ts" --include="*.tsx" \
      -e "\b(let|const|var|function)\s+${word}\b" \
      -e "\binterface\s+${word}\b" \
      -e "\btype\s+${word}\b" \
      "$TARGET" 2>/dev/null | grep -v "node_modules" | grep -v ".d.ts" || true)

    if [ -n "$matches" ]; then
      found_any="true"
      while IFS= read -r line; do
        log_violation "$line  →  '$word' is too generic, use a descriptive name"
      done <<< "$matches"
    fi
  done

  if [ "$found_any" = "false" ]; then
    log_pass "No generic name violations found"
  fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   iReside Identifier Naming Convention Audit  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Target: ${YELLOW}${TARGET}${NC}"
echo -e "Strict mode: ${YELLOW}${STRICT_MODE}${NC}"

TOTAL_FILES_SCANNED=$(find "$TARGET" \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" ! -name "*.d.ts" 2>/dev/null | wc -l | tr -d ' ')
echo -e "Files to scan: ${YELLOW}${TOTAL_FILES_SCANNED}${NC}"

audit_single_letters
audit_abbreviations
audit_boolean_naming
audit_function_naming
audit_generic_names

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"

if [ "$VIOLATION_COUNT" -eq 0 ]; then
  echo -e "  ${GREEN}✓ No naming convention violations found.${NC}"
  echo ""
  exit 0
else
  echo -e "  ${RED}✗ ${VIOLATION_COUNT} naming convention violation(s) found.${NC}"
  echo ""
  if [ "$STRICT_MODE" = "true" ]; then
    exit 1
  else
    echo -e "  ${YELLOW}Run with --strict to fail CI on violations.${NC}"
    exit 0
  fi
fi