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

## How to run the Language Server in Production

* Ensure that Puppet Agent is installed

[Linux](https://docs.puppet.com/puppet/4.10/install_linux.html)

[Windows](https://docs.puppet.com/puppet/4.10/install_windows.html)

[MacOSX](https://docs.puppet.com/puppet/4.10/install_osx.html)


* Clone this repository

```
> git clone https://github.com/jpogran/puppet-vscode.git

> cd puppet-vscode
> cd server
```

* Run the `puppet-languageserver` with ruby

> On Windows you need to run ruby with the `Puppet Command Prompt` which can be found in the Start Menu.  This enables the Puppet Agent ruby environment.

```
> ruby puppet-languageserver
[INFORMATION] Using Puppet v4.10.1
[INFORMATION] Initializing settings...
[INFORMATION] Creating puppet function environment...
[INFORMATION] Using Facter v2.4.6
[INFORMATION] Preloading Facter (Async)...
```

## Command line arguments

```
Usage: puppet-languageserver.rb [options]
    -p, --port=PORT                  TCP Port to listen on.  Default is 8081
    -i, --ip=ADDRESS                 IP Address to listen on (0.0.0.0 for all interfaces).  Default is 127.0.0.1
    -c, --no-stop                    Do not stop the language server once a client disconnects.  Default is to stop
    -t, --timeout=TIMEOUT            Stop the language server if a client does not connection within TIMEOUT seconds.  A value of zero will not timeout.  Default is 10 seconds
    -d, --no-preload                 Do not preload Puppet information when the language server starts.  Default is to preload
        --debug=DEBUG                Output debug information.  Either specify a filename or 'STDOUT'.  Default is no debug output
    -h, --help                       Prints this help
```

## Why are there vendored gems and why only native ruby

When used by VSCode this language server will be running using the Ruby runtime provided by Puppet Agent.  That means no native extensions and no bundler.  Also, only the gems provided by Puppet Agent would be available by default.  To work around this limitation all runtime dependencies should be re-vendored and then the load path modified appropriately.
