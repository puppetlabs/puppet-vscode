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

By default the language server will stop if no connection is made within 10 seconds and will also stop after a client disconnects.

```
> bundle install

> bundle exec ruby ./puppet-languageserver --debug=stdout
I, [2017-06-01T20:48:22.295769 #14028]  INFO -- : Using Puppet v4.10.1
I, [2017-06-01T20:48:22.296271 #14028]  INFO -- : Initializing settings...
I, [2017-06-01T20:48:22.306770 #14028]  INFO -- : Creating puppet function environment...
I, [2017-06-01T20:48:23.942964 #14028]  INFO -- : Using Facter v2.4.6
I, [2017-06-01T20:48:23.942964 #14028]  INFO -- : Preloading Facter (Async)...
I, [2017-06-01T20:48:23.943479 #14028]  INFO -- : Preloading Puppet Types (Async)...
I, [2017-06-01T20:48:23.943966 #14028]  INFO -- : Preloading Functions (Async)...
I, [2017-06-01T20:48:23.944964 #14028]  INFO -- : Starting RPC Server...
D, [2017-06-01T20:48:23.947964 #14028] DEBUG -- : TCPSRV: Services running. Press ^C to stop
D, [2017-06-01T20:48:23.947964 #14028] DEBUG -- : TCPSRV: Will stop the server in 10 seconds if no connection is made.
D, [2017-06-01T20:48:23.948464 #14028] DEBUG -- : TCPSRV: Will stop the server when client disconnects
LANGUAGE SERVER RUNNING 127.0.0.1:8081
D, [2017-06-01T20:48:23.953964 #14028] DEBUG -- : TCPSRV: Started listening on 127.0.0.1:8081.
D, [2017-06-01T20:48:36.013438 #14028] DEBUG -- : TCPSRV: No connection has been received in 10 seconds.  Shutting down server.
D, [2017-06-01T20:48:36.013917 #14028] DEBUG -- : TCPSRV: Stopping services
D, [2017-06-01T20:48:36.014417 #14028] DEBUG -- : TCPSRV: Stopped listening on 127.0.0.1:8081
D, [2017-06-01T20:48:36.014417 #14028] DEBUG -- : TCPSRV: Started shutdown process. Press ^C to force quit.
D, [2017-06-01T20:48:36.014917 #14028] DEBUG -- : TCPSRV: Stopping services
D, [2017-06-01T20:48:36.014917 #14028] DEBUG -- : TCPSRV: Waiting for workers to cycle down
I, [2017-06-01T20:48:36.020416 #14028]  INFO -- : Language Server exited....
```

To make the server run continuously add `--timeout=0` and `--no-stop` to the command line. For example;

```
> bundle exec ruby ./puppet-languageserver --debug=stdout --timeout=0 --no-stop
I, [2017-06-01T20:52:07.965708 #19760]  INFO -- : Using Puppet v4.10.1
I, [2017-06-01T20:52:07.966193 #19760]  INFO -- : Initializing settings...
I, [2017-06-01T20:52:07.978691 #19760]  INFO -- : Creating puppet function environment...
I, [2017-06-01T20:52:09.431437 #19760]  INFO -- : Using Facter v2.4.6
I, [2017-06-01T20:52:09.431437 #19760]  INFO -- : Preloading Facter (Async)...
I, [2017-06-01T20:52:09.432938 #19760]  INFO -- : Preloading Puppet Types (Async)...
I, [2017-06-01T20:52:09.433438 #19760]  INFO -- : Preloading Functions (Async)...
I, [2017-06-01T20:52:09.434440 #19760]  INFO -- : Starting RPC Server...
D, [2017-06-01T20:52:09.436939 #19760] DEBUG -- : TCPSRV: Services running. Press ^C to stop
LANGUAGE SERVER RUNNING 127.0.0.1:8081
D, [2017-06-01T20:52:09.443956 #19760] DEBUG -- : TCPSRV: Started listening on 127.0.0.1:8081.
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
LANGUAGE SERVER RUNNING 127.0.0.1:8081
```

Note the language server will stop after 10 seconds if no client connection is made.

## Command line arguments

```
Usage: puppet-languageserver.rb [options]
    -p, --port=PORT                  TCP Port to listen on.  Default is 8081
    -i, --ip=ADDRESS                 IP Address to listen on (0.0.0.0 for all interfaces).  Default is 127.0.0.1
    -c, --no-stop                    Do not stop the language server once a client disconnects.  Default is to stop
    -t, --timeout=TIMEOUT            Stop the language server if a client does not connection within TIMEOUT seconds.  A value of zero will not timeout.  Default is 10 seconds
    -d, --no-preload                 Do not preload Puppet information when the language server starts.  Default is to preload
        --debug=DEBUG                Output debug information.  Either specify a filename or 'STDOUT'.  Default is no debug output
    -s, --slow-start                 Delay starting the TCP Server until Puppet initialisation has completed.  Default is to start fast
    -h, --help                       Prints this help
```

## Why are there vendored gems and why only native ruby

When used by VSCode this language server will be running using the Ruby runtime provided by Puppet Agent.  That means no native extensions and no bundler.  Also, only the gems provided by Puppet Agent would be available by default.  To work around this limitation all runtime dependencies should be re-vendored and then the load path modified appropriately.
