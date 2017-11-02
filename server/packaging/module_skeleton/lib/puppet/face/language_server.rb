require 'puppet/face'

Puppet::Face.define(:language_server, '0.1.0') do
  license "Apache 2"

  copyright "James Pogran", 2017

  summary "Create a Puppet Language Server for a client to connect to"

  description <<-DESCRIPTION
    The 'language_server' Face provides a tool to start a Puppet Language Server.
    This server implements the Language Server Protocol (https://github.com/Microsoft/language-server-protocol)
    over a TCP connection which clients can connect to; for example text editors such as Visual Studio Code.
  DESCRIPTION

  examples <<-EXAMPLES
    # Start a language server with default settings
    ] puppet language_server start

    # Start a language server with not connection timeout, will not stop after a client disconnects and listens on all
    # interfaces
    ] puppet language_server start --timeout=0 --no-stop --debug=stdout --ip=0.0.0.0

    # Start a language server with settings to quickly connect a client
    ] puppet language_server quickstart
  EXAMPLES

  deactivate_action(:destroy)
  deactivate_action(:search)
end
