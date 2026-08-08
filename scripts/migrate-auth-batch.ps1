param(
    [string]$Pattern = "mode"
)

# Mode: "check" shows remaining files, "migrate" runs the migration
switch ($Pattern) {
    "check" {
        Get-ChildItem -Path "src/app/api/landlord" -Recurse -Filter "route.ts" | ForEach-Object {
            $content = Get-Content $_.FullName -Raw
            if ($content -match "getUser\(\)") {
                $refs = [regex]::Matches($content, "getUser\(\)").Count
                Write-Host "$($refs)x $($_.FullName)"
            }
        }
        break
    }
    "migrate" {
        # Handle each file individually to manage different patterns
        Write-Host "Starting migration..."

        $files = Get-ChildItem -Path "src/app/api/landlord" -Recurse -Filter "route.ts" | Where-Object {
            $content = Get-Content $_.FullName -Raw
            $content -match "getUser\(\)"
        }

        $total = ($files | Measure-Object).Count
        $count = 0

        foreach ($file in $files) {
            $count++
            Write-Host "[$count/$total] Processing: $($file.FullName)" -ForegroundColor Cyan

            $content = Get-Content $file.FullName -Raw

            # Skip if already migrated
            if ($content -match "requireAuthenticatedUser") {
                Write-Host "  Already migrated, skipping." -ForegroundColor Yellow
                continue
            }

            # 1. Add the new import
            if ($content -match "import.*createClient.*from.*@/lib/supabase/server") {
                # Has createClient import - add requireAuthenticatedUser after it
                $content = $content -replace "(import.*from \"@/lib/supabase/server\";)", "`$1`nimport { requireAuthenticatedUser } from "@/lib/api/auth-guard";"
            } else {
                # No createClient import - add after last import
                $content = $content -replace "(^import[^;]+;`r?`n)+", "`$&`nimport { requireAuthenticatedUser } from "@/lib/api/auth-guard";`n"
            }

            # 2. Replace auth block patterns (handles multiple handlers)
            # Pattern: createClient + getUser + error check
            $authBlockPattern = 'const\s+supabase\s*=\s*await\s+createClient\(\);\s*\r?\n\s*const\s+\{\s*data:\s*\{\s*user\s*\},\s*error:\s*userError\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\);\s*\r?\n\s*if\s*\(\s*userError\s*\|\|\s*!user\s*\)\s*\{?\s*\r?\n?\s*return\s+NextResponse\.json\(\s*\{?\s*error:\s*"Unauthorized"\s*\}?\s*,\s*\{\s*status:\s*401\s*\}\s*\);\s*\r?\n?\s*\}?'

            $replacement = 'const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;'

            if ($content -match $authBlockPattern) {
                $content = $content -replace $authBlockPattern, $replacement
                Write-Host "  Auth block replaced." -ForegroundColor Green
            } else {
                Write-Host "  WARNING: Could not match auth block pattern!" -ForegroundColor Red
            }

            # 3. Replace user.id with userId (after verifying it's not newUser.user.id)
            # First handle common patterns that should NOT be replaced
            if ($content -match "newUser\.user\.id") {
                Write-Host "  WARNING: newUser.user.id found - manual check needed!" -ForegroundColor Yellow
            }

            $content = $content -replace '(?<!newUser\.)user\.id(?!\w)', 'userId'
            Write-Host "  user.id references replaced." -ForegroundColor Green

            # 4. Write the file
            $content | Out-File -FilePath $file.FullName -Encoding utf8 -NoNewline

            Write-Host "  Done." -ForegroundColor Green
        }

        Write-Host "`nMigration complete! $total files processed." -ForegroundColor Green
        break
    }
    default {
        Write-Host "Usage: .\scripts\migrate-auth-batch.ps1 -Pattern check|migrate"
    }
}