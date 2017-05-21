require 'languageserver/languageserver'

%w(simple_tcp_server json_rpc_handler message_router server_capabilities document_validator
   puppet_parser_helper puppet_helper facter_helper completion_provider hover_provider).each do |lib|
  begin
    require "puppet-languageserver/#{lib}"
  rescue LoadError
    require File.expand_path(File.join(File.dirname(__FILE__), 'puppet-languageserver', 'lib'))
  end
end

require 'puppet'
require 'optparse'

module PuppetLanguageServer
  class CommandLineParser
    def self.parse(options)
      # Set defaults here
      args = {
        :port                => 8081,
        :ipaddress           => '127.0.0.1',
        :stop_on_client_exit => true,
        :connection_timeout  => 10,
        :preload_puppet      => true,
      }

      opt_parser = OptionParser.new do |opts|
        opts.banner = "Usage: puppet-languageserver.rb [options]"

        opts.on("-pPORT", "--port=PORT", "TCP Port to listen on.  Default is #{args[:port]}") do |port|
          args[:port] = port.to_i
        end

        opts.on("-ipADDRESS", "--ip=ADDRESS", "IP Address to listen on (0.0.0.0 for all interfaces).  Default is #{args[:ipaddress]}") do |ipaddress|
          args[:ipaddress] = ipaddress
        end

        opts.on("-c", "--no-stop", "Do not stop the language server once a client disconnects.  Default is to stop") do |_misc|
          args[:stop_on_client_exit] = false
        end

        opts.on("-tTIMEOUT", "--timeout=TIMEOUT", "Stop the language server if a client does not connection within TIMEOUT seconds.  A value of zero will not timeout.  Default is #{args[:connection_timeout]} seconds") do |timeout|
          args[:connection_timeout] = timeout.to_i
        end

        opts.on("-d","--no-preload", "Do not preload Puppet information when the language server starts.  Default is to preload") do |_misc|
          args[:preload_puppet] = false
        end

        opts.on("-h", "--help", "Prints this help") do
          puts opts
          exit
        end
      end

      opt_parser.parse!(options.dup)
      return args
    end
  end

  def self.log_message(severity, message)
    puts "[#{severity.upcase}] #{message}"
  end

  def self.init_puppet(options)
    log_message('information', "Using Puppet v#{Puppet::version}")

    log_message('information', "Initializing settings...")
    Puppet.initialize_settings

    log_message('information', "Creating puppet function environment...")
    autoloader = Puppet::Parser::Functions.autoloader
    autoloader.loadall

    log_message('information', "Using Facter v#{Facter.version}")
    if options[:preload_puppet]
      log_message('information', "Preloading Facter (Async)...")
      PuppetLanguageServer::FacterHelper.load_facts_async

      log_message('information', "Preloading Puppet Types (Async)...")
      PuppetLanguageServer::PuppetHelper.load_types_async

      log_message('information', "Preloading Functions (Async)...")
      PuppetLanguageServer::PuppetHelper.load_functions_async
    else
      log_message('information', "Skipping preloading Puppet")
    end

    true
  end

  def self.rpc_server(options)
    log_message('information', "Starting RPC Server...")

    server = PuppetLanguageServer::SimpleTCPServer.new()

    server.add_service(options[:ipaddress], options[:port])
    trap('INT'){ server.stop }
    server.start(PuppetLanguageServer::MessageRouter, options, 2)

    log_message('information','Language Server exited.')
  end
end
