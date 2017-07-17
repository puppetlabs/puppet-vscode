require 'a_bad_gem_that_does_not_exist'

module Puppet::Parser::Functions
  newfunction(:bad_file, :type => :rvalue, :doc => <<-EOS
Function that will fail loading
    EOS
  ) do |arguments|
    # Do nothing
  end
end
