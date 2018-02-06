require 'spec_debug_helper'
require 'spec_debug_client'
require 'open3'

describe 'End to End Testing' do
  before(:each) {
    @debug_port = 8082 + Random.rand(1024)
    @debug_host = 'localhost'
    @debug_pid = -1

    # Start the debug server
    debug_entrypoint = File.join($root_dir,'puppet-debugserver')
    @debug_stdin, @debug_stdout, @debug_stderr, wait_thr = Open3.popen3('ruby.exe',debug_entrypoint,
                                                                        '--timeout=10',
                                                                        "--port=#{@debug_port}",
                                                                        "--ip=#{@debug_host}")
    @debug_pid = wait_thr.pid
    # Wait for something to be output from the Debug Server.  This indicates it's alive and ready for a connection
    result = IO.select([@debug_stdout], [], [], 5)
    raise('Debug Server did not start up in the required timespan') unless result

    # Now connect to the Debug Server
    @client = DebugClient.new(@debug_host, @debug_port)
  }

  after(:each) {
    @client.close unless @client.closed?
    Process.kill("KILL", @debug_pid) rescue true
    @debug_stdin.close
    @debug_stdout.close
    @debug_stderr.close
  }

  context 'Processing an empty manifest with no breakpoints' do
    let(:manifest_file) { File.join($fixtures_dir, 'environments', 'test-fixtures', 'manifests', 'empty.pp') }
    let(:noop) { true }
    let(:args) { [] }

    it 'should process the manifest and exit with 0' do
      # initialize_request
      @client.send_data(initialize_request(@client.next_seq_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])

      # launch_request
      @client.send_data(launch_request(@client.next_seq_id, manifest_file, noop, args))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])

      # configuration_done_request
      @client.send_data(configuration_done_request(@client.next_seq_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])

      # Wait for the puppet run to complete
      expect(@client).to receive_event_within_timeout(['terminated', 60])

      # Make sure we received the exited event
      result = @client.data_from_event_name('exited')
      expect(result).to_not be nil
      expect(result['body']['exitCode']).to eq(0)
    end
  end

  context 'Processing a manifest that fails compilation' do
    let(:manifest_file) { File.join($fixtures_dir, 'environments', 'test-fixtures', 'manifests', 'fail.pp') }
    let(:noop) { true }
    let(:args) { [] }

    it 'should process the manifest and exit with 1' do
      # initialize_request
      @client.send_data(initialize_request(@client.next_seq_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])

      # launch_request
      @client.send_data(launch_request(@client.next_seq_id, manifest_file, noop, args))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])

      # configuration_done_request
      @client.send_data(configuration_done_request(@client.next_seq_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])

      # Wait for the exception to raise
      expect(@client).to receive_event_within_timeout(['stopped', 60])
      detail = @client.data_from_event_name('stopped')
      expect(detail['body']['reason']).to eq('exception')
      expect(detail['body']['text']).to match(/This is a failure/)
      thread_id = detail['body']['threadId']

      # Ensure it was raised on Line 3
      # Get the stack trace list
      @client.send_data(stacktrace_request(@client.next_seq_id, thread_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      # As we're only in the root, only two frames should be available.  The error and where it was called from
      expect(result['success']).to be true
      expect(result['body']['stackFrames'].count).to eq(2)
      expect(result['body']['stackFrames'][0]).to include('line' => 3)
      expect(result['body']['stackFrames'][1]).to include('line' => 3)

      # continue_request
      @client.send_data(continue_request(@client.next_seq_id, thread_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])

      # Wait for the puppet run to complete
      expect(@client).to receive_event_within_timeout(['terminated', 60])

      # Make sure we received the exited event
      result = @client.data_from_event_name('exited')
      expect(result).to_not be nil
      expect(result['body']['exitCode']).to eq(1)
    end
  end

  context 'Processing a manifest with all debug features' do
    let(:manifest_file) { File.join($fixtures_dir, 'environments', 'test-fixtures', 'manifests', 'kitchen_sink.pp') }
    let(:noop) { true }
    let(:args) { [] }

    # Things tested
    # - Line breakpoints
    # - Function breakpoints
    # - Continue
    # - Step In
    # - Variables list
    # - Stack Frame list
    # - Dynamic function breakpoints (Adding while in flight)
    # - Variable evaluation
    # - Check that dynamic variable evaluation is available in later break points
    # - Dynamic line breakpoints (Adding while in flight)
    # - Step Out

    # From documentation:
    # A session initialisation should look like;
    # - adapters sends InitializedEvent (after the InitializeRequest has returned)
    # - frontend sends zero or more SetBreakpointsRequest
    # - frontend sends one SetFunctionBreakpointsRequest
    # - frontend sends a SetExceptionBreakpointsRequest if one or more exceptionBreakpointFilters have been defined (or if supportsConfigurationDoneRequest is not defined or false)
    # - frontend sends other future configuration requests
    # - frontend sends one ConfigurationDoneRequest to indicate the end of the configuration
    # - Launch request can occur during init

    it 'should process the manifest and exit with 0' do
      # initialize_request
      @client.send_data(initialize_request(@client.next_seq_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])

      # set_breakpoints_request
      @client.send_data(set_breakpoints_request(@client.next_seq_id,
        {
          'source'      => {
            'name' => 'kitchen_sink.pp',
            'path' => manifest_file
          },
          'breakpoints' => [
            { 'line' => 3  }, # This breakpoint is on a comment line and should not be verified
            { 'line' => 39 }
          ]
        }
      ))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      # Ensure the breakpoint response is as expected
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      expect(result['success']).to eq('true')
      # Breakpoint on a comment line
      expect(result['body']['breakpoints'][0]['verified']).to be false
      expect(result['body']['breakpoints'][0]['message']).to match(/Line does not exist or is blank/)
      # Breakpoint at root of manifest
      expect(result['body']['breakpoints'][1]['verified']).to be true

      # set_function_breakpoints_request
      @client.send_data(set_function_breakpoints_request(@client.next_seq_id,
        {
          'breakpoints' => [
            { 'name' => 'alert' }
          ]
        }
      ))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      # Ensure the breakpoint response is as expected
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      expect(result['body']['breakpoints'][0]['verified']).to be true

      # launch_request
      @client.send_data(launch_request(@client.next_seq_id, manifest_file, noop, args))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])

      # configuration_done_request
      @client.send_data(configuration_done_request(@client.next_seq_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])

      # -----
      # This breakpoint is in the root of the manifest and has two variables defined
      # a_test_string and a_test_array
      # Line 39
      # -----

      # Wait for the breakpoint to be hit
      expect(@client).to receive_event_within_timeout(['stopped', 60])
      result = @client.data_from_event_name('stopped')
      expect(result['body']['reason']).to eq('breakpoint')
      thread_id = result['body']['threadId']

      # Get the stack trace list
      @client.send_data(stacktrace_request(@client.next_seq_id, thread_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      # As we're only in the root, only one frame should be available
      expect(result['success']).to be true
      expect(result['body']['stackFrames'].count).to eq(1)
      expect(result['body']['stackFrames'][0]).to include('line' => 39)

      # Get the available scopes list
      @client.send_data(scopes_request(@client.next_seq_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      expect(result['success']).to be true
      # As we're only in the root, only one scope should be available
      expect(result['body']['scopes'].count).to eq(1)
      variables_reference = result['body']['scopes'][0]['variablesReference']

      # Get the variables list
      @client.send_data(variables_request(@client.next_seq_id, variables_reference))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      result = @client.data_from_request_seq_id(@client.current_seq_id)

      # Ensure the $a_test_string variable is set correctly
      expect(result['body']['variables'].find { |item| item['name'] == 'a_test_string'}).to include('value' => 'This is a string')
      # Ensure the core fact, in the global scope, exists 'operatingsystem'
      expect(result['body']['variables'].find { |item| item['name'] == 'operatingsystem'}).to_not be nil
      # Ensure the $a_test_array variable exists
      obj = result['body']['variables'].find { |item| item['name'] == 'a_test_array'}
      expect(obj).to_not be nil
      # Get more details about the $a_test_array variable
      @client.send_data(variables_request(@client.next_seq_id, obj['variablesReference']))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      # Ensure the $a_test_array variable contents is correct
      expect(result['body']['variables'][0]).to include('name' => '0', 'value' => '1')
      expect(result['body']['variables'][1]).to include('name' => '1', 'value' => '2')
      expect(result['body']['variables'][2]).to include('name' => '2', 'value' => '3')

      # -----
      # Now to Step In twice and we should be inside the class called democlass
      # -----
      @client.clear_messages!
      @client.send_data(stepin_request(@client.next_seq_id, thread_id))
      expect(@client).to receive_event_within_timeout(['stopped', 60])

      @client.clear_messages!
      @client.send_data(stepin_request(@client.next_seq_id, thread_id))
      expect(@client).to receive_event_within_timeout(['stopped', 60])

      # Get the stack trace list
      @client.send_data(stacktrace_request(@client.next_seq_id, thread_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      # The stack should be two levels deep (root -> democlass)
      expect(result['success']).to be true
      expect(result['body']['stackFrames'].count).to eq(2)
      expect(result['body']['stackFrames'][0]).to include('line' => 24)
      expect(result['body']['stackFrames'][1]).to include('line' => 39)

      # -----
      # Now we wait to hit the alert function which is in the nestedclass class
      # Line 13
      # -----

      # Wait for the breakpoint to be hit
      @client.clear_messages!
      @client.send_data(continue_request(@client.next_seq_id, thread_id))
      expect(@client).to receive_event_within_timeout(['stopped', 60])
      result = @client.data_from_event_name('stopped')
      expect(result['body']['reason']).to eq('function breakpoint')
      expect(result['body']['description']).to eq('alert')
      thread_id = result['body']['threadId']

      # Get the stack trace list
      @client.send_data(stacktrace_request(@client.next_seq_id, thread_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      # The stack should be three levels deep (root -> democlass -> nestedclass)
      expect(result['success']).to be true
      expect(result['body']['stackFrames'].count).to eq(3)
      expect(result['body']['stackFrames'][0]).to include('line' => 13, 'column' => 3, 'endColumn' => 36)
      expect(result['body']['stackFrames'][1]).to include('line' => 27)
      expect(result['body']['stackFrames'][2]).to include('line' => 39)

      # Evaluate that $before_var exists but $after_var does not.  Also add $mid_var to check later
      # - Check $democlass::before_var
      @client.send_data(evaluate_request(@client.next_seq_id, '$democlass::before_var', 0))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      expect(result['body']['result']).to eq('before')
      # - Check $democlass::after_var
      @client.send_data(evaluate_request(@client.next_seq_id, '$democlass::after_var', 0))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      expect(result['body']['result']).to eq('')
      # - Create $mid_var
      @client.send_data(evaluate_request(@client.next_seq_id, '$mid_var = \'middle\'', 0))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      expect(result['body']['result']).to eq('middle')

      # -----
      # Change the function break points from alert to notice, mid-debug which should be line 43
      #
      # set_function_breakpoints_request
      @client.send_data(set_function_breakpoints_request(@client.next_seq_id,
        {
          'breakpoints' => [
            { 'name' => 'notice' }
          ]
        }
      ))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      # Ensure the breakpoint response is as expected
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      expect(result['body']['breakpoints'][0]['verified']).to be true

      # -----
      # Step out of nested class, back into democlass
      # Line 29
      #
      @client.clear_messages!
      @client.send_data(stepout_request(@client.next_seq_id, thread_id))
      expect(@client).to receive_event_within_timeout(['stopped', 10])
      result = @client.data_from_event_name('stopped')

      # Get the stack trace list
      @client.send_data(stacktrace_request(@client.next_seq_id, thread_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      # The stack should be two levels deep (root -> democlass)
      expect(result['success']).to be true
      expect(result['body']['stackFrames'].count).to eq(2)
      expect(result['body']['stackFrames'][0]).to include('line' => 29)
      expect(result['body']['stackFrames'][1]).to include('line' => 39)

      # ----
      # Dymically change the breakpoint list
      #
      # set_breakpoints_request
      @client.send_data(set_breakpoints_request(@client.next_seq_id,
        {
          'source'      => {
            'name' => 'kitchen_sink.pp',
            'path' => manifest_file
          },
          'breakpoints' => [
            { 'line' => 3  }, # This breakpoint is on a comment line and should not be verified
            { 'line' => 41 }
          ]
        }
      ))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      # Ensure the breakpoint response is as expected
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      expect(result['success']).to eq('true')
      # Breakpoint on a comment line
      expect(result['body']['breakpoints'][0]['verified']).to be false
      expect(result['body']['breakpoints'][0]['message']).to match(/Line does not exist or is blank/)
      # Breakpoint at root of manifest
      expect(result['body']['breakpoints'][1]['verified']).to be true

      # Wait for the breakpoint to be hit
      @client.clear_messages!
      @client.send_data(continue_request(@client.next_seq_id, thread_id))
      expect(@client).to receive_event_within_timeout(['stopped', 60])
      result = @client.data_from_event_name('stopped')
      expect(result['body']['reason']).to eq('breakpoint')
      thread_id = result['body']['threadId']

      # Get the stack trace list
      @client.send_data(stacktrace_request(@client.next_seq_id, thread_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      # As we're only in the root, only one frame should be available
      expect(result['success']).to be true
      expect(result['body']['stackFrames'].count).to eq(1)
      expect(result['body']['stackFrames'][0]).to include('line' => 41)

      # ---
      # Clear all breakpoints
      #
      # set_breakpoints_request
      @client.send_data(set_breakpoints_request(@client.next_seq_id,
        {
          'source'      => {
            'name' => 'kitchen_sink.pp',
            'path' => manifest_file
          },
          'breakpoints' => []
        }
      ))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      # Ensure the breakpoint response is as expected
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      expect(result['success']).to eq('true')

      # -----
      # Now we wait to hit the notice function which is in the root
      # Line 43
      # -----

      # Wait for the breakpoint to be hit
      @client.clear_messages!
      @client.send_data(continue_request(@client.next_seq_id, thread_id))
      expect(@client).to receive_event_within_timeout(['stopped', 60])
      result = @client.data_from_event_name('stopped')
      expect(result['body']['reason']).to eq('function breakpoint')
      expect(result['body']['description']).to eq('notice')
      thread_id = result['body']['threadId']

      # Get the stack trace list
      @client.send_data(stacktrace_request(@client.next_seq_id, thread_id))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      # As we're only in the root, only one frame should be available
      expect(result['success']).to be true
      expect(result['body']['stackFrames'].count).to eq(1)
      expect(result['body']['stackFrames'][0]).to include('line' => 43)

      # Evaluate that $mid_var still exists
      @client.send_data(evaluate_request(@client.next_seq_id, '$mid_var', 0))
      expect(@client).to receive_message_with_request_id_within_timeout([@client.current_seq_id, 5])
      result = @client.data_from_request_seq_id(@client.current_seq_id)
      expect(result['body']['result']).to eq('middle')

      @client.send_data(continue_request(@client.next_seq_id, thread_id))

      # Wait for the puppet run to complete
      expect(@client).to receive_event_within_timeout(['terminated', 60])

      # Make sure we received the exited event
      result = @client.data_from_event_name('exited')
      expect(result).to_not be nil
      expect(result['body']['exitCode']).to eq(0)
    end
  end
end
