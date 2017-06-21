# Puppet Language Server

## Description

The Puppet Language Server is an out-of-process server which a language server client can conect to and then issue requests for long running tasks.  For example, parsing files for validity or installing a module.

The language server complies with version 3.0 of the [Language Server Protocol](https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md) although not all capabilities are implemented.  For example the `documentSymbol` provider is not available to the client.

The architecture of the puppet language server is that:

- The language server is written in Ruby which means it has access to a pretty much every thing Puppet Agent does; facts, parser, lexer, compiler etc..  This means the language server is extremely powerful

- It _only_ requires the ruby environment from the Puppet Agent to be able to run.  This means gems with Native Extensions can not be used, and that any gems not explicitly supplied by Puppet Agent must be vendored inside the langauge server.

Note - This requirement may disappear with the advent of a Puppet SDK, however at the time of writing that was not available.

## Source Layout

The source code for the language server is laid out as follows:

```
+- lib
|    +- languageserver
|    |    +- Files in this directory are for creating the various
|    |       generic messages as part of the language server protocol
|    |
|    +- puppet-languageserver
|         +- Files in this directory are for the implementing the
|            actual puppet language server
|
+- puppet-languageserver - This file is the main entrypoint to run the server
```

The server README contains information on how to run the server

## Architecture

The language server is built up in layers, similar to the OSI model in networking; where each layer builds up on top the next.

```
+-----------------------------+
|                             |
|  Puppet / Facter / Hiera    |
|                             |
+-----------------------------+
|                             |
|  Puppet Helpers             |
|                             |
+-----------------------------+
|                             |
|  Providers                  |
|                             |
+-----------------------------+
|                             |
|  Message Router             |
|                             |
+-----------------------------+
|                             |
|  JSON RPC Handler           |
|                             |
+-----------------------------+
|                             |
|  Generic client connection  |
|                             |
+-----------------------------+
|                             |
|  TCP Server                 |
|                             |
+-----------------------------+
```

### TCP Server

The TCP server (`simple_tcp_server.rb`) is responsible for listening on a TCP port and then transferring raw data to/from client socket to the `Generic client connection` layer

### Generic client connection

The client connection (`simple_tcp_server.rb`) exposes very simple methods to receive data from a client, send data to a client and close a connection to a client.

### JSON RPC Handler

The JSON RPC Handler (`json_rpc_handler.rb`) receives the raw bytes from the connection and extracts the [JSON RPC](http://www.jsonrpc.org/specification) headers and message and passes it to the `Message Router` layer.  Conversely, the handler will take response from the `Message Router` and wrap them in the required JSON RPC headers prior to transmission.

### Message Router

The message router (`message_router.rb`) receives requests and notifications, as defined by the [language server protocol](https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#base-protocol-json-structures) and then either deals with the messages directly or calls on a `Provider` to calculate the correct response.

The `Message Router` also holds a virtual document store, which contains an in-memory copy of the documents being edited on the language client.

### Providers

The provider classes (`completion_provider.rb`, `document_validator.rb`, `hover_provider.rb`) implement the various puppet languages services.  Typically they mirror the language service services, e.g. the `textDocument/hover` request is serviced by the hover provider.

### Puppet Helpers

Many of the providers use common code.  The Puppet Helpers (`facter_helper.rb`, `puppet_helper.rb`, `puppet_parser_helper.rb`) abstract away common tasks which make the providers smaller and easier to edit.  The helpers also provider a caching layer so that
Puppet and Facter do not need to be evaluated as often, for example getting all of the facter facts.

### Puppet / Facter / Hiera

At this layer any calls are using Puppet directly, for example; Calling facter or executing a catalog compilation.

