module Puppet::Parser::Functions
  newfunction(:bad_function, :type => :rvalue, :doc => <<-EOS
Function that will fail loading
    EOS
  ) do |arguments|

    require 'a_bad_gem_that_does_not_exist'
  end
end
