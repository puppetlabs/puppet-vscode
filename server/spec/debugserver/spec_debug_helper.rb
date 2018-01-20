# Emulate the setup from the root 'puppet-debugserver' file

# Add the debug server into the load path
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__),'..','lib'))

require 'puppet-debugserver'
# Normally globals are 'bad', but in this case it really should be global to all testing
# code paths
$fixtures_dir = File.join(File.dirname(__FILE__),'fixtures')
$root_dir = File.join(File.dirname(__FILE__),'..','..')
# Currently there is no way to re-initialize the puppet loader so for the moment
# all tests must run off the single puppet config settings instead of per example setting
puppet_settings = ['--vardir',File.join($fixtures_dir,'cache'),
                   '--confdir',File.join($fixtures_dir,'confdir')]
PuppetDebugServer::init_puppet(PuppetDebugServer::CommandLineParser.parse([]))
Puppet.initialize_settings(puppet_settings)

# Custom RSpec Matchers

RSpec::Matchers.define :receive_message_with_request_id_within_timeout do |request_seq_id, timeout = 5|
  match do |client|
    exit_timeout = timeout
    while exit_timeout > 0 do
      puts "... Waiting for message with request id #{request_seq_id} (timeout #{exit_timeout}s)" if ENV['SPEC_DEBUG']
      raise 'Client has been closed' if client.closed?
      client.read_data
      if client.new_messages?
        data = client.data_from_request_seq_id(request_seq_id)
        return true unless data.nil?
      end
      sleep(1)
      exit_timeout -= 1
    end
    false
  end

  failure_message do |actual|
    message =     "expected that client would event with request id '#{request_seq_id}' event within #{timeout} seconds\n"
    message += "Last 5 messages\n"
    client.received_messages.last(5).each { |item| message += "#{item}\n" }
    message
  end
end

RSpec::Matchers.define :receive_event_within_timeout do |event_name, timeout = 5|
  match do |client|
    exit_timeout = timeout
    while exit_timeout > 0 do
      puts "... Waiting for message with event '#{event_name}' (timeout #{exit_timeout}s)" if ENV['SPEC_DEBUG']
      raise 'Client has been closed' if client.closed?
      client.read_data
      if client.new_messages?
        data = client.data_from_event_name(event_name)
        return true unless data.nil?
      end
      sleep(1)
      exit_timeout -= 1
    end
    false
  end

  failure_message do |client|
    message = "expected that client would recieve '#{event_name}' event within #{timeout} seconds\n"
    message += "Last 5 messages\n"
    client.received_messages.last(5).each { |item| message += "#{item}\n" }
    message
  end
end

# Helpers
def initialize_request(seq_id = 1)
  JSON.generate({
    'command'   => 'initialize',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => {
      'clientID'                     => 'vscode',
      'adapterID'                    => 'Puppet',
      'pathFormat'                   => 'path',
      'linesStartAt1'                => true,
      'columnsStartAt1'              => true,
      'supportsVariableType'         => true,
      'supportsVariablePaging'       => true,
      'supportsRunInTerminalRequest' => true
    }
  })
end

def threads_request(seq_id = 1)
  JSON.generate({
    'command'   => 'threads',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => {}
  })
end

def stacktrace_request(seq_id = 1, thread_id = 0)
  JSON.generate({
    'command'   => 'stackTrace',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => {
      'threadId' => thread_id
    }
  })
end

def scopes_request(seq_id = 1, frame_id = 0)
  JSON.generate({
    'command'   => 'scopes',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => {
      'frameId' => frame_id
    }
  })
end

def variables_request(seq_id = 1, variables_reference = 0)
  JSON.generate({
    'command'   => 'variables',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => {
      'variablesReference' => variables_reference
    }
  })
end

def evaluate_request(seq_id = 1, expression = '', frameId = nil, context = nil)
  result = JSON.generate({
    'command'   => 'evaluate',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => {
      'expression' => expression,
      'frameId'    => frameId,
      'context'    => context
    }
  })
end

def stepin_request(seq_id = 1, thread_id = 0)
  JSON.generate({
    'command'   => 'stepIn',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => {
      'threadId' => thread_id
    }
  })
end

def stepout_request(seq_id = 1, thread_id = 0)
  JSON.generate({
    'command'   => 'stepOut',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => {
      'threadId' => thread_id
    }
  })
end

def next_request(seq_id = 1, thread_id = 0)
  JSON.generate({
    'command'   => 'next',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => {
      'threadId' => thread_id
    }
  })
end

def disconnect_request(seq_id = 1)
  JSON.generate({
    'command'   => 'disconnect',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => {
    }
  })
end

def configuration_done_request(seq_id = 1)
  JSON.generate({
    'command'   => 'configurationDone',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => {
    }
  })
end

def launch_request(seq_id = 1, manifest_file, noop, args)
  JSON.generate({
    'command'   => 'launch',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => {
      'manifest' => manifest_file,
      'noop'     => noop,
      'args'    => args
    }
  })
end

def continue_request(seq_id = 1, thread_id)
  JSON.generate({
    'command'   => 'continue',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => {
      'threadId' => thread_id
    }
  })
end

def set_breakpoints_request(seq_id = 1, arguments)
  JSON.generate({
    'command'   => 'setBreakpoints',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => arguments
  })
end

def set_function_breakpoints_request(seq_id = 1, arguments)
  JSON.generate({
    'command'   => 'setFunctionBreakpoints',
    'type'      => 'request',
    'seq'       => seq_id,
    'arguments' => arguments
  })
end
