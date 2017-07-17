# Emulate the setup from the root 'puppet-languageserver' file

# Add the language server into the load path
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__),'..','lib'))
# Add the vendored gems into the load path
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__),'..','vendor','puppet-lint','lib'))

require 'puppet-languageserver'
fixtures_dir = File.join(File.dirname(__FILE__),'fixtures')

# Currently there is no way to re-initialize the puppet loader so for the moment
# all tests must run off the single puppet config settings instead of per example setting
server_options = PuppetLanguageServer::CommandLineParser.parse([])
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
