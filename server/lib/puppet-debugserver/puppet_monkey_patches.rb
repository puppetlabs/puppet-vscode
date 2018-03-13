# Monkey patch the Apply application (puppet apply) so that we route the exit
# statement into the debugger first and then exit the puppet thread
require 'puppet/application/apply'
module Puppet
  class Application
    class Apply < Puppet::Application
      def exit(option)
        PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_before_apply_exit, [option])
        Thread.exit
      end
    end
  end
end

# Monkey patch the compiler so we can wrap our own rescue block around it
# to trap any exceptions that may be of interest to us
# This is a very invasive patch and should be looked at to see if we can do this
# a different way
#
# These come from the original Puppet source
# rubocop:disable Style/NegatedIf, Style/TrailingCommaInLiteral, Style/StringLiterals, Style/HashSyntax
require 'puppet/parser/compiler'
module Puppet
  module Parser
    class Compiler
      def self.compile(node, code_id = nil)
        # Based on puppet/lib/puppet/parser/compiler.rb
        begin
          node.environment.check_for_reparse

          errors = node.environment.validation_errors
          if !errors.empty?
            errors.each { |e| Puppet.err(e) } if errors.size > 1
            errmsg = [
              "Compilation has been halted because: #{errors.first}",
              "For more information, see https://docs.puppet.com/puppet/latest/reference/environments.html"
            ]
            raise(Puppet::Error, errmsg.join(' '))
          end
          # This differs from Puppet's implementation as we need the compiler object later
          new_compiler = new(node, :code_id => code_id)

          # Add hook for before compilation
          PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_before_compile, [new_compiler])

          result = new_compiler.compile(&:to_resource)

          # Add hook for after compilation
          PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_after_compile, [result])

          result
        rescue Puppet::ParseErrorWithIssue => detail
          detail.node = node.name
          Puppet.log_exception(detail)
          raise
        rescue => detail # rubocop:disable Style/RescueStandardError
          message = "#{detail} on node #{node.name}"
          Puppet.log_exception(detail, message)
          raise Puppet::Error, message, detail.backtrace
        end
      rescue Puppet::ParseErrorWithIssue => detail
        # TODO: Potential issue here with 4.10.x not implementing .file on the Positioned class
        # Just re-raise if there is no Puppet manifest file associated with the error
        raise if detail.file.nil? || detail.line.nil? || detail.pos.nil?
        PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_exception, [detail])
        raise
      end
    end
  end
end
# rubocop:enable Style/NegatedIf, Style/TrailingCommaInLiteral, Style/StringLiterals, Style/HashSyntax

# These come from the original Puppet source
# rubocop:disable Style/PerlBackrefs, Style/EachWithObject
#
# Add a helper method to the PuppetStack object
require 'puppet/pops/puppet_stack'
module Puppet
  module Pops
    module PuppetStack
      # This is very similar to the stacktrace function, but uses the exception
      # backtrace instead of caller()
      def self.stacktrace_from_backtrace(exception)
        exception.backtrace.reduce([]) do |memo, loc|
          if loc =~ /^(.*\.pp)?:([0-9]+):in (`stack'|`block in call_function')/
            memo << [$1.nil? ? 'unknown' : $1, $2.to_i]
          end
          memo
        end
      end
    end
  end
end
# rubocop:enable Style/PerlBackrefs, Style/EachWithObject

# Add hooks to the evaluator so we can trap before and after evaluating parts of the
# syntax tree
require 'puppet/pops/evaluator/evaluator_impl'
module Puppet
  module Pops
    module Evaluator
      class EvaluatorImpl
        alias_method :original_evaluate, :evaluate

        def evaluate(target, scope)
          PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_before_pops_evaluate, [self, target, scope])

          result = original_evaluate(target, scope)

          PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_after_pops_evaluate, [self, target, scope])

          result
        end
      end
    end
  end
end

# Add hooks to the functions reset so that we can do things like
# add a breakpoint function dynamically, without the need for a real puppet module
require 'puppet/parser/functions'
module Puppet
  module Parser
    module Functions
      class << self
        alias_method :original_reset, :reset

        def reset
          PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_before_parser_function_reset, [self])

          result = original_reset

          PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_after_parser_function_reset, [self])

          result
        end
      end
    end
  end
end

# MUST BE LAST!!!!!!
# Add a debugserver log destination type
Puppet::Util::Log.newdesttype :debugserver do
  def handle(msg)
    PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_log_message, [msg])
  end
end
