require 'spec_debug_helper'

describe 'Puppet::Parser::Compiler' do
  skip 'May not be required'
  before(:each) do
    allow(PuppetDebugServer::PuppetDebugSession.hooks).to receive(:exec_hook).with(any_args)

    @env = Puppet::Node::Environment.create(:testing, [])
    @node = Puppet::Node.new('test', :environment => @env)
  end

  context 'Given a invocation that will raise an error' do
    let(:manifest) { <<-EOT
      Iamabadclass {'Hello': }
      EOT
    }

    it 'should raise an exception breakpoint' do
      expect(PuppetDebugServer::PuppetDebugSession.hooks).to receive(:exec_hook).with(:hook_exception, any_args)
      # This is a fairly nasty mock but it's the easiest way to inject a filename into
      # the compilation error process
      allow_any_instance_of(Puppet::PreformattedError).to receive(:file).and_return('mockfile')
      Puppet[:code] = manifest
      expect { Puppet::Parser::Compiler.compile(@node).filter(&:virtual?) }.to raise_error(RuntimeError, /Iamabadclass/)
    end
  end
end
