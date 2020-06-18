[cmdletbinding()]
param(
  [string[]]$Task = 'default',
  $properties
)

if (!(Get-Module -Name psake -ListAvailable)) {
  Install-Module -Name psake -Scope CurrentUser -Force
}

Invoke-psake `
  -buildFile "$PSScriptRoot\psakefile.ps1" `
  -properties $properties `
  -taskList $Task `
  -Verbose:$VerbosePreference
