require 'debugserver/debug_protocol'
require 'puppet-vscode'

%w[json_handler message_router hooks puppet_debug_session debug_hook_handlers puppet_debug_breakpoints puppet_monkey_patches].each do |lib|
  begin
    require "puppet-debugserver/#{lib}"
  rescue LoadError
    require File.expand_path(File.join(File.dirname(__FILE__), 'puppet-debugserver', lib))
  end
end

require 'optparse'
require 'logger'

module PuppetDebugServer
  class CommandLineParser
    def self.parse(options)
      # Set defaults here
      args = {
        port: 8082,
        ipaddress: '127.0.0.1',
        stop_on_client_exit: true,
        connection_timeout: 10,
        debug: nil
      }

      opt_parser = OptionParser.new do |opts|
        opts.banner = 'Usage: puppet-debugserver.rb [options]'

        opts.on('-pPORT', '--port=PORT', "TCP Port to listen on.  Default is #{args[:port]}") do |port|
          args[:port] = port.to_i
        end

        opts.on('-ipADDRESS', '--ip=ADDRESS', "IP Address to listen on (0.0.0.0 for all interfaces).  Default is #{args[:ipaddress]}") do |ipaddress|
          args[:ipaddress] = ipaddress
        end

        opts.on('-tTIMEOUT', '--timeout=TIMEOUT', "Stop the Debug Server if a client does not connection within TIMEOUT seconds.  A value of zero will not timeout.  Default is #{args[:connection_timeout]} seconds") do |timeout|
          args[:connection_timeout] = timeout.to_i
        end

        opts.on('--debug=DEBUG', "Output debug information.  Either specify a filename or 'STDOUT'.  Default is no debug output") do |debug|
          args[:debug] = debug
        end

        opts.on('-h', '--help', 'Prints this help') do
          puts opts
          exit
        end

        opts.on('-v', '--version', 'Prints the Debug Server version') do
          puts PuppetVSCode.version
          exit
        end
      end

      opt_parser.parse!(options.dup)
      args
    end
  end

  def self.log_message(severity, message)
    PuppetVSCode.log_message(severity, message)
  end

  def self.init_puppet(options)
    PuppetVSCode.init_logging(options)
    log_message(:info, "Debug Server is v#{PuppetVSCode.version}")

    true
  end

  def self.rpc_server(options)
    log_message(:info, 'Starting RPC Server...')

    server = PuppetVSCode::SimpleTCPServer.new

    options[:servicename] = 'DEBUG SERVER'

    server.add_service(options[:ipaddress], options[:port])
    trap('INT') { server.stop_services(true) }
    server.start(PuppetDebugServer::MessageRouter, options, 2)

    log_message(:info, 'Debug Server exited.')
  end
end
