#!/bin/bash
# Autonomous Feature Change Commit & Documentation Manager
# Runs after Write/Edit operations to detect feature changes and prepare documentation

set -e

# Get the project root (assuming we're in the project directory)
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"
cd "$PROJECT_ROOT"

# Lock file to prevent recursive hook execution
LOCK_FILE=".claude/.feature-commit-lock"

# If lock exists, another hook instance is running - skip to avoid recursion
if [ -f "$LOCK_FILE" ]; then
  echo '{"continue": true}'
  exit 0
fi

# Create lock file
touch "$LOCK_FILE"

# Cleanup function to remove lock on exit
cleanup() {
  rm -f "$LOCK_FILE"
}
trap cleanup EXIT

# Read stdin JSON (hook input)
INPUT=$(cat)

# Extract the file path that was written/edited (if available)
# We'll check ALL staged changes, not just the one file, to detect feature-level changes

# Check if there are any staged changes
if ! git diff --cached --name-only | read -r; then
  # No staged changes
  echo '{"continue": true}'
  exit 0
fi

# Analyze staged changes to detect feature-level changes
# Feature changes: new modules, new API routes, new dashboards, major refactors

CHANGED_FILES=$(git diff --cached --name-only)

# Helper function to check if a path matches a pattern
contains_feature_change() {
  local file="$1"

  # New modules under src/
  if [[ "$file" =~ ^src/modules/ ]]; then
    return 0
  fi

  # New services
  if [[ "$file" =~ ^src/services/ ]]; then
    return 0
  fi

  # New components (check if it's a new file, not just modification)
  if [[ "$file" =~ ^src/components/ ]] && git diff --cached --name-status "$file" | grep -q "^A"; then
    return 0
  fi

  # New API routes (route.ts or route.js in app/api or server routes)
  if [[ "$file" =~ (^app/api/|/api/) && "$file" =~ \.route\.(ts|js)$ ]]; then
    return 0
  fi

  # New database migrations
  if [[ "$file" =~ supabase/migrations/.*\.sql$ ]]; then
    return 0
  fi

  # New pages under app/ (excluding layout/loading/error)
  if [[ "$file" =~ ^app/ ]] && [[ "$file" =~ \.page\.(tsx?|jsx?)$ ]]; then
    return 0
  fi

  # New dashboard pages
  if [[ "$file" =~ dashboard ]]; then
    return 0
  fi

  # Major refactors: deletion of core modules
  if [[ "$file" =~ ^src/ ]] && git diff --cached --name-status "$file" | grep -q "^D"; then
    # Check if it's a core module
    if [[ "$file" =~ ^src/(modules|services|components)/ ]]; then
      return 0
    fi
  fi

  return 1
}

# Check if any changed file indicates a feature change
HAS_FEATURE_CHANGE=false
for file in $CHANGED_FILES; do
  if contains_feature_change "$file"; then
    HAS_FEATURE_CHANGE=true
    break
  fi
done

if [ "$HAS_FEATURE_CHANGE" = false ]; then
  # No feature-level changes, continue normally
  echo '{"continue": true}'
  exit 0
fi

# === FEATURE CHANGE DETECTED ===

# Classify the change type
# Determine based on patterns:
# - New files mostly → feat
# - Improvements to existing → update
# - Deletions → remove
# - Architecture/organization → refactor

CHANGE_TYPE="feat"  # default

# Count added vs modified vs deleted
ADDED_COUNT=$(git diff --cached --name-status | grep -c "^A" || echo 0)
DELETED_COUNT=$(git diff --cached --name-status | grep -c "^D" || echo 0)
MODIFIED_COUNT=$(git diff --cached --name-status | grep -c "^M" || echo 0)

if [ "$DELETED_COUNT" -gt 0 ] && [ "$ADDED_COUNT" -eq 0 ]; then
  CHANGE_TYPE="remove"
elif [[ "$CHANGED_FILES" =~ (^|/)(arch|refactor|structure|reorganize) ]] || [ "$MODIFIED_COUNT" -gt "$ADDED_COUNT" ]; then
  # More modifications than additions suggests refactor
  # Also check for specific refactor indicators in file paths
  CHANGE_TYPE="refactor"
else
  CHANGE_TYPE="update"
fi

# Generate a descriptive commit title based on the changes
# For now, use a generic summary - in a real implementation, you'd analyze content
COMMIT_TITLE="$CHANGE_TYPE: implement new feature"

# But we need a better summary. Let's look at what changed:
# - Check new modules/directories
NEW_MODULES=$(git diff --cached --name-only | grep -E '^src/modules/[^/]+' | cut -d/ -f3 | sort -u)
NEW_SERVICES=$(git diff --cached --name-only | grep -E '^src/services/[^/]+' | cut -d/ -f3 | sort -u)
NEW_COMPONENTS=$(git diff --cached --name-only | grep -E '^src/components/[^/]+' | cut -d/ -f3 | sort -u)
NEW_PAGES=$(git diff --cached --name-only | grep -E '^app/.*\.page\.(tsx?|jsx?)$')

if [ -n "$NEW_MODULES" ]; then
  MODULE_LIST=$(echo "$NEW_MODULES" | head -1)
  if [ $(echo "$NEW_MODULES" | wc -l) -gt 1 ]; then
    MODULE_LIST="multiple modules"
  fi
  COMMIT_TITLE="$CHANGE_TYPE: add $MODULE_LIST"
elif [ -n "$NEW_SERVICES" ]; then
  SERVICE=$(echo "$NEW_SERVICES" | head -1)
  COMMIT_TITLE="$CHANGE_TYPE: add $SERVICE service"
elif [ -n "$NEW_COMPONENTS" ]; then
  COMPONENT=$(echo "$NEW_COMPONENTS" | head -1 | sed 's/\.tsx\{0,1\}$//' | sed 's/\.jsx\{0,1\}$//')
  COMMIT_TITLE="$CHANGE_TYPE: add $COMPONENT component"
elif echo "$NEW_PAGES" | grep -q dashboard; then
  COMMIT_TITLE="$CHANGE_TYPE: add tenant dashboard"
else
  COMMIT_TITLE="$CHANGE_TYPE: update system"
fi

# Build the bullet list for commit body
BULLETS=""

# What changed and why it matters
if [ "$CHANGE_TYPE" = "feat" ] || [ "$CHANGE_TYPE" = "update" ]; then
  if [ -n "$NEW_MODULES" ]; then
    BULLETS="$BULLETS• Added core module(s): $NEW_MODULES\n"
  fi
  if [ -n "$NEW_SERVICES" ]; then
    BULLETS="$BULLETS• Introduced service layer: $NEW_SERVICES\n"
  fi
  if [ -n "$NEW_COMPONENTS" ]; then
    BULLETS="$BULLETS• Created UI components: $NEW_COMPONENTS\n"
  fi
  if echo "$CHANGED_FILES" | grep -q 'dashboard'; then
    BULLETS="$BULLETS• Added dashboard/analytics view\n"
  fi
  if echo "$CHANGED_FILES" | grep -q 'api'; then
    BULLETS="$BULLETS• Added API endpoints and routes\n"
  fi
  if [ -n "$BULLETS" ]; then
    BULLETS="${BULLETS%\\n}"
  else
    BULLETS="• Updated system with feature improvements\n• Enhanced functionality\n• Improved codebase"
  fi
elif [ "$CHANGE_TYPE" = "refactor" ]; then
  BULLETS="• Restructured code organization\n• Improved maintainability\n• Updated architecture"
elif [ "$CHANGE_TYPE" = "remove" ]; then
  BULLETS="• Removed unused modules\n• Simplified codebase\n• Updated dependencies"
fi

# Now update the documentation files
TODAY="2026-03-24"

# Update docs/list-of-features.md
# Find the correct category section and insert the new feature
FEATURES_FILE="docs/list-of-features.md"
if [ -f "$FEATURES_FILE" ]; then
  # Determine category based on change type and content
  if echo "$CHANGED_FILES" | grep -q 'dashboard\|analytics\|tenant\|landlord'; then
    CATEGORY="## Tenant/Landlord Portal"
  elif echo "$CHANGED_FILES" | grep -q 'api\|server\|supabase'; then
    CATEGORY="## Backend API & Database"
  elif echo "$CHANGED_FILES" | grep -q 'auth\|login\|register'; then
    CATEGORY="## Authentication & Security"
  elif [ "$CHANGE_TYPE" = "refactor" ]; then
    CATEGORY="## Architecture & Infrastructure"
  else
    CATEGORY="## Core Features"
  fi

  # Build the feature line
  FEATURE_LINE="- **$COMMIT_TITLE**: $(echo "$BULLETS" | head -1 | sed 's/^• //' | sed 's/\n/ /')"

  # Insert after the category heading if it exists, otherwise at the end
  if grep -q "^$CATEGORY" "$FEATURES_FILE"; then
    # Insert the first bullet under the category
    sed -i "/^$CATEGORY/a $FEATURE_LINE" "$FEATURES_FILE"
  else
    # Category doesn't exist, append to relevant section or at the end
    echo "\n$CATEGORY\n$FEATURE_LINE" >> "$FEATURES_FILE"
  fi
fi

# Update CHANGELOG.md
CHANGELOG="CHANGELOG.md"
if [ -f "$CHANGELOG" ]; then
  # Build the changelog entry
  CHANGE_VERB=$(echo "$CHANGE_TYPE" | sed 's/feat/Added/; s/update/Updated/; s/remove/Removed/; s/refactor/Changed/')
  CHANGELOG_ENTRY="- $COMMIT_TITLE: $(echo "$BULLETS" | head -1 | sed 's/^• //' | sed 's/\n/ /')"

  # Check if today's entry exists
  if grep -q "## $TODAY" "$CHANGELOG"; then
    # Insert under existing date
    sed -i "/## $TODAY/a $CHANGELOG_ENTRY" "$CHANGELOG"
  else
    # Create new date section at the top
    TEMP_CHANGELOG=$(mktemp)
    echo "## $TODAY" > "$TEMP_CHANGELOG"
    echo "### $CHANGE_VERB" >> "$TEMP_CHANGELOG"
    echo "$CHANGELOG_ENTRY" >> "$TEMP_CHANGELOG"
    echo "" >> "$TEMP_CHANGELOG"
    cat "$CHANGELOG" >> "$TEMP_CHANGELOG"
    mv "$TEMP_CHANGELOG" "$CHANGELOG"
  fi
fi

# Generate the full commit message
COMMIT_MSG="$COMMIT_TITLE\n\n$BULLETS"

# Check for build errors (non-blocking, just log)
if command -v npm &> /dev/null && [ -f package.json ]; then
  if npm run build 2>/tmp/build-error.log; then
    BUILD_STATUS="Build passed."
  else
    BUILD_STATUS="Build has errors (see /tmp/build-error.log). Fix before committing."
  fi
else
  BUILD_STATUS="No build command detected."
fi

# Stage the documentation changes
git add "$FEATURES_FILE" "$CHANGELOG" 2>/dev/null || true

# Return the proposal to the user
cat <<EOF
{
  "systemMessage": "Feature changes detected.\n\nProposed commit:\n$COMMIT_MSG\n\n$BUILD_STATUS\n\nDocs updated. To commit, run: git commit -m \"$COMMIT_TITLE\" -m \"$BULLETS\"\n\nTo skip commit and continue working, just continue with other tasks.",
  "continue": false,
  "suppressOutput": false
}
EOF

exit 0
