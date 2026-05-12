function Purge-Legacy-SQL {
    param([string]$file)
    if (-not (Test-Path $file)) { return }
    Write-Host "Cleaning up $file..."
    $content = Get-Content $file
    
    # Patterns to remove lines containing these strings
    $patterns = @(
        "listings",
        "geo_locations",
        "saved_properties",
        "listing_scope",
        "listing_status",
        "location_type",
        "increment_listing_metric"
    )

    $newContent = $content | Where-Object {
        $line = $_
        $keep = $true
        foreach ($p in $patterns) {
            if ($line -like "*$p*") {
                $keep = $false
                break
            }
        }
        
        # Exact column matches for lat/lng (with optional double precision or just name)
        # In primary-schema.sql it's "lat" double precision,
        # in source-of-truth-db.sql it might be slightly different.
        if ($line -match '"lat" ' -or $line -match '"lng" ') {
            # Be careful not to match late_fee or something
            if ($line -match '"lat" double precision' -or $line -match '"lng" double precision' -or $line -match '"lat" float' -or $line -match '"lng" float') {
                $keep = $false
            }
        }

        $keep
    }

    $newContent | Set-Content "$file.cleaned"
    Move-Item "$file.cleaned" $file -Force
}

Purge-Legacy-SQL "source-of-truth-db.sql"
Purge-Legacy-SQL "dump.sql"
Purge-Legacy-SQL "supabase_backup/migrations/primary-schema.sql"
