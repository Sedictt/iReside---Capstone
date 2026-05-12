$file = "src/types/database.ts"
$content = Get-Content $file

# We'll use a more surgical approach for the TypeScript file
# We want to remove the entire blocks for geo_locations and saved_properties
# and also any mentions of listing_scope, listing_status, location_type if they are just types.

$newContent = $content | Where-Object {
    $line = $_
    $keep = $true
    
    # Simple line-based filtering for these specific patterns
    if ($line -match "LocationType =" -or $line -match "listing_status =" -or $line -match "listing_scope =") {
        $keep = $false
    }
    
    # We'll handle the blocks by running a state machine if needed, 
    # but let's try a simple pattern first for the table definitions.
    
    $keep
}

# Now for the blocks, it's better to use a regex on the whole content
$raw = [IO.File]::ReadAllText($file)

# Remove geo_locations block
$raw = $raw -replace '(?s)\s+geo_locations: \{.*?\n\s+\},', ''
# Remove saved_properties block
$raw = $raw -replace '(?s)\s+saved_properties: \{.*?\n\s+\},', ''
# Remove SavedProperty type
$raw = $raw -replace '(?s)type SavedProperty =.*?\n', ''

[IO.File]::WriteAllText($file, $raw)
