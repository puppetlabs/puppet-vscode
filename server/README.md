# Puppet Language Server

A ruby based JSON RPC server that provides Puppet Language support for the [Language Server Protocol](https://github.com/Microsoft/language-server-protocol)

**Note** - This project is experimental

## How to run the Language Server for Development

* Ensure a modern ruby is installed (2.2+)

* Clone this repository


```
> git clone https://github.com/jpogran/puppet-vscode.git

> cd puppet-vscode
> cd server
```

* Set the `EventMachine` environment variable

There is a bug in the EventMachine code which prevents using a pure ruby TCP Server.  For the moment, use EventMachine with native extensions

On Linux etc.
```bash
> export NATIVE_EVENTMACHINE=true
```

On Windows
```powershell
PS> $ENV:NATIVE_EVENTMACHINE = 'true'
```

* Bundle the development gems

* Run the Language Server

```
> bundle install

> bundle exec ruby ./puppet-languageserver
[INFORMATION] Using Puppet v4.10.1
[INFORMATION] Initializing settings...
[INFORMATION] Creating puppet function environment...
[INFORMATION] Using Facter v2.4.6
[INFORMATION] Preloading Facter (Async)...
...
```

## Why are there vendored gems and why only native ruby

When used by VSCode this language server will be running using the Ruby runtime provided by Puppet Agent.  That means no native extensions and no bundler.  Also, only the gems provided by Puppet Agent would be available by default.  To work around this limitation all runtime dependencies should be re-vendored and then the load path modified appropriately.
