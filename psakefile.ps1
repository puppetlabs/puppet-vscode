properties {
  $config = Get-Content (Join-Path $PSScriptRoot 'package.json') | ConvertFrom-Json
  $languageServerPath = (Join-Path $PSScriptRoot 'vendor/languageserver')
  $languageServerZip = Join-Path $PSScriptRoot 'editor_services.zip'
  $syntaxFilePath = Join-Path $PSScriptRoot 'syntaxes/puppet.tmLanguage'
  $packageVersion = ''
}

task Clean {
  $languageServerPath = (Join-Path $PSScriptRoot 'vendor')
  if (Test-Path -Path $languageServerPath) {
    Remove-Item -Path $languageServerPath -Recurse -Force
  }
  if (Test-Path -Path $syntaxFilePath) {
    Remove-Item -Path $syntaxFilePath -Force
  }
}

# "editorServices": {
#   "release": "0.26.0"
# }
# "editorServices": {
#   "release": "0.26.0"
#   "githubrepo": "puppet-editor-services",
#   "githubuser": "glennsarti"
# }
  # "editorServices": {
#   "githubrepo": "puppet-editor-services",
#   "githubref": "glennsarti:spike-rearch-langserver"
# },
task VendorEditorServices {
  $githubrepo = $config.editorComponents.editorServices.githubrepo ?? 'puppet-editor-services'
  $githubuser = $config.editorComponents.editorServices.githubuser ?? 'puppetlabs'

  if($config.editorComponents.editorServices.release){
    $releasenumber = $config.editorComponents.editorServices.release
    $uri = "https://github.com/${githubuser}/${githubrepo}/releases/download/${releasenumber}/puppet_editor_services_${releasenumber}.zip";
  }else{
    $githubref = $config.editorComponents.editorServices.githubref;
    if($githubref -notcontains ':'){
      throw "Invalid githubref. Must be in user:branch format like glennsarti:spike-rearch-langserver"
    }
    $githubuser = $githubref.split(":")[0]
    $githubbranch = $githubref.split(":")[1]
    $uri = "https://github.com/${githubuser}/${githubrepo}/archive/${githubbranch}.zip"
  }

  if ($config.editorComponents.editorServices.directory) {
    Copy-Item -Path $config.editorComponents.editorServices.directory -Destination $languageServerPath -Recurse -Force
  }elseif ($config.editorComponents.editorServices.release) {
    Invoke-RestMethod -Uri $uri -OutFile $languageServerZip -ErrorAction Stop
    Expand-Archive -Path $languageServerZip -DestinationPath $languageServerPath -ErrorAction Stop
    Remove-Item -Path $languageServerZip -Force
  }
  elseif ($config.editorComponents.editorServices.githubref) {
    Invoke-RestMethod -Uri $uri -OutFile $languageServerZip -ErrorAction Stop
    Expand-Archive -Path $languageServerZip -DestinationPath "$($languageServerPath)/tmp" -ErrorAction Stop
    Move-Item -Path (Join-Path $languageServerPath "tmp/$githubrepo-$githubref/*") -Destination $languageServerPath
    Remove-Item -Path $languageServerZip -Force
    Remove-Item -Path "$($languageServerPath)/tmp" -Force -Recurse
  }
  else {
    throw "Unable to vendor Editor Serices. Missing a release, directory, or git reference configuration item"
  }
}

task VendorEditorSyntax {
  if ($config.editorComponents.editorSyntax.githubuser) {
    $githubuser = $config.editorComponents.editorSyntax.githubuser
  }
  else {
    $githubuser = 'lingua-pupuli'
  }
  if ($config.editorComponents.editorSyntax.githubrepo) {
    $githubrepo = $config.editorComponents.editorSyntax.githubrepo
  }
  else {
    $githubrepo = 'puppet-editor-syntax'
  }

  if ($config.editorComponents.editorSyntax.directory) {
    $source = Join-Path ($config.editorComponents.editorSyntax.directory, 'syntaxes/puppet.tmLanguage')
    Copy-Item -Path $source -Destination $syntaxFilePath
    return
  }

  if ($config.editorComponents.editorSyntax.release) {
    $releasenumber = $config.editorComponents.editorSyntax.release
    $uri = "https://github.com/${githubuser}/${githubrepo}/releases/download/${releasenumber}/puppet.tmLanguage";
  }
  elseif ($config.editorComponents.editorSyntax.githubref) {
    $githubref = $config.editorComponents.editorSyntax.githubref;
    $uri = "https://raw.githubusercontent.com/${githubuser}/${githubrepo}/${githubref}/syntaxes/puppet.tmLanguage"
  }
  else {
    throw "Unable to vendor Editor Syntax.  Missing a release, directory, or git reference configuration item"
  }

  Invoke-RestMethod -Uri $uri -OutFile $syntaxFilePath -ErrorAction Stop 
}

task VendorCytoscape {
  $cyto = Join-Path $PSScriptRoot 'node_modules\cytoscape\dist'
  $vendorCytoPath = (Join-Path $PSScriptRoot 'vendor\cytoscape')
  Copy-Item -Path $cyto -Recurse -Destination $vendorCytoPath
}

task CompileTypeScript {
  exec { tsc -p ./ }
}

task Bump {
  exec { npm version --no-git-tag-version $packageVersion }
}

task Npm {
  exec { npm install }
}

task Vendor -depends VendorEditorServices, VendorEditorSyntax, VendorCytoscape

task Build -depends Clean, Npm, Vendor, CompileTypeScript

task Initial -depends Clean, Vendor

task default -depends Build
