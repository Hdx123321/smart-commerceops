$ErrorActionPreference = "Continue"
$apiKey = "ZE0TOk22Tp7AS3p5TsLI1xseCs8bC8b0RtFJwN8oZyB8Y9QAmwDnmE8O"
$jsonFile = "$env:USERPROFILE\Desktop\CA_Team4\SpringBoot_CA\tmp\db-keywords.json"
$tmpDir = "$env:USERPROFILE\Desktop\CA_Team4\SpringBoot_CA\tmp\imgs"
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

Write-Host "Loading keywords from $jsonFile"
$keywords = Get-Content $jsonFile -Encoding UTF8 | ConvertFrom-Json
$total = ($keywords | Get-Member -MemberType NoteProperty).Count
Write-Host "Total products: $total"

$success = 0; $failed = 0; $done = 0

foreach ($prop in $keywords.PSObject.Properties) {
    $id = [int]$prop.Name
    $query = $prop.Value
    $done++
    Write-Host -NoNewline "[$done/$total] ID=$id query='$query' ... "

    try {
        $searchUrl = "https://api.pexels.com/v1/search?query=$([uri]::EscapeDataString($query))&per_page=2&size=medium&orientation=square"
        $response = Invoke-RestMethod -Uri $searchUrl -Headers @{Authorization = $apiKey} -TimeoutSec 15 -ErrorAction Stop

        if (-not $response.photos -or $response.photos.Count -eq 0) {
            Write-Host "NO RESULTS"
            $failed++; continue
        }

        $imgPaths = @()
        foreach ($photo in $response.photos) {
            $imgUrl = $photo.src.medium
            $localFile = "$tmpDir\p_${id}_$(Get-Random).jpg"
            try {
                (New-Object System.Net.WebClient).DownloadFile($imgUrl, $localFile)
            } catch { continue }

            if (-not (Test-Path $localFile)) { continue }
            $size = (Get-Item $localFile).Length
            if ($size -lt 1000) { Remove-Item $localFile -Force; continue }

            $uuid = [guid]::NewGuid().ToString()
            docker cp $localFile "smart-commerceops-catalog-service-1:/app/uploads/images/products/${uuid}.jpg" 2>$null
            if ($LASTEXITCODE -ne 0) { Remove-Item $localFile -Force; continue }
            $imgPaths += "/images/products/${uuid}.jpg"
            Remove-Item $localFile -Force
        }

        if ($imgPaths.Count -eq 0) { Write-Host "DOWNLOAD FAILED"; $failed++; continue }

        # Update DB - note: need to handle double-quotes carefully
        $jsonArray = '["' + ($imgPaths -join '","') + '"]'
        $escaped = $jsonArray -replace "'", "''"
        $sql = "UPDATE products SET image_url = '$escaped' WHERE id = $id;"
        docker exec smart-commerceops-mysql-1 mysql -uroot -pcommerceops catalog_db -e "$sql" 2>$null

        Write-Host "OK ($($imgPaths.Count))"
        $success++
    }
    catch {
        Write-Host "ERROR: $($_.Exception.Message)"
        $failed++
    }

    Start-Sleep -Milliseconds 400
}

Write-Host "`n=== COMPLETE: $success OK, $failed FAILED ==="

# JSON format will be fixed separately after (double-quotes get lost in docker exec)
Write-Host "`nRun JSON fix SQL manually after script completes"
