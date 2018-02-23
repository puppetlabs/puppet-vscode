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
I, [2017-06-08T13:22:59.742612 #8004]  INFO -- : Language Server is v0.0.1
I, [2017-06-08T13:22:59.743611 #8004]  INFO -- : Using Puppet v4.10.1
I, [2017-06-08T13:22:59.743611 #8004]  INFO -- : Initializing settings...
I, [2017-06-08T13:22:59.744608 #8004]  INFO -- : Starting RPC Server...
D, [2017-06-08T13:22:59.750607 #8004] DEBUG -- : TCPSRV: Services running. Press ^C to stop
D, [2017-06-08T13:22:59.751609 #8004] DEBUG -- : TCPSRV: Will stop the server in 10 seconds if no connection is made.
D, [2017-06-08T13:22:59.751609 #8004] DEBUG -- : TCPSRV: Will stop the server when client disconnects
LANGUAGE SERVER RUNNING 127.0.0.1:8081
D, [2017-06-08T13:22:59.752611 #8004] DEBUG -- : TCPSRV: Started listening on 127.0.0.1:8081.
I, [2017-06-08T13:22:59.761607 #8004]  INFO -- : Creating puppet function environment...
I, [2017-06-08T13:23:01.396607 #8004]  INFO -- : Using Facter v2.4.6
I, [2017-06-08T13:23:01.396607 #8004]  INFO -- : Preloading Facter (Async)...
I, [2017-06-08T13:23:01.398609 #8004]  INFO -- : Preloading Puppet Types (Async)...
I, [2017-06-08T13:23:01.398609 #8004]  INFO -- : Preloading Functions (Async)...
D, [2017-06-08T13:23:10.606536 #8004] DEBUG -- : TCPSRV: No connection has been received in 10 seconds.  Shutting down server.
D, [2017-06-08T13:23:10.606536 #8004] DEBUG -- : TCPSRV: Stopping services
D, [2017-06-08T13:23:10.616540 #8004] DEBUG -- : TCPSRV: Stopped listening on 127.0.0.1:8081
D, [2017-06-08T13:23:10.616540 #8004] DEBUG -- : TCPSRV: Started shutdown process. Press ^C to force quit.
D, [2017-06-08T13:23:10.616540 #8004] DEBUG -- : TCPSRV: Stopping services
D, [2017-06-08T13:23:10.617520 #8004] DEBUG -- : TCPSRV: Waiting for workers to cycle down
I, [2017-06-08T13:23:10.648516 #8004]  INFO -- : Language Server exited.
```

To make the server run continuously add `--timeout=0` and `--no-stop` to the command line. For example;

```
> bundle exec ruby ./puppet-languageserver --debug=stdout --timeout=0 --no-stop
I, [2017-06-08T13:23:38.586369 #18496]  INFO -- : Language Server is v0.0.1
I, [2017-06-08T13:23:38.587368 #18496]  INFO -- : Using Puppet v4.10.1
I, [2017-06-08T13:23:38.587368 #18496]  INFO -- : Initializing settings...
I, [2017-06-08T13:23:38.588362 #18496]  INFO -- : Starting RPC Server...
D, [2017-06-08T13:23:38.595352 #18496] DEBUG -- : TCPSRV: Services running. Press ^C to stop
LANGUAGE SERVER RUNNING 127.0.0.1:8081
D, [2017-06-08T13:23:38.595352 #18496] DEBUG -- : TCPSRV: Started listening on 127.0.0.1:8081.
I, [2017-06-08T13:23:38.603353 #18496]  INFO -- : Creating puppet function environment...
I, [2017-06-08T13:23:40.473284 #18496]  INFO -- : Using Facter v2.4.6
I, [2017-06-08T13:23:40.473284 #18496]  INFO -- : Preloading Facter (Async)...
I, [2017-06-08T13:23:40.473788 #18496]  INFO -- : Preloading Puppet Types (Async)...
I, [2017-06-08T13:23:40.474286 #18496]  INFO -- : Preloading Functions (Async)...
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
        --stdio                      Runs the server in stdio mode, without a TCP listener
        --local-workspace=PATH       The workspace or file path that will be used to provide module-specific functionality. Default is no workspace path.
    -h, --help                       Prints this help
    -v, --version                    Prints the Langauge Server version
```

## Why are there vendored gems and why only native ruby

When used by VSCode this language server will be running using the Ruby runtime provided by Puppet Agent.  That means no native extensions and no bundler.  Also, only the gems provided by Puppet Agent would be available by default.  To work around this limitation all runtime dependencies should be re-vendored and then the load path modified appropriately.

## Known Issues

* [PUP-7668](https://tickets.puppetlabs.com/browse/PUP-7668) Due to incorrect offsets, hover documentation can be displayed when the user is not actually hovering over the resource that the documentation is for.
