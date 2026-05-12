$file = "supabase_backup/migrations/20260309_initial_schema.sql"
$raw = [IO.File]::ReadAllText($file)

# Remove saved_properties block
$raw = $raw -replace '(?s)CREATE TABLE saved_properties.*?;', ''
# Remove RLS for saved_properties
$raw = $raw -replace '(?s)ALTER TABLE saved_properties.*?;', ''
# Remove policies for saved_properties
$raw = $raw -replace '(?s)CREATE POLICY.*?ON saved_properties.*?;', ''
# Remove indices for saved_properties
$raw = $raw -replace '(?s)CREATE INDEX.*?ON saved_properties.*?;', ''

[IO.File]::WriteAllText($file, $raw)
