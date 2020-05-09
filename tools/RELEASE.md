# Release Puppet Extension for VSCode

## Pre-release steps

### Vendor Latest Puppet Language Server and Syntax Files

1. Ensure [puppet-editor-services](https://github.com/puppetlabs/puppet-editor-services) has been tagged and release process followed. Note version.
1. Ensure [puppet-editor-syntax](https://github.com/puppetlabs/puppet-editor-syntax) has been tagged and release process followed. Note version.
1. `git clone https://github.com/puppetlabs/puppet-vscode` or `git clean -xfd` on working copy
1. Update `editor-components.json` with latest `puppet-editor-services` and `puppet-editor-syntax` versions. These can be seperate commits
1. Create PR

## Prepare VSCode extension

1. `git clone https://github.com/puppetlabs/puppet-vscode` or `git clean -xfd` on working copy
1. Update `CHANGELOG` with all tickets from release milestone for `puppet-vscode`, and any tickets from `puppet-editor-services` and `puppet-editor-syntax` that apply to this release.
1. Increment `version` field of `package.json`
1. Run `npm install` to update `package-lock.json`
1. `git commit -m '(maint) Release <version>'`
1. Create release PR

## Package VSCode extension

1. `git clone https://github.com/puppetlabs/puppet-vscode` or `git clean -xfd` on working copy
1. `git tag -a '<version>' -m '<version>' <commit id>`
1. `git push <remote> <version>`
1. `git checkout <version>`
1. `git reset --hard <version>`
1. `mkdir 'output'`
1. `npm install` (this should produce no changes, but package-lock.json may be different, safe to ignore)
1. `npx vsce package`
1. `mv "puppet-vscode-*.vsix" 'output'`
1. `./tools/release.ps1 -releaseversion <version> -guthubusername 'lingua-pupuli' -githubtoken <token>`

## Publish VSCode extnsion

1. Install personal access token from https://pogran.visualstudio.com/puppet-vscode ([instructions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token))
1. `git clone https://github.com/puppetlabs/puppet-vscode` or `git clean -xfd` on working copy
1. `npm install`
1. `npmx vsce publish`

## Update the `puppet-vscode` docs website

1. Checkout `https://github.com/lingua-pupuli/docs`
1. Run the release update PowerShell script

   ``` powershell
   PS> docs/vscode/update-from-source.ps1 -ExtensionSourcePath C:\puppet-vscode
   ```
   
1. Create a commit for the changes and raise a Pull Request
