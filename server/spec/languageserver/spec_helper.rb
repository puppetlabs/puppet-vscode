# Emulate the setup from the root 'puppet-languageserver' file

root = File.join(File.dirname(__FILE__),'..','..')
# Add the language server into the load path
$LOAD_PATH.unshift(File.join(root,'lib'))
# Add the vendored gems into the load path
$LOAD_PATH.unshift(File.join(root,'vendor','puppet-lint','lib'))

require 'puppet-languageserver'
fixtures_dir = File.join(File.dirname(__FILE__),'fixtures')

# Currently there is no way to re-initialize the puppet loader so for the moment
# all tests must run off the single puppet config settings instead of per example setting
server_options = PuppetLanguageServer::CommandLineParser.parse(['--no-preload'])
server_options[:puppet_settings] = ['--vardir',File.join(fixtures_dir,'cache'),
                                    '--confdir',File.join(fixtures_dir,'confdir')]
PuppetLanguageServer::init_puppet(server_options)

# Custom RSpec Matchers
RSpec::Matchers.define :be_completion_item_with_type do |value|
  value = [value] unless value.is_a?(Array)

  match { |actual| value.include?(actual['data']['type']) }

  description do
    "be a Completion Item with a data type in the list of #{value}"
  end
end

# Mock ojects
class MockJSONRPCHandler < PuppetLanguageServer::JSONRPCHandler
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

class MockRelationshipGraph
  attr_accessor :vertices
  def initialize()
  end
end

class MockResource
  attr_accessor :title

  def initialize(type_name = 'type' + rand(65536).to_s, title = 'resource' + rand(65536).to_s)
    @title = title
    @type = type_name
  end

  def to_manifest
    <<-HEREDOC
#{@type} { '#{@title}':
  ensure => present
}
    HEREDOC
  end
end
