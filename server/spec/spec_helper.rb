# Emulate the setup from the root 'puppet-languageserver' file

# Add the language server into the load path
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__),'..','lib'))
# Add the vendored gems into the load path
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__),'..','vendor','puppet-lint','lib'))

require 'puppet-languageserver'
PuppetLanguageServer::InitPuppet(PuppetLanguageServer::CommandLineParser.parse([]))

# Custom RSpec Matchers

RSpec::Matchers.define :be_completion_item_with_type do |value|
  value = [value] unless value.is_a?(Array)

  match { |actual| value.include?(actual['data']['type']) }

  description do
    "be a Completion Item with a data type in the list of #{value}"
  end
end

