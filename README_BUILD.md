# Puppet Language Support for Visual Studio Code

This extension provides Puppet Language support for [Visual Studio Code](https://code.visualstudio.com/)

## How to run the client and server for development

### Setup the client

* Ensure nodejs is installed

* Clone this repository

```bash
> git clone https://github.com/lingua-pupuli/puppet-vscode.git

> cd puppet-vscode
```

* Install the node modules

```bash
> npm install
...

> puppet-vscode@0.0.3 postinstall C:\Source\puppet-vscode\client
> node ./node_modules/vscode/bin/install
...
Detected VS Code engine version: ^1.10.0
Found minimal version that qualifies engine range: 1.10.0
Fetching vscode.d.ts from: https://raw.githubusercontent.com/Microsoft/vscode/1.10.0/src/vs/vscode.d.ts
vscode.d.ts successfully installed!
```

### Vendoring other resources

The following resources are vendored into the extension;

* Puppet Editor Services (`editor-services`)

* Puppet Editor Syntax (`editor-syntax`)

By default the extension will use the specified versions in the `editor-components.json` file when vendoring resources.

#### Example configuration

The following examples use `editor-services`, however the configuration settings can be used on any resource.

##### By release tag

To use version `0.10.0` of the Editor Services;

``` json
{
  "editor-services": {
    "release": "0.10.0"
  }
}
```

##### Specific github repository or branch

To use a specific GitHub repository that contains the Puppet Editor services, use the `githubref` configuration setting; for example to use the `puppet-editing` repository, owned by `Alice` with the `testing` branch

``` json
{
  "editor-services": {
    "githubuser": "Alice",
    "githubrepo": "puppet-editing",
    "githubref": "testing"
  }
}
```

Note - For `editor-services` the default the githubuser is `lingua-pupuli` and the githubrepo is `puppet-editor-services`

Note - For `editor-syntax` the default the githubuser is `lingua-pupuli` and the githubrepo is `puppet-editor-syntax`

Note - Use the full length commit SHA for `githubref`, not the abbreviated eight character SHA

##### Using a local directory

To use a local directory that contains the Puppet Editor services, use the `directory` configuration setting; for example if the the editor services was located in `C:\puppet-editor-services` use the following;

``` json
{
  "editor-services": {
    "directory": "C:\\puppet-editor-services"
  }
}
```

Note - Backslashes in the path must be escaped.

### Vendoring the resources into the extension

* Use gulp to vendor the resources

```bash
> node node_modules/gulp/bin/gulp.js --series clean vendor
[15:00:21] Using gulpfile C:\Source\puppet-vscode\gulpfile.js
[15:00:21] Starting 'clean'...
[15:00:21] Finished 'clean' after 7.9 ms
[15:00:21] Starting 'vendor'...
[15:00:21] Starting 'vendor_editor_services'...
[15:00:25] Finished 'vendor_editor_services' after 3.88 s
[15:00:25] Starting 'vendor_editor_syntax'...
[15:00:27] Finished 'vendor_editor_syntax' after 2.24 s
[15:00:27] Finished 'vendor' after 6.13 s
```

* Start VS Code

```bash
> code .
```

* Once VS Code is running, press `F5` to start a build and a new VS Code development instance should start

* Open a Puppet file (.pp) and the client will start and connect to the Puppet Server

> Other Puppet VS Code extensions may cause issues with the development instance.  Ensure that you either uninstall or disable the other Puppet extensions prior.

## Issues

Please raise issues for the Language Server or Extension using the GitHub [issue tracker](https://github.com/lingua-pupuli/puppet-vscode/issues/new).
