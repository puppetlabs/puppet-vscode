# Emulate the setup from the root 'puppet-debugserver' file

# Add the debug server into the load path
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__),'..','lib'))

require 'puppet-debugserver'
fixtures_dir = File.join(File.dirname(__FILE__),'fixtures')
# Currently there is no way to re-initialize the puppet loader so for the moment
# all tests must run off the single puppet config settings instead of per example setting
puppet_settings = ['--vardir',File.join(fixtures_dir,'cache'),
                   '--confdir',File.join(fixtures_dir,'confdir')]
PuppetDebugServer::init_puppet(PuppetDebugServer::CommandLineParser.parse([]))
Puppet.initialize_settings(puppet_settings)

# Custom RSpec Matchers

# Mock ojects
class MockJSONRPCHandler < PuppetDebugServer::JSONHandler
  attr_accessor :socket
  attr_accessor :simple_tcp_server

  def post_init
  end

  def unbind
  end

  def receive_data(data)
  end

  def error?
    false
  end

  def send_data(data)
    true
  end

  def close_connection_after_writing
  end

  def close_connection
  end
end
