require 'spec_debug_helper'

def class_in_catalog(catalog, klass)
  require 'puppet'

  # Use Puppet to generate the AST
  parser = Puppet::Pops::Parser::Parser.new
  result = parser.parse_string(catalog, 'debug_hook_handlers.pp')

  # Now that we have a parsed AST, find the object we're interested in
  if result.model.respond_to? :eAllContents
    result.model.eAllContents.each do |item|
      return item if item.is_a?(klass)
    end
  else
    path = []
    result.model._pcore_all_contents(path) do |item|
      return item if item.is_a?(klass)
    end
  end

  nil
end

describe 'PuppetDebugServer::PuppetDebugSession' do
  let(:subject) { PuppetDebugServer::PuppetDebugSession }

  before(:each) {
    allow(PuppetDebugServer::PuppetDebugSession.hooks).to receive(:exec_hook)
    PuppetDebugServer::PuppetDebugSession.reset_pops_eval_depth
  }

  describe '#hook_before_pops_evaluate' do
    let(:subject_args) {
      # Expects [self, target, scope]
      [self, class_in_catalog(catalog_text, target_class), nil ]
    }

    context 'with a manifest which contains a function called breakpoint()' do
      let(:catalog_text) { <<-EOT
        class classtest {
          breakpoint()
        }
      EOT
      }
      let(:target_class) { Puppet::Pops::Model::CallNamedFunctionExpression }

      it 'Should raise a function breakpoint hook when the function is hit' do
        expect(PuppetDebugServer::PuppetDebugSession.hooks).to receive(:exec_hook).with(:hook_function_breakpoint, any_args)

        result = subject.hook_before_pops_evaluate(subject_args)
      end
    end

    context 'with a manifest which contains a function called testfunc()' do
      let(:catalog_text) { <<-EOT
        class classtest {
          testfunc()
        }
      EOT
      }
      let(:target_class) { Puppet::Pops::Model::CallNamedFunctionExpression }

      # Function Break Points
      it 'Should not raise a function breakpoint hook when it is not configured as trigger name' do
        expect(PuppetDebugServer::PuppetDebugSession.hooks).to receive(:exec_hook)
          .with(:hook_function_breakpoint, any_args)
          .exactly(0).times

        result = subject.hook_before_pops_evaluate(subject_args)
      end

      it 'Should raise a function breakpoint hook when it is configured as trigger name' do
        allow(PuppetDebugServer::PuppetDebugSession).to receive(:function_breakpoints).and_return([{ 'name' => 'testfunc' }])
        expect(PuppetDebugServer::PuppetDebugSession.hooks).to receive(:exec_hook)
          .with(:hook_function_breakpoint, any_args)
          .exactly(1).times

        result = subject.hook_before_pops_evaluate(subject_args)
      end

      # Line Break Points
      it 'Should not raise a breakpoint hook when it is not configured as line breakpoint' do
        expect(PuppetDebugServer::PuppetDebugSession.hooks).to receive(:exec_hook)
          .with(:hook_breakpoint, any_args)
          .exactly(0).times

        result = subject.hook_before_pops_evaluate(subject_args)
      end

      it 'Should raise a breakpoint hook when it is configured as line breakpoint' do
        allow(PuppetDebugServer::PuppetDebugSession).to receive(:source_breakpoints).and_return([{ 'line' => 2 }])
        expect(PuppetDebugServer::PuppetDebugSession.hooks).to receive(:exec_hook)
          .with(:hook_breakpoint, any_args)
          .exactly(1).times

        result = subject.hook_before_pops_evaluate(subject_args)
      end
    end
  end
end
