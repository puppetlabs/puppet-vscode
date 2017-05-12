require 'languageserver/languageserver'

require 'puppet-languageserver/rpc_constants'
require 'puppet-languageserver/rpc_server'
require 'puppet-languageserver/message_router'
require 'puppet-languageserver/server_capabilities'
require 'puppet-languageserver/document_validator'
require 'puppet-languageserver/puppet_parser_helper'
require 'puppet-languageserver/facter_helper'
require 'puppet-languageserver/completion_provider'
require 'puppet-languageserver/hover_provider'

require 'puppet'

module PuppetLanguageServer
  def self.LogMessage(severity, message)
    puts "[#{severity.upcase}] #{message}"
  end

  def self.InitPuppet(args)
    LogMessage('information', "Using Puppet v#{Puppet::version}")

    LogMessage('information', "Initializing settings...")
    Puppet.initialize_settings

    LogMessage('information', "Creating puppet function environment...")
    autoloader = Puppet::Parser::Functions.autoloader
    autoloader.loadall

    LogMessage('information', "Using Facter v#{Facter.version}")
    LogMessage('information', "Preloading Facter (Async)...")
    PuppetLanguageServer::FacterHelper.load_facts_async

    true
  end

  def self.RPCServer(args)
    LogMessage('information', "Starting RPC Server...")
    EventMachine::run {
      EventMachine::start_server "127.0.0.1", 8081, PuppetLanguageServer::MessageRouter
      LogMessage('information','Language Server started.  Listening on port 8081')
    }
    LogMessage('information','Language Server exited.')
  end
end

PuppetLanguageServer::InitPuppet(ARGV)
