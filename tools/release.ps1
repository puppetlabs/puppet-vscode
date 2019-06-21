param(
  [parameter(Mandatory = $true)]
  [String]$ReleaseVersion,

  [parameter(Mandatory = $true)]
  [String]$GitHubUsername,

  [parameter(Mandatory = $true)]
  [String]$GitHubToken
)

$ErrorActionPreference = 'Stop'

# Adapted from https://www.herebedragons.io/powershell-create-github-release-with-artifact
function Update-GitHubRelease {
  param(
    $VersionNumber,
    $PreRelease,
    $ReleaseNotes,
    $ArtifactOutputDirectory,
    $GitHubUsername,
    $GitHubRepository,
    $GitHubApiUsername,
    $GitHubApiKey
  )

  $draft = $false

  $auth = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($gitHubApiUsername + ':' + $gitHubApiKey));

  # Github uses TLS 1.2
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

  # Find existing release
  $ReleaseDetails = $null
  $releaseParams = @{
    Uri         = "https://api.github.com/repos/$gitHubUsername/$gitHubRepository/releases/tags/$versionNumber";
    Method      = 'GET';
    ContentType = 'application/json';
    Headers     = @{
      Authorization = $auth;
    }
  }

  try {
    $ReleaseDetails = Invoke-RestMethod @releaseParams
  }
  catch {
    # Release is missing, create it
    $ReleaseDetails = $null
  }

  if ($ReleaseDetails -eq $null) {
    Write-Host "Creating release $versionNumber"
    # Create a release
    $releaseData = @{
      tag_name   = [string]::Format("{0}", $versionNumber);
      name       = [string]::Format("{0}", $versionNumber);
      body       = $releaseNotes;
      draft      = $draft;
      prerelease = $preRelease;
    }
    $releaseParams = @{
      ContentType = 'application/json'
      Uri         = "https://api.github.com/repos/$gitHubUsername/$gitHubRepository/releases";
      Method      = 'POST';
      Headers     = @{
        Authorization = $auth;
      }
      Body        = (ConvertTo-Json $releaseData -Compress)
    }
    $ReleaseDetails = Invoke-RestMethod @releaseParams
  }
  else {
    Write-Host "Updating release $versionNumber"
    # Create a release
    $releaseData = @{
      tag_name   = [string]::Format("{0}", $versionNumber);
      name       = [string]::Format("{0}", $versionNumber);
      body       = $releaseNotes;
      draft      = $draft;
      prerelease = $preRelease;
    }
    $releaseParams = @{
      ContentType = 'application/json'
      Uri         = "https://api.github.com/repos/$gitHubUsername/$gitHubRepository/releases/$($ReleaseDetails.id)";
      Method      = 'PATCH';
      Headers     = @{
        Authorization = $auth;
      }
      Body        = (ConvertTo-Json $releaseData -Compress)
    }
    $ReleaseDetails = Invoke-RestMethod @releaseParams
  }

  # Upload assets
  $uploadUri = $ReleaseDetails | Select-Object -ExpandProperty upload_url
  $uploadUri = $uploadUri -creplace '\{\?name,label\}'

  if (Test-Path -Path $artifactOutputDirectory) {
    Get-ChildItem -Path $artifactOutputDirectory | ForEach-Object {
      $filename = $_.Name
      $filepath = $_.Fullname
      Write-Host "Uploading $filename ..."

      $uploadParams = @{
        Uri         = $uploadUri;
        Method      = 'POST';
        Headers     = @{
          Authorization = $auth;
        }
        ContentType = 'application/text';
        InFile      = $filepath
      }

      if ($filename -match '\.zip$') {
        $uploadParams.ContentType = 'application/zip'
      }
      if ($filename -match '\.gz$') {
        $uploadParams.ContentType = 'application/tar+gzip'
      }
      $uploadParams.Uri += "?name=$filename"

      Invoke-RestMethod @uploadParams | Out-Null
    }
  } else {
    Write-Host "No assets to upload as '$artifactOutputDirectory' doesn't exist"
  }
}

function Get-ReleaseNotes {
  param($Version)

  Write-Host "Getting release notes for version $Version ..."

  $changelog    = Join-Path -Path $PSScriptRoot -ChildPath '..\CHANGELOG.md'
  $releaseNotes = $null
  $inSection    = $false

  Get-Content $changelog | ForEach-Object {
    $line = $_

    if ($inSection) {
      if ($line -match "^## ") {
        $inSection = $false
      }
      else {
        $releaseNotes = $releaseNotes + "`n" + $line
      }
    }
    else {
      if (($line -match "^## \[${version}\] ") -or ($line -match "^## ${version} ")) {
        $releaseNotes = $line
        $inSection = $true
      }
    }
  }

  return ($releaseNotes -replace "\[${version}\]", $version)
}

$params = @{
  VersionNumber           = $releaseVersion
  PreRelease              = $false
  ReleaseNotes            = (Get-ReleaseNotes -Version $releaseVersion)
  ArtifactOutputDirectory = 'output'
  GitHubUsername          = 'lingua-pupuli'
  GitHubRepository        = 'puppet-vscode'
  GitHubApiUsername       = $GitHubUsername
  GitHubApiKey            = $GitHubToken
}
Update-GitHubRelease @params
