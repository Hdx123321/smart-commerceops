$ErrorActionPreference = "Continue"
$apiKey = "ZE0TOk22Tp7AS3p5TsLI1xseCs8bC8b0RtFJwN8oZyB8Y9QAmwDnmE8O"
$kwFile = "$env:USERPROFILE\Desktop\CA_Team4\SpringBoot_CA\tmp\db-keywords.json"
$tmpDir = "$env:USERPROFILE\Desktop\CA_Team4\SpringBoot_CA\tmp\imgs"
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

$allKw = Get-Content $kwFile -Encoding UTF8 | ConvertFrom-Json

# Get IDs that need retry
$retryIds = docker exec smart-commerceops-mysql-1 mysql -uroot -pcommerceops catalog_db -N -e "SELECT GROUP_CONCAT(id) FROM products WHERE image_url IS NULL OR image_url NOT LIKE '%/images/products/%';" 2>$null
$retryIds = $retryIds -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^\d+$' }
Write-Host "Products to retry: $($retryIds.Count)"

$success = 0; $failed = 0; $done = 0

foreach ($idStr in $retryIds) {
    $id = [int]$idStr
    $query = $allKw.$idStr
    if (-not $query) { Write-Host "ID=${id}: NO KEYWORD"; $failed++; continue }

    $done++
    $eta = [math]::Round(($retryIds.Count - $done) * 21 / 60, 0)
    Write-Host -NoNewline "[$done/$($retryIds.Count)] ID=$id '$query' (ETA ${eta}min) ... "

    try {
        $searchUrl = "https://api.pexels.com/v1/search?query=$([uri]::EscapeDataString($query))&per_page=2&size=medium&orientation=square"
        $response = Invoke-RestMethod -Uri $searchUrl -Headers @{Authorization = $apiKey} -TimeoutSec 15 -ErrorAction Stop

        if (-not $response.photos -or $response.photos.Count -eq 0) {
            Write-Host "NO RESULTS"
            $failed++; Start-Sleep -Milliseconds 200; continue
        }

        $imgPaths = @()
        foreach ($photo in $response.photos) {
            $imgUrl = $photo.src.medium
            $localFile = "$tmpDir\r_${id}_$(Get-Random).jpg"
            try { (New-Object System.Net.WebClient).DownloadFile($imgUrl, $localFile) } catch { continue }
            if (-not (Test-Path $localFile)) { continue }
            $size = (Get-Item $localFile).Length
            if ($size -lt 1000) { Remove-Item $localFile -Force; continue }

            $uuid = [guid]::NewGuid().ToString()
            docker cp $localFile "smart-commerceops-catalog-service-1:/app/uploads/images/products/${uuid}.jpg" 2>$null
            if ($LASTEXITCODE -ne 0) { Remove-Item $localFile -Force; continue }
            $imgPaths += "/images/products/${uuid}.jpg"
            Remove-Item $localFile -Force
        }

        if ($imgPaths.Count -eq 0) { Write-Host "DOWNLOAD FAILED"; $failed++; Start-Sleep -Milliseconds 200; continue }

        $jsonArray = '["' + ($imgPaths -join '","') + '"]'
        $escaped = $jsonArray -replace "'", "''"
        docker exec smart-commerceops-mysql-1 mysql -uroot -pcommerceops catalog_db -e "UPDATE products SET image_url = '$escaped' WHERE id = $id;" 2>$null

        Write-Host "OK ($($imgPaths.Count))"
        $success++
    }
    catch {
        Write-Host "ERROR: $($_.Exception.Message)"
        $failed++
    }

    # 20 seconds between requests = 180/hr, under 200/hr limit
    Start-Sleep -Seconds 20
}

Write-Host "`n=== RETRY COMPLETE: $success OK, $failed FAILED ==="
