# Fill the table of contents and export each manual to PDF with Microsoft Word.
#   powershell -ExecutionPolicy Bypass -File scripts/user-manual/export_pdf.ps1
$ErrorActionPreference = "Stop"
$dir = Resolve-Path (Join-Path $PSScriptRoot "..\..\docs\manual")
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    foreach ($lang in "EN", "FIL") {
        $docx = [string](Join-Path $dir "iReside_User_Manual_$lang.docx")
        $pdf = [string](Join-Path $dir "iReside_User_Manual_$lang.pdf")
        Write-Output "$lang : opening"
        # FileName, ConfirmConversions, ReadOnly, AddToRecentFiles
        $doc = $word.Documents.Open($docx, $false, $false, $false)
        Write-Output "$lang : updating contents"
        $doc.Repaginate()
        foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
        $doc.Fields.Update() | Out-Null
        $doc.Repaginate()
        foreach ($toc in $doc.TablesOfContents) { $toc.UpdatePageNumbers() }
        $pages = $doc.ComputeStatistics(2)
        $doc.Save()
        Write-Output "$lang : saving pdf"
        # 17 = wdFormatPDF
        $doc.SaveAs2($pdf, 17)
        $doc.Close($false)
        Write-Output "$lang : $pages pages -> $pdf"
    }
}
finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
