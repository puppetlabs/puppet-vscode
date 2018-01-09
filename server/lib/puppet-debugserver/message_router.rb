module PuppetDebugServer
  class MessageRouter < JSONHandler
    def initialize(*options)
      super(*options)
    end

    def send_termination_event
      obj = PuppetDebugServer::Protocol::TerminatedEvent.create({})
      send_event obj
    end

    def send_exited_event(exitcode)
      obj = PuppetDebugServer::Protocol::ExitedEvent.create('exitCode' => exitcode)
      send_event obj
    end

    def send_output_event(options)
      obj = PuppetDebugServer::Protocol::OutputEvent.create(options)
      send_event obj
    end

    def send_stopped_event(reason, options = {})
      options['reason'] = reason
      obj = PuppetDebugServer::Protocol::StoppedEvent.create(options)
      send_event obj
    end

    def send_thread_event(reason, thread_id)
      obj = PuppetDebugServer::Protocol::ThreadEvent.create('reason' => reason, 'threadId' => thread_id)
      send_event obj
    end

    def receive_request(request, original_json)
      case request['command']

      when 'initialize'
        PuppetDebugServer.log_message(:debug, 'Received initialize request.')
        obj = PuppetDebugServer::Protocol::InitializeRequest.create(original_json)
        # Save the client capabilities for later use
        @client_capabilities = obj['arguments']

        # Send capability response
        capabilities = PuppetDebugServer::Protocol::Capabilities.create({})
        # We can't accept breakpoints at any time so need them upfront
        capabilities['supportsConfigurationDoneRequest'] = true
        capabilities['supportsFunctionBreakpoints']      = true
        capabilities['supportsRestartRequest']           = false
        capabilities['supportsStepBack']                 = false
        capabilities['supportsSetVariable']              = true
        capabilities['supportsStepInTargetsRequest']     = false
        capabilities['supportedChecksumAlgorithms']      = []

        # Do some initialization
        # .... dum de dum ...

        response = PuppetDebugServer::Protocol::InitializeResponse.create_from_request(
          {
            'body' => capabilities,
            'success' => true
          }, request
        )
        send_response response

        # Send a message that we are initialized
        # This must happen _after_ the capabilites are sent
        sleep(0.5) # Sleep for a small amount of time to give the client time to process the capabilites response
        send_event PuppetDebugServer::Protocol::InitializedEvent.create

      when 'configurationDone'
        PuppetDebugServer.log_message(:debug, 'Received configurationDone request.')
        PuppetDebugServer::PuppetDebugSession.client_completed_configuration = true

        response = PuppetDebugServer::Protocol::LaunchResponse.create_from_request(
          {
            'success' => true
          }, request
        )
        send_response response

        # Start the debug session if the session is not already running and, setup and configuration have completed
        PuppetDebugServer::PuppetDebugSession.start if !PuppetDebugServer::PuppetDebugSession.session_active? && PuppetDebugServer::PuppetDebugSession.setup?

      when 'setBreakpoints'
        PuppetDebugServer.log_message(:debug, 'Received setBreakpoints request.')
        bp_request = PuppetDebugServer::Protocol::SetBreakpointsRequest.create(original_json)

        bp_response = PuppetDebugServer::PuppetDebugSession.validate_and_set_source_breakpoints(bp_request['arguments']['source'], bp_request['arguments']['breakpoints'])

        response = PuppetDebugServer::Protocol::SetBreakpointsResponse.create_from_request(
          {
            'breakpoints' => bp_response,
            'success' => 'true'
          }, request
        )
        send_response response

      when 'setFunctionBreakpoints'
        PuppetDebugServer.log_message(:debug, 'Received setFunctionBreakpoints request.')
        bp_request = PuppetDebugServer::Protocol::SetFunctionBreakpointsRequest.create(original_json)

        # TODO: for the moment, all Function breakpoints are valid
        bp_response = bp_request['arguments']['breakpoints'].map do |bp|
          bp['verified'] = true
          bp
        end

        PuppetDebugServer::PuppetDebugSession.function_breakpoints = bp_request['arguments']['breakpoints']

        response = PuppetDebugServer::Protocol::SetBreakpointsResponse.create_from_request(
          {
            'breakpoints' => bp_response,
            'success' => 'true'
          }, request
        )
        send_response response

      when 'launch'
        PuppetDebugServer.log_message(:debug, 'Received launch request.')
        _obj = PuppetDebugServer::Protocol::LaunchRequest.create(original_json)
        # TODO: Do we care about the noDebug?

        response = PuppetDebugServer::Protocol::LaunchResponse.create_from_request(
          {
            'success' => true
          }, request
        )
        send_response response

        # Start the debug session
        PuppetDebugServer::PuppetDebugSession.setup(self, original_json['arguments'])
        # Start the debug session if the session is not already running and, setup and configuration have completed
        PuppetDebugServer::PuppetDebugSession.start if !PuppetDebugServer::PuppetDebugSession.session_active? && PuppetDebugServer::PuppetDebugSession.client_completed_configuration?

      when 'threads'
        PuppetDebugServer.log_message(:debug, 'Received threads request.')

        if PuppetDebugServer::PuppetDebugSession.puppet_thread_id.nil?
          response = PuppetDebugServer::Protocol::ThreadsResponse.create_from_request(
            {
              'success' => false,
              'threads' => []
            }, request
          )
        else
          response = PuppetDebugServer::Protocol::ThreadsResponse.create_from_request(
            {
              'success' => true,
              'threads' => [{ 'id' => PuppetDebugServer::PuppetDebugSession.puppet_thread_id, 'name' => 'puppet' }]
            }, request
          )
        end
        send_response response

      when 'stackTrace'
        PuppetDebugServer.log_message(:debug, 'Received stackTrace request.')
        obj = PuppetDebugServer::Protocol::StackTraceRequest.create(original_json)

        if PuppetDebugServer::PuppetDebugSession.puppet_thread_id.nil? || PuppetDebugServer::PuppetDebugSession.puppet_thread_id != obj['arguments']['threadId']
          response = PuppetDebugServer::Protocol::Response.create_from_request(
            {
              'success' => false
            }, request
          )
          send_response response
          return
        end

        frames = PuppetDebugServer::PuppetDebugSession.generate_stackframe_list(obj['arguments'])
        response = PuppetDebugServer::Protocol::StackTraceResponse.create_from_request(
          {
            'success' => true,
            'stackFrames' => frames
          }, request
        )
        send_response response

      when 'scopes'
        PuppetDebugServer.log_message(:debug, 'Received scopes request.')
        obj = PuppetDebugServer::Protocol::ScopesRequest.create(original_json)

        if PuppetDebugServer::PuppetDebugSession.puppet_thread_id.nil?
          response = PuppetDebugServer::Protocol::Response.create_from_request(
            {
              'success' => false
            }, request
          )
          send_response response
          return
        end

        # We only respond to Frame 0 as we don't have the variable state in other
        # stack frames
        if obj['arguments']['frameId'] != 0
          response = PuppetDebugServer::Protocol::ScopesResponse.create_from_request(
            {
              'success' => true,
              'scopes' => []
            }, request
          )
          send_response response
          return
        end

        scopes = PuppetDebugServer::PuppetDebugSession.generate_scopes_list(obj['arguments'])
        response = PuppetDebugServer::Protocol::ScopesResponse.create_from_request(
          {
            'success' => true,
            'scopes' => scopes
          }, request
        )
        send_response response

      when 'variables'
        PuppetDebugServer.log_message(:debug, 'Received variables request.')
        obj = PuppetDebugServer::Protocol::VariablesRequest.create(original_json)

        if PuppetDebugServer::PuppetDebugSession.puppet_thread_id.nil?
          response = PuppetDebugServer::Protocol::Response.create_from_request(
            {
              'success' => false
            }, request
          )
          send_response response
          return
        end

        variables = PuppetDebugServer::PuppetDebugSession.generate_variable_list(obj['arguments']['variablesReference'], obj['arguments'])
        response = PuppetDebugServer::Protocol::VariablesResponse.create_from_request(
          {
            'success' => true,
            'variables' => variables
          }, request
        )
        send_response response

      when 'evaluate'
        PuppetDebugServer.log_message(:debug, 'Received evaluate request.')
        obj = PuppetDebugServer::Protocol::EvaluateRequest.create(original_json)

        if PuppetDebugServer::PuppetDebugSession.puppet_thread_id.nil?
          response = PuppetDebugServer::Protocol::Response.create_from_request(
            {
              'success' => false
            }, request
          )
          send_response response
          return
        end

        # We only respond to Frame 0 as we don't have the variable state in other
        # stack frames
        if obj['arguments']['frameId'] != 0
          response = PuppetDebugServer::Protocol::Response.create_from_request(
            {
              'success' => true
            }, request
          )
          send_response response
          return
        end

        begin
          # Ignore any log messages when evaluating watch expressions. They just clutter the debug console for no reason.
          suppress_log = obj['arguments']['context'] == 'watch'
          result = PuppetDebugServer::PuppetDebugSession.evaluate_string(obj['arguments']['expression'], suppress_log)

          response = PuppetDebugServer::Protocol::EvaluateResponse.create_from_request(
            {
              'success'            => true,
              'result'             => result.to_s,
              'variablesReference' => 0
            }, request
          )
          send_response response
        rescue => exception # rubocop:disable Style/RescueStandardError
          response = PuppetDebugServer::Protocol::Response.create_from_request(
            {
              'success' => false,
              'message' => exception.to_s
            }, request
          )
          send_response response
        end

      when 'continue'
        PuppetDebugServer.log_message(:debug, 'Received continue request.')

        # Continue the debug session
        PuppetDebugServer::PuppetDebugSession.continue_session

        response = PuppetDebugServer::Protocol::ContinueResponse.create_from_request(
          {
            'success' => true,
            'allThreadsContinued' => true
          }, request
        )
        send_response response

      when 'stepIn'
        PuppetDebugServer.log_message(:debug, 'Received stepIn request.')
        req = PuppetDebugServer::Protocol::StepInRequest.create(original_json)

        if PuppetDebugServer::PuppetDebugSession.puppet_thread_id.nil? || PuppetDebugServer::PuppetDebugSession.puppet_thread_id != req['arguments']['threadId']
          response = PuppetDebugServer::Protocol::Response.create_from_request(
            {
              'success' => false
            }, request
          )
          send_response response
          return
        end

        # Stepin the debug session
        PuppetDebugServer::PuppetDebugSession.continue_stepin_session

        send_response PuppetDebugServer::Protocol::StepInResponse.create_from_request({ 'success' => true }, request)

      when 'stepOut'
        PuppetDebugServer.log_message(:debug, 'Received stepOut request.')
        req = PuppetDebugServer::Protocol::StepOutRequest.create(original_json)

        if PuppetDebugServer::PuppetDebugSession.puppet_thread_id.nil? || PuppetDebugServer::PuppetDebugSession.puppet_thread_id != req['arguments']['threadId']
          response = PuppetDebugServer::Protocol::Response.create_from_request(
            {
              'success' => false
            }, request
          )
          send_response response
          return
        end

        # Next the debug session
        PuppetDebugServer::PuppetDebugSession.continue_stepout_session

        send_response PuppetDebugServer::Protocol::StepOutResponse.create_from_request({ 'success' => true }, request)

      when 'next'
        PuppetDebugServer.log_message(:debug, 'Received next request.')
        req = PuppetDebugServer::Protocol::NextRequest.create(original_json)

        if PuppetDebugServer::PuppetDebugSession.puppet_thread_id.nil? || PuppetDebugServer::PuppetDebugSession.puppet_thread_id != req['arguments']['threadId']
          response = PuppetDebugServer::Protocol::Response.create_from_request(
            {
              'success' => false
            }, request
          )
          send_response response
          return
        end

        # Next the debug session
        PuppetDebugServer::PuppetDebugSession.continue_next_session

        send_response PuppetDebugServer::Protocol::NextResponse.create_from_request({ 'success' => true }, request)

      when 'disconnect'
        # Don't really care about the arguments - Kill everything
        PuppetDebugServer.log_message(:info, 'Received disconnect request.  Closing connection to client...')
        close_connection

      else
        PuppetDebugServer.log_message(:error, "Unknown request command #{request['command']}")

        response = PuppetDebugServer::Protocol::Response.create_from_request(
          {
            'success' => false,
            'message' => "This feature is not supported - Request #{request['command']}"
          }, request
        )
        send_response response
      end
    end
  end
end
