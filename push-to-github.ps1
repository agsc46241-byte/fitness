# push-to-github.ps1
# A script to push the app files to GitHub using the GitHub REST API.

param (
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$owner = "agsc46241-byte"
$repo = "final-fitness-truth-app"
$files = @("index.html", "styles.css", "app.js")

$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept"        = "application/vnd.github+json"
    "User-Agent"    = "PowerShell-GitHub-Uploader"
}

foreach ($file in $files) {
    Write-Host "Processing $file..."
    
    # Path to local file
    $localPath = Join-Path $PSScriptRoot $file
    if (-not (Test-Path $localPath)) {
        Write-Warning "Local file $file not found. Skipping."
        continue
    }
    
    # Read file and encode to base64
    $bytes = [System.IO.File]::ReadAllBytes($localPath)
    $base64Content = [Convert]::ToBase64String($bytes)
    
    # GitHub API URL for this file
    $apiUrl = "https://api.github.com/repos/$owner/$repo/contents/$file"
    
    # Check if file already exists on GitHub to get its SHA
    $sha = $null
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Method Get -Headers $headers -ErrorAction Stop
        $sha = $response.sha
        Write-Host "File $file exists on GitHub (SHA: $sha). Will perform an update."
    } catch {
        # File doesn't exist, which is fine for a first commit
        Write-Host "File $file does not exist on GitHub yet. Will perform a new creation."
    }
    
    # Prepare payload
    $body = @{
        message = "Upload $file via Crucible Forge Uploader"
        content = $base64Content
    }
    if ($sha) {
        $body.sha = $sha
    }
    
    $jsonBody = $body | ConvertTo-Json -Depth 5
    
    # Send PUT request to create/update the file
    try {
        $uploadResponse = Invoke-RestMethod -Uri $apiUrl -Method Put -Headers $headers -Body $jsonBody -ContentType "application/json" -ErrorAction Stop
        Write-Host "Successfully uploaded $file!" -ForegroundColor Green
    } catch {
        Write-Error "Failed to upload $file. Error: $_"
    }
}
