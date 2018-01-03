

# Monkey Patch 3.x functions so where know where they were loaded from
require 'puppet/parser/functions'
module Puppet
  module Parser
    module Functions
      class << self
        alias_method :original_newfunction, :newfunction
        def newfunction(name, options = {}, &block)
          # See if we've hooked elsewhere. This can happen while in debuggers (pry). If we're not in the previous caller
          # stack then just use the last caller
          monkey_index = Kernel.caller_locations.find_index { |loc| loc.path.match(/puppet_monkey_patches\.rb/) }
          monkey_index = -1 if monkey_index.nil?
          caller = Kernel.caller_locations[monkey_index + 1]
          # rubocop:disable Layout/IndentHash, Style/BracesAroundHashParameters
          PuppetLanguageServer::PuppetHelper.add_function_load_info(name, {
            'source' => caller.absolute_path,
            'line'   => caller.lineno - 1 # Convert to a zero based line number system
          })
          # rubocop:enable Layout/IndentHash, Style/BracesAroundHashParameters

          original_newfunction(name, options, &block)
        end
      end
    end
  end
end

# Monkey Patch type loading so we can inject the source location information
require 'puppet/metatype/manager'
module Puppet
  module MetaType
    module Manager
      alias_method :original_newtype, :newtype
      def newtype(name, options = {}, &block)
        if block_given? && !block.source_location.nil?
          # rubocop:disable Layout/IndentHash, Style/BracesAroundHashParameters
          PuppetLanguageServer::PuppetHelper.add_type_load_info(name, {
            'source' => block.source_location[0],
            'line'   => block.source_location[1] - 1 # Convert to a zero based line number system
          })
          # rubocop:enable Layout/IndentHash, Style/BracesAroundHashParameters
        end

        original_newtype(name, options, &block)
      end
    end
  end
end
