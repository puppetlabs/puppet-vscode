# Original JSON Schema for the protocol
# https://github.com/Microsoft/vscode-debugadapter-node/blob/master/debugProtocol.json
#
# Auto-generated TypeScript verions of the Schema
# https://github.com/Microsoft/vscode-debugadapter-node/blob/master/protocol/src/debugProtocol.ts

module PuppetDebugServer
  module Protocol
    # /** Base class of requests, responses, and events. */
    # export interface ProtocolMessage {
    #   /** Sequence number. */
    #   seq: number;
    #   /** One of 'request', 'response', or 'event'. */
    #   type: string;
    # }
    module ProtocolMessage
      def self.create(options)
        result = {}
        raise('seq is a required field for ProtocolMessage') if options['seq'].nil?
        raise('type is a required field for ProtocolMessage') if options['type'].nil?

        result['seq']  = options['seq']
        result['type'] = options['type']

        result
      end
    end

    # /** A client or server-initiated request. */
    # export interface Request extends ProtocolMessage {
    #   // type: 'request';
    #   /** The command to execute. */
    #   command: string;
    #   /** Object containing arguments for the command. */
    #   arguments?: any;
    # }
    module Request
      def self.create(options)
        result = ProtocolMessage.create(options)
        raise('command is a required field for Request') if options['command'].nil?

        result['command'] = options['command']
        result['arguments'] = options['arguments'] unless options['arguments'].nil?

        result
      end
    end

    # /** Server-initiated event. */
    # export interface Event extends ProtocolMessage {
    #   // type: 'event';
    #   /** Type of event. */
    #   event: string;
    #   /** Event-specific information. */
    #   body?: any;
    # }
    module Event
      def self.create(options = {})
        options['type'] = 'event'
        result = ProtocolMessage.create(options)
        raise('event is a required field for Event') if options['event'].nil?

        result['event'] = options['event']
        result['body'] = options['body'] unless options['body'].nil?

        result
      end
    end

    # /** Response to a request. */
    # export interface Response extends ProtocolMessage {
    #   // type: 'response';
    #   /** Sequence number of the corresponding request. */
    #   request_seq: number;
    #   /** Outcome of the request. */
    #   success: boolean;
    #   /** The command requested. */
    #   command: string;
    #   /** Contains error message if success == false. */
    #   message?: string;
    #   /** Contains request result if success is true and optional error details if success is false. */
    #   body?: any;
    # }
    module Response
      def self.create_from_request(options, request = nil)
        result = ProtocolMessage.create('seq' => -1, 'type' => 'response')

        raise('success is a required field for Response') if options['success'].nil?

        result['request_seq'] = options['request_seq'] unless options['request_seq'].nil?
        result['success']     = options['success']
        result['command']     = options['command'] unless options['command'].nil?
        result['body']        = options['body'] unless options['body'].nil?
        result['message']     = options['message'] unless options['message'].nil?

        unless request.nil?
          result['request_seq'] = request['seq'] unless request['seq'].nil?
          result['command']     = request['command'] unless request['command'].nil?
        end

        raise('request_seq is a required field for Response') if result['request_seq'].nil?
        raise('command is a required field for Response') if result['command'].nil?

        result
      end
    end

    # /** Event message for 'initialized' event type.
    #   This event indicates that the debug adapter is ready to accept configuration requests (e.g. SetBreakpointsRequest, SetExceptionBreakpointsRequest).
    #   A debug adapter is expected to send this event when it is ready to accept configuration requests (but not before the InitializeRequest has finished).
    #   The sequence of events/requests is as follows:
    #   - adapters sends InitializedEvent (after the InitializeRequest has returned)
    #   - frontend sends zero or more SetBreakpointsRequest
    #   - frontend sends one SetFunctionBreakpointsRequest
    #   - frontend sends a SetExceptionBreakpointsRequest if one or more exceptionBreakpointFilters have been defined (or if supportsConfigurationDoneRequest is not defined or false)
    #   - frontend sends other future configuration requests
    #   - frontend sends one ConfigurationDoneRequest to indicate the end of the configuration
    # */
    # export interface InitializedEvent extends Event {
    #   // event: 'initialized';
    # }
    module InitializedEvent
      def self.create(_options = {})
        result = Event.create('event' => 'initialized', 'seq' => -1)

        result
      end
    end

    # /** Event message for 'stopped' event type.
    #   The event indicates that the execution of the debuggee has stopped due to some condition.
    #   This can be caused by a break point previously set, a stepping action has completed, by executing a debugger statement etc.
    # */
    # export interface StoppedEvent extends Event {
    #   // event: 'stopped';
    #   body: {
    #     /** The reason for the event (such as: 'step', 'breakpoint', 'exception', 'pause', 'entry').
    #       For backward compatibility this string is shown in the UI if the 'description' attribute is missing (but it must not be translated).
    #     */
    #     reason: string;
    #     /** The full reason for the event, e.g. 'Paused on exception'. This string is shown in the UI as is. */
    #     description?: string;
    #     /** The thread which was stopped. */
    #     threadId?: number;
    #     /** Additional information. E.g. if reason is 'exception', text contains the exception name. This string is shown in the UI. */
    #     text?: string;
    #     /** If allThreadsStopped is true, a debug adapter can announce that all threads have stopped.
    #       *  The client should use this information to enable that all threads can be expanded to access their stacktraces.
    #       *  If the attribute is missing or false, only the thread with the given threadId can be expanded.
    #     */
    #     allThreadsStopped?: boolean;
    #   };
    # }
    module StoppedEvent
      def self.create(options = {})
        result = Event.create('event' => 'stopped', 'seq' => -1)
        raise('reason is a required field for StoppedEvent') if options['reason'].nil?

        result['body']                      = {}
        result['body']['reason']            = options['reason']
        result['body']['description']       = options['description'] unless options['description'].nil?
        result['body']['threadId']          = options['threadId'] unless options['threadId'].nil?
        result['body']['text']              = options['text'] unless options['text'].nil?
        result['body']['allThreadsStopped'] = options['allThreadsStopped'] unless options['allThreadsStopped'].nil?

        result
      end
    end

    # /** Initialize request; value of command field is 'initialize'. */
    # export interface InitializeRequest extends Request {
    #   // command: 'initialize';
    #   arguments: InitializeRequestArguments;
    # }
    module InitializeRequest
      def self.create(options)
        result = Request.create(options)
        raise('command is a required field for InitializeRequest') if options['command'].nil?

        result['command'] = options['command']
        result['arguments'] = InitializeRequestArguments.create(options['arguments']) unless options['arguments'].nil?

        result
      end
    end

    # /** Arguments for 'initialize' request. */
    # export interface InitializeRequestArguments {
    #   /** The ID of the (frontend) client using this adapter. */
    #   clientID?: string;
    #   /** The ID of the debug adapter. */
    #   adapterID: string;
    #   /** If true all line numbers are 1-based (default). */
    #   linesStartAt1?: boolean;
    #   /** If true all column numbers are 1-based (default). */
    #   columnsStartAt1?: boolean;
    #   /** Determines in what format paths are specified. Possible values are 'path' or 'uri'. The default is 'path', which is the native format. */
    #   pathFormat?: string;
    #   /** Client supports the optional type attribute for variables. */
    #   supportsVariableType?: boolean;
    #   /** Client supports the paging of variables. */
    #   supportsVariablePaging?: boolean;
    #   /** Client supports the runInTerminal request. */
    #   supportsRunInTerminalRequest?: boolean;
    # }
    module InitializeRequestArguments
      def self.create(options)
        result = {}
        raise('adapterID is a required field for InitializeRequestArguments') if options['adapterID'].nil?

        result['clientID']                     = options['clientID'] unless options['clientID'].nil?
        result['adapterID']                    = options['adapterID']
        result['linesStartAt1']                = options['linesStartAt1'] unless options['linesStartAt1'].nil?
        result['columnsStartAt1']              = options['columnsStartAt1'] unless options['clientID'].nil?
        result['pathFormat']                   = options['pathFormat'] unless options['pathFormat'].nil?
        result['supportsVariableType']         = options['supportsVariableType'] unless options['supportsVariableType'].nil?
        result['supportsVariablePaging']       = options['supportsVariablePaging'] unless options['supportsVariablePaging'].nil?
        result['supportsRunInTerminalRequest'] = options['clientID'] unless options['clientID'].nil?

        result
      end
    end

    # /** Response to 'initialize' request. */
    # export interface InitializeResponse extends Response {
    #   /** The capabilities of this debug adapter. */
    #   body?: Capabilities;
    # }
    module InitializeResponse
      def self.create_from_request(options, request = nil)
        Response.create_from_request(options, request)
      end
    end

    # /** Event message for 'terminated' event types.
    #   The event indicates that debugging of the debuggee has terminated.
    # */
    # export interface TerminatedEvent extends Event {
    #   // event: 'terminated';
    #   body?: {
    #     /** A debug adapter may set 'restart' to true (or to an arbitrary object) to request that the front end restarts the session.
    #       The value is not interpreted by the client and passed unmodified as an attribute '__restart' to the launchRequest.
    #     */
    #     restart?: any;
    #   };
    # }
    module TerminatedEvent
      def self.create(options = {})
        result = Event.create('event' => 'terminated', 'seq' => -1)
        result['body'] = {}
        result['body']['restart'] = options['restart'] unless options['restart'].nil?

        result
      end
    end

    # /** Event message for 'thread' event type.
    #   The event indicates that a thread has started or exited.
    # */
    # export interface ThreadEvent extends Event {
    #   // event: 'thread';
    #   body: {
    #     /** The reason for the event (such as: 'started', 'exited'). */
    #     reason: string;
    #     /** The identifier of the thread. */
    #     threadId: number;
    #   };
    # }
    module ThreadEvent
      def self.create(options = {})
        result = Event.create('event' => 'thread', 'seq' => -1)

        raise('reason is a required field for ThreadEvent') if options['reason'].nil?
        raise('threadId is a required field for ThreadEvent') if options['threadId'].nil?

        result['body'] = {
          'reason'   => options['reason'],
          'threadId' => options['threadId']
        }

        result
      end
    end

    # /** Event message for 'output' event type.
    #   The event indicates that the target has produced some output.
    # */
    # export interface OutputEvent extends Event {
    #   // event: 'output';
    #   body: {
    #     /** The category of output (such as: 'console', 'stdout', 'stderr', 'telemetry'). If not specified, 'console' is assumed. */
    #     category?: string;
    #     /** The output to report. */
    #     output: string;
    #     /** If an attribute 'variablesReference' exists and its value is > 0, the output contains objects which can be retrieved by passing variablesReference to the VariablesRequest. */
    #     variablesReference?: number;
    #     /** Optional data to report. For the 'telemetry' category the data will be sent to telemetry, for the other categories the data is shown in JSON format. */
    #     data?: any;
    #   };
    # }
    module OutputEvent
      def self.create(options = {})
        result = Event.create('event' => 'output', 'seq' => -1)
        raise('output is a required field for OutputEvent') if options['output'].nil?

        result['body'] = { 'category' => 'console' }
        result['body']['category'] = options['category'] unless options['category'].nil?
        result['body']['output'] = options['output']
        result['body']['variablesReference'] = options['variablesReference'] unless options['variablesReference'].nil?
        result['body']['data'] = options['data'] unless options['data'].nil?

        result
      end
    end

    # /** Event message for 'exited' event type.
    #   The event indicates that the debuggee has exited.
    # */
    # export interface ExitedEvent extends Event {
    #   // event: 'exited';
    #   body: {
    #     /** The exit code returned from the debuggee. */
    #     exitCode: number;
    #   };
    # }
    module ExitedEvent
      def self.create(options = {})
        result = Event.create('event' => 'exited', 'seq' => -1)
        raise('exitCode is a required field for ExitedEvent') if options['exitCode'].nil?
        result['body'] = {}
        result['body']['exitCode'] = options['exitCode']

        result
      end
    end

    # /** Response to 'configurationDone' request. This is just an acknowledgement, so no body field is required. */
    # export interface ConfigurationDoneResponse extends Response {
    # }
    module ConfigurationDoneResponse
      def self.create_from_request(options, request = nil)
        Response.create_from_request(options, request)
      end
    end

    # /** Launch request; value of command field is 'launch'. */
    # export interface LaunchRequest extends Request {
    #   // command: 'launch';
    #   arguments: LaunchRequestArguments;
    # }
    module LaunchRequest
      def self.create(options)
        result = Request.create(options)
        raise('command is a required field for InitializeRequest') if options['command'].nil?

        result['command']   = options['command']
        result['arguments'] = LaunchRequestArguments.create(options['arguments']) unless options['arguments'].nil?

        result
      end
    end

    # /** Arguments for 'launch' request. */
    # export interface LaunchRequestArguments {
    #   /** If noDebug is true the launch request should launch the program without enabling debugging. */
    #   noDebug?: boolean;
    # }
    module LaunchRequestArguments
      def self.create(options)
        result = options.dup

        result
      end
    end

    # /** Response to 'launch' request. This is just an acknowledgement, so no body field is required. */
    # export interface LaunchResponse extends Response {
    # }
    module LaunchResponse
      def self.create_from_request(options, request = nil)
        Response.create_from_request(options, request)
      end
    end

    # /** SetBreakpoints request; value of command field is 'setBreakpoints'.
    #   Sets multiple breakpoints for a single source and clears all previous breakpoints in that source.
    #   To clear all breakpoint for a source, specify an empty array.
    #   When a breakpoint is hit, a StoppedEvent (event type 'breakpoint') is generated.
    # */
    # export interface SetBreakpointsRequest extends Request {
    #   // command: 'setBreakpoints';
    #   arguments: SetBreakpointsArguments;
    # }
    module SetBreakpointsRequest
      def self.create(options)
        result = Request.create(options)
        raise('command is a required field for SetBreakpointsRequest') if options['command'].nil?
        raise('arguments is a required field for SetBreakpointsRequest') if options['arguments'].nil?

        result['command']   = options['command']
        result['arguments'] = SetBreakpointsArguments.create(options['arguments'])

        result
      end
    end

    # export interface SetBreakpointsArguments {
    #   /** The source location of the breakpoints; either source.path or source.reference must be specified. */
    #   source: Source;
    #   /** The code locations of the breakpoints. */
    #   breakpoints?: SourceBreakpoint[];
    #   /** Deprecated: The code locations of the breakpoints. */
    #   lines?: number[];
    #   /** A value of true indicates that the underlying source has been modified which results in new breakpoint locations. */
    #   sourceModified?: boolean;
    # }
    module SetBreakpointsArguments
      def self.create(options)
        result = {}

        raise('source is a required field for SetBreakpointsArguments') if options['source'].nil?

        result['source']         = Source.create(options['source'])
        result['breakpoints']    = options['breakpoints'].map { |b| SourceBreakpoint.create(b) } unless options['breakpoints'].nil?
        result['lines']          = options['lines'] unless options['lines'].nil?
        result['sourceModified'] = options['sourceModified'] unless options['sourceModified'].nil?

        result
      end
    end

    # /** SetFunctionBreakpoints request; value of command field is 'setFunctionBreakpoints'.
    #   Sets multiple function breakpoints and clears all previous function breakpoints.
    #   To clear all function breakpoint, specify an empty array.
    #   When a function breakpoint is hit, a StoppedEvent (event type 'function breakpoint') is generated.
    # */
    # export interface SetFunctionBreakpointsRequest extends Request {
    #   // command: 'setFunctionBreakpoints';
    #   arguments: SetFunctionBreakpointsArguments;
    # }
    module SetFunctionBreakpointsRequest
      def self.create(options)
        result = Request.create(options)
        raise('command is a required field for SetFunctionBreakpoints') if options['command'].nil?
        raise('arguments is a required field for SetFunctionBreakpoints') if options['arguments'].nil?

        result['command']   = options['command']
        result['arguments'] = SetFunctionBreakpointsArguments.create(options['arguments'])

        result
      end
    end

    # /** Arguments for 'setFunctionBreakpoints' request. */
    # export interface SetFunctionBreakpointsArguments {
    #   /** The function names of the breakpoints. */
    #   breakpoints: FunctionBreakpoint[];
    # }
    module SetFunctionBreakpointsArguments
      def self.create(options)
        result = {}

        raise('breakpoints is a required field for SetFunctionBreakpointsArguments') if options['breakpoints'].nil?
        result['breakpoints'] = options['breakpoints'].each { |b| FunctionBreakpoint.create(b) }

        result
      end
    end

    # /** Response to 'continue' request. */
    # export interface ContinueResponse extends Response {
    #   body: {
    #     /** If true, the continue request has ignored the specified thread and continued all threads instead. If this attribute is missing a value of 'true' is assumed for backward compatibility. */
    #     allThreadsContinued?: boolean;
    #   };
    # }
    module ContinueResponse
      def self.create_from_request(options, request = nil)
        result = Response.create_from_request(options, request)

        result['body'] = { 'allThreadsContinued' => options['allThreadsContinued'] } unless options['allThreadsContinued'].nil?

        result
      end
    end

    # /** Next request; value of command field is 'next'.
    #   The request starts the debuggee to run again for one step.
    #   The debug adapter first sends the NextResponse and then a StoppedEvent (event type 'step') after the step has completed.
    # */
    # export interface NextRequest extends Request {
    #   // command: 'next';
    #   arguments: NextArguments;
    # }
    module NextRequest
      def self.create(options)
        result = Request.create(options)
        raise('command is a required field for NextRequest') if options['command'].nil?
        raise('arguments is a required field for NextRequest') if options['arguments'].nil?

        result['command']   = options['command']
        result['arguments'] = NextArguments.create(options['arguments'])

        result
      end
    end

    # /** Arguments for 'next' request. */
    # export interface NextArguments {
    #   /** Execute 'next' for this thread. */
    #   threadId: number;
    # }
    module NextArguments
      def self.create(options)
        raise('threadId is a required field for NextArguments') if options['threadId'].nil?

        { 'threadId' => options['threadId'] }
      end
    end

    # /** Response to 'next' request. This is just an acknowledgement, so no body field is required. */
    # export interface NextResponse extends Response {
    # }
    module NextResponse
      def self.create_from_request(options, request = nil)
        Response.create_from_request(options, request)
      end
    end

    # /** StepIn request; value of command field is 'stepIn'.
    #   The request starts the debuggee to step into a function/method if possible.
    #   If it cannot step into a target, 'stepIn' behaves like 'next'.
    #   The debug adapter first sends the StepInResponse and then a StoppedEvent (event type 'step') after the step has completed.
    #   If there are multiple function/method calls (or other targets) on the source line,
    #   the optional argument 'targetId' can be used to control into which target the 'stepIn' should occur.
    #   The list of possible targets for a given source line can be retrieved via the 'stepInTargets' request.
    # */
    # export interface StepInRequest extends Request {
    #   // command: 'stepIn';
    #   arguments: StepInArguments;
    # }
    module StepInRequest
      def self.create(options)
        result = Request.create(options)
        raise('command is a required field for StepInRequest') if options['command'].nil?
        raise('arguments is a required field for StepInRequest') if options['arguments'].nil?

        result['command']   = options['command']
        result['arguments'] = StepInArguments.create(options['arguments'])

        result
      end
    end

    # /** Arguments for 'stepIn' request. */
    # export interface StepInArguments {
    #   /** Execute 'stepIn' for this thread. */
    #   threadId: number;
    #   /** Optional id of the target to step into. */
    #   targetId?: number;
    # }
    module StepInArguments
      def self.create(options)
        raise('threadId is a required field for StepInArguments') if options['threadId'].nil?

        result = { 'threadId' => options['threadId'] }
        result['targetId'] = options['targetId'] unless options['targetId'].nil?

        result
      end
    end

    # /** Response to 'stepIn' request. This is just an acknowledgement, so no body field is required. */
    # export interface StepInResponse extends Response {
    # }
    module StepInResponse
      def self.create_from_request(options, request = nil)
        Response.create_from_request(options, request)
      end
    end

    # /** StackTrace request; value of command field is 'stackTrace'. The request returns a stacktrace from the current execution state. */
    # export interface StackTraceRequest extends Request {
    #   // command: 'stackTrace';
    #   arguments: StackTraceArguments;
    # }
    module StackTraceRequest
      def self.create(options)
        result = Request.create(options)
        raise('command is a required field for StackTraceRequest') if options['command'].nil?
        raise('arguments is a required field for StackTraceRequest') if options['arguments'].nil?

        result['command']   = options['command']
        result['arguments'] = StackTraceArguments.create(options['arguments'])

        result
      end
    end

    # /** StepOut request; value of command field is 'stepOut'.
    #   The request starts the debuggee to run again for one step.
    #   The debug adapter first sends the StepOutResponse and then a StoppedEvent (event type 'step') after the step has completed.
    # */
    # export interface StepOutRequest extends Request {
    #   // command: 'stepOut';
    #   arguments: StepOutArguments;
    # }
    module StepOutRequest
      def self.create(options)
        result = Request.create(options)
        raise('command is a required field for StepOutRequest') if options['command'].nil?
        raise('arguments is a required field for StepOutRequest') if options['arguments'].nil?

        result['command']   = options['command']
        result['arguments'] = StepOutArguments.create(options['arguments'])

        result
      end
    end

    # /** Arguments for 'stepOut' request. */
    # export interface StepOutArguments {
    #   /** Execute 'stepOut' for this thread. */
    #   threadId: number;
    # }
    module StepOutArguments
      def self.create(options)
        raise('threadId is a required field for StepOutArguments') if options['threadId'].nil?

        { 'threadId' => options['threadId'] }
      end
    end

    # /** Response to 'stepOut' request. This is just an acknowledgement, so no body field is required. */
    # export interface StepOutResponse extends Response {
    # }
    module StepOutResponse
      def self.create_from_request(options, request = nil)
        Response.create_from_request(options, request)
      end
    end

    # /** Arguments for 'stackTrace' request. */
    # export interface StackTraceArguments {
    #   /** Retrieve the stacktrace for this thread. */
    #   threadId: number;
    #   /** The index of the first frame to return; if omitted frames start at 0. */
    #   startFrame?: number;
    #   /** The maximum number of frames to return. If levels is not specified or 0, all frames are returned. */
    #   levels?: number;
    #   /** Specifies details on how to format the stack frames. */
    #   format?: StackFrameFormat;
    # }
    module StackTraceArguments
      def self.create(options)
        result = {
          'startFrame' => 0,
          'levels'     => 0
        }

        raise('threadId is a required field for StackTraceArguments') if options['threadId'].nil?

        result['threadId']   = options['threadId']
        result['startFrame'] = options['startFrame'] unless options['startFrame'].nil?
        result['levels']     = options['levels'] unless options['levels'].nil?
        result['format']     = options['format'] unless options['format'].nil?

        result
      end
    end

    # /** Response to 'stackTrace' request. */
    # export interface StackTraceResponse extends Response {
    #   body: {
    #     /** The frames of the stackframe. If the array has length zero, there are no stackframes available.
    #       This means that there is no location information available.
    #     */
    #     stackFrames: StackFrame[];
    #     /** The total number of frames available. */
    #     totalFrames?: number;
    #   };
    # }
    module StackTraceResponse
      def self.create_from_request(options, request = nil)
        result = Response.create_from_request(options, request)

        raise('stackFrames is a required field for StackTraceResponse') if options['stackFrames'].nil?

        result['body'] = {
          'stackFrames' => options['stackFrames'],
          'totalFrames' => options['stackFrames'].count
        }

        result
      end
    end

    #   /** Scopes request; value of command field is 'scopes'.
    #   The request returns the variable scopes for a given stackframe ID.
    # */
    # export interface ScopesRequest extends Request {
    #   // command: 'scopes';
    #   arguments: ScopesArguments;
    # }
    module ScopesRequest
      def self.create(options)
        result = Request.create(options)
        raise('command is a required field for ScopesRequest') if options['command'].nil?
        raise('arguments is a required field for ScopesRequest') if options['arguments'].nil?

        result['command']   = options['command']
        result['arguments'] = ScopesArguments.create(options['arguments'])

        result
      end
    end

    # /** Arguments for 'scopes' request. */
    # export interface ScopesArguments {
    #   /** Retrieve the scopes for this stackframe. */
    #   frameId: number;
    # }
    module ScopesArguments
      def self.create(options)
        raise('frameId is a required field for ScopesArguments') if options['frameId'].nil?

        result = {}

        result['frameId'] = options['frameId']

        result
      end
    end

    # /** Response to 'scopes' request. */
    # export interface ScopesResponse extends Response {
    #   body: {
    #     /** The scopes of the stackframe. If the array has length zero, there are no scopes available. */
    #     scopes: Scope[];
    #   };
    # }
    module ScopesResponse
      def self.create_from_request(options, request = nil)
        result = Response.create_from_request(options, request)

        raise('scopes is a required field for ScopesResponse') if options['scopes'].nil?

        result['body'] = {
          'scopes' => options['scopes']
        }

        result
      end
    end

    # /** Variables request; value of command field is 'variables'.
    #   Retrieves all child variables for the given variable reference.
    #   An optional filter can be used to limit the fetched children to either named or indexed children.
    # */
    # export interface VariablesRequest extends Request {
    #   // command: 'variables';
    #   arguments: VariablesArguments;
    # }
    module VariablesRequest
      def self.create(options)
        result = Request.create(options)
        raise('command is a required field for VariablesRequest') if options['command'].nil?
        raise('arguments is a required field for VariablesRequest') if options['arguments'].nil?

        result['command']   = options['command']
        result['arguments'] = VariablesArguments.create(options['arguments'])

        result
      end
    end

    # /** Arguments for 'variables' request. */
    # export interface VariablesArguments {
    #   /** The Variable reference. */
    #   variablesReference: number;
    #   /** Optional filter to limit the child variables to either named or indexed. If ommited, both types are fetched. */
    #   filter?: 'indexed' | 'named';
    #   /** The index of the first variable to return; if omitted children start at 0. */
    #   start?: number;
    #   /** The number of variables to return. If count is missing or 0, all variables are returned. */
    #   count?: number;
    #   /** Specifies details on how to format the Variable values. */
    #   format?: ValueFormat;
    # }
    module VariablesArguments
      def self.create(options)
        raise('variablesReference is a required field for VariablesArguments') if options['variablesReference'].nil?

        result = {}

        result['variablesReference'] = options['variablesReference']
        result['filter']             = options['filter'] unless options['filter'].nil?
        result['start']              = options['start'] unless options['start'].nil?
        result['count']              = options['count'] unless options['count'].nil?
        result['format']             = options['format'] unless options['format'].nil?

        result
      end
    end

    # /** Response to 'variables' request. */
    # export interface VariablesResponse extends Response {
    #   body: {
    #     /** All (or a range) of variables for the given variable reference. */
    #     variables: Variable[];
    #   };
    # }
    module VariablesResponse
      def self.create_from_request(options, request = nil)
        result = Response.create_from_request(options, request)

        raise('variables is a required field for VariablesResponse') if options['variables'].nil?

        result['body'] = {
          'variables' => options['variables']
        }

        result
      end
    end

    # /** Response to 'threads' request. */
    # export interface ThreadsResponse extends Response {
    #   body: {
    #     /** All threads. */
    #     threads: Thread[];
    #   };
    # }
    module ThreadsResponse
      def self.create_from_request(options, request = nil)
        result = Response.create_from_request(options, request)

        raise('threads is a required field for ThreadsResponse') if options['threads'].nil?

        result['body'] = { 'threads' => options['threads'].map { |t| Thread.create(t) } }

        result
      end
    end

    #   /** Evaluate request; value of command field is 'evaluate'.
    #   Evaluates the given expression in the context of the top most stack frame.
    #   The expression has access to any variables and arguments that are in scope.
    # */
    # export interface EvaluateRequest extends Request {
    #   // command: 'evaluate';
    #   arguments: EvaluateArguments;
    # }
    module EvaluateRequest
      def self.create(options)
        result = Request.create(options)
        raise('command is a required field for EvaluateRequest') if options['command'].nil?
        raise('arguments is a required field for EvaluateRequest') if options['arguments'].nil?

        result['command']   = options['command']
        result['arguments'] = EvaluateArguments.create(options['arguments'])

        result
      end
    end

    # /** Arguments for 'evaluate' request. */
    # export interface EvaluateArguments {
    #   /** The expression to evaluate. */
    #   expression: string;
    #   /** Evaluate the expression in the scope of this stack frame. If not specified, the expression is evaluated in the global scope. */
    #   frameId?: number;
    #   /** The context in which the evaluate request is run. Possible values are 'watch' if evaluate is run in a watch, 'repl' if run from the REPL console, or 'hover' if run from a data hover. */
    #   context?: string;
    #   /** Specifies details on how to format the Evaluate result. */
    #   format?: ValueFormat;
    # }
    module EvaluateArguments
      def self.create(options)
        raise('expression is a required field for EvaluateArguments') if options['expression'].nil?

        result = {}

        result['expression'] = options['expression']
        result['frameId']    = options['frameId'] unless options['frameId'].nil?
        result['context']    = options['context'] unless options['context'].nil?
        result['format']     = options['format'] unless options['format'].nil?

        result
      end
    end

    # /** Response to 'evaluate' request. */
    # export interface EvaluateResponse extends Response {
    #   body: {
    #     /** The result of the evaluate request. */
    #     result: string;
    #     /** The optional type of the evaluate result. */
    #     type?: string;
    #     /** If variablesReference is > 0, the evaluate result is structured and its children can be retrieved by passing variablesReference to the VariablesRequest. */
    #     variablesReference: number;
    #     /** The number of named child variables.
    #       The client can use this optional information to present the variables in a paged UI and fetch them in chunks.
    #     */
    #     namedVariables?: number;
    #     /** The number of indexed child variables.
    #       The client can use this optional information to present the variables in a paged UI and fetch them in chunks.
    #     */
    #     indexedVariables?: number;
    #   };
    # }
    module EvaluateResponse
      def self.create_from_request(options, request = nil)
        result = Response.create_from_request(options, request)

        raise('result is a required field for EvaluateResponse') if options['result'].nil?
        raise('variablesReference is a required field for EvaluateResponse') if options['variablesReference'].nil?

        result['body'] = {
          'result'             => options['result'],
          'variablesReference' => options['variablesReference']
        }
        result['body']['type']             = options['type'] unless options['type'].nil?
        result['body']['namedVariables']   = options['namedVariables'] unless options['namedVariables'].nil?
        result['body']['indexedVariables'] = options['indexedVariables'] unless options['indexedVariables'].nil?

        result
      end
    end

    # /** Information about the capabilities of a debug adapter. */
    # export interface Capabilities {
    #   /** The debug adapter supports the configurationDoneRequest. */
    #   supportsConfigurationDoneRequest?: boolean;
    #   /** The debug adapter supports function breakpoints. */
    #   supportsFunctionBreakpoints?: boolean;
    #   /** The debug adapter supports conditional breakpoints. */
    #   supportsConditionalBreakpoints?: boolean;
    #   /** The debug adapter supports breakpoints that break execution after a specified number of hits. */
    #   supportsHitConditionalBreakpoints?: boolean;
    #   /** The debug adapter supports a (side effect free) evaluate request for data hovers. */
    #   supportsEvaluateForHovers?: boolean;
    #   /** Available filters or options for the setExceptionBreakpoints request. */
    #   exceptionBreakpointFilters?: ExceptionBreakpointsFilter[];
    #   /** The debug adapter supports stepping back via the stepBack and reverseContinue requests. */
    #   supportsStepBack?: boolean;
    #   /** The debug adapter supports setting a variable to a value. */
    #   supportsSetVariable?: boolean;
    #   /** The debug adapter supports restarting a frame. */
    #   supportsRestartFrame?: boolean;
    #   /** The debug adapter supports the gotoTargetsRequest. */
    #   supportsGotoTargetsRequest?: boolean;
    #   /** The debug adapter supports the stepInTargetsRequest. */
    #   supportsStepInTargetsRequest?: boolean;
    #   /** The debug adapter supports the completionsRequest. */
    #   supportsCompletionsRequest?: boolean;
    #   /** The debug adapter supports the modules request. */
    #   supportsModulesRequest?: boolean;
    #   /** The set of additional module information exposed by the debug adapter. */
    #   additionalModuleColumns?: ColumnDescriptor[];
    #   /** Checksum algorithms supported by the debug adapter. */
    #   supportedChecksumAlgorithms?: ChecksumAlgorithm[];
    #   /** The debug adapter supports the RestartRequest. In this case a client should not implement 'restart' by terminating and relaunching the adapter but by calling the RestartRequest. */
    #   supportsRestartRequest?: boolean;
    #   /** The debug adapter supports 'exceptionOptions' on the setExceptionBreakpoints request. */
    #   supportsExceptionOptions?: boolean;
    #   /** The debug adapter supports a 'format' attribute on the stackTraceRequest, variablesRequest, and evaluateRequest. */
    #   supportsValueFormattingOptions?: boolean;
    #   /** The debug adapter supports the exceptionInfo request. */
    #   supportsExceptionInfoRequest?: boolean;
    #   /** The debug adapter supports the 'terminateDebuggee' attribute on the 'disconnect' request. */
    #   supportTerminateDebuggee?: boolean;
    #   /** The debug adapter supports the delayed loading of parts of the stack, which requires that both the 'startFrame' and 'levels' arguments and the 'totalFrames' result of the 'StackTrace' request are supported. */
    #   supportsDelayedStackTraceLoading?: boolean;
    # }
    module Capabilities
      def self.create(_options)
        result = {
          # 'supportsConfigurationDoneRequest' => nil,
          # 'supportsFunctionBreakpoints' => nil,
          # 'supportsConditionalBreakpoints' => nil,
          # 'supportsHitConditionalBreakpoints' => nil,
          # 'supportsEvaluateForHovers' => nil,
          # 'exceptionBreakpointFilters' => nil,
          # 'supportsStepBack' => nil,
          # 'supportsSetVariable' => nil,
          # 'supportsRestartFrame' => nil,
          # 'supportsGotoTargetsRequest' => nil,
          # 'supportsStepInTargetsRequest' => nil,
          # 'supportsCompletionsRequest' => nil,
          # 'supportsModulesRequest' => nil,
          # 'additionalModuleColumns' => nil,
          # 'supportedChecksumAlgorithms' => nil,
          # 'supportsRestartRequest' => nil,
          # 'supportsExceptionOptions' => nil,
          # 'supportsValueFormattingOptions' => nil,
          # 'supportsExceptionInfoRequest' => nil,
          # 'supportTerminateDebuggee' => nil,
          # 'supportsDelayedStackTraceLoading' => nil,
        }

        result
      end
    end

    # /** Response to 'setBreakpoints' request.
    #   Returned is information about each breakpoint created by this request.
    #   This includes the actual code location and whether the breakpoint could be verified.
    #   The breakpoints returned are in the same order as the elements of the 'breakpoints'
    #   (or the deprecated 'lines') in the SetBreakpointsArguments.
    # */
    # export interface SetBreakpointsResponse extends Response {
    #   body: {
    #     /** Information about the breakpoints. The array elements are in the same order as the elements of the 'breakpoints' (or the deprecated 'lines') in the SetBreakpointsArguments. */
    #     breakpoints: Breakpoint[];
    #   };
    # }
    module SetBreakpointsResponse
      def self.create_from_request(options, request = nil)
        result = Response.create_from_request(options, request)

        raise('breakpoints is a required field for SetBreakpointsResponse') if options['breakpoints'].nil?

        result['body'] = {
          'breakpoints' => options['breakpoints']
        }

        result
      end
    end

    # /** A Thread */
    # export interface Thread {
    #   /** Unique identifier for the thread. */
    #   id: number;
    #   /** A name of the thread. */
    #   name: string;
    # }
    module Thread
      def self.create(options)
        result = {}

        raise('id is a required field for Thread') if options['id'].nil?
        raise('name is a required field for Thread') if options['name'].nil?
        result['id']   = options['id']
        result['name'] = options['name']

        result
      end
    end

    # /** A Source is a descriptor for source code. It is returned from the debug adapter as part of a StackFrame and it is used by clients when specifying breakpoints. */
    # export interface Source {
    #   /** The short name of the source. Every source returned from the debug adapter has a name. When sending a source to the debug adapter this name is optional. */
    #   name?: string;
    #   /** The path of the source to be shown in the UI. It is only used to locate and load the content of the source if no sourceReference is specified (or its vaule is 0). */
    #   path?: string;
    #   /** If sourceReference > 0 the contents of the source must be retrieved through the SourceRequest (even if a path is specified). A sourceReference is only valid for a session, so it must not be used to persist a source. */
    #   sourceReference?: number;
    #   /** An optional hint for how to present the source in the UI. A value of 'deemphasize' can be used to indicate that the source is not available or that it is skipped on stepping. */
    #   presentationHint?: 'normal' | 'emphasize' | 'deemphasize';
    #   /** The (optional) origin of this source: possible values 'internal module', 'inlined content from source map', etc. */
    #   origin?: string;
    #   /** Optional data that a debug adapter might want to loop through the client. The client should leave the data intact and persist it across sessions. The client should not interpret the data. */
    #   adapterData?: any;
    #   /** The checksums associated with this file. */
    #   checksums?: Checksum[];
    # }
    module Source
      def self.create(options)
        result = {}

        result['name']             = options['name'] unless options['name'].nil?
        result['path']             = options['path'] unless options['path'].nil?
        result['sourceReference']  = options['sourceReference'] unless options['sourceReference'].nil?
        result['presentationHint'] = options['presentationHint'] unless options['presentationHint'].nil?
        result['origin']           = options['origin'] unless options['origin'].nil?
        result['adapterData']      = options['adapterData'] unless options['adapterData'].nil?
        result['checksums']        = options['checksums'] unless options['checksums'].nil?

        result
      end
    end

    # /** A Stackframe contains the source location. */
    # export interface StackFrame {
    #   /** An identifier for the stack frame. It must be unique across all threads. This id can be used to retrieve the scopes of the frame with the 'scopesRequest' or to restart the execution of a stackframe. */
    #   id: number;
    #   /** The name of the stack frame, typically a method name. */
    #   name: string;
    #   /** The optional source of the frame. */
    #   source?: Source;
    #   /** The line within the file of the frame. If source is null or doesn't exist, line is 0 and must be ignored. */
    #   line: number;
    #   /** The column within the line. If source is null or doesn't exist, column is 0 and must be ignored. */
    #   column: number;
    #   /** An optional end line of the range covered by the stack frame. */
    #   endLine?: number;
    #   /** An optional end column of the range covered by the stack frame. */
    #   endColumn?: number;
    #   /** The module associated with this frame, if any. */
    #   moduleId?: number | string;
    #   /** An optional hint for how to present this frame in the UI. A value of 'label' can be used to indicate that the frame is an artificial frame that is used as a visual label or separator. A value of 'subtle' can be used to change the appearance of a frame in a 'subtle' way. */
    #   presentationHint?: 'normal' | 'label' | 'subtle';
    # }
    module Stackframe
      def self.create(options)
        result = {}

        raise('id is a required field for Stackframe') if options['id'].nil?
        raise('name is a required field for Stackframe') if options['name'].nil?
        raise('line is a required field for Stackframe') if options['line'].nil?
        raise('column is a required field for Stackframe') if options['column'].nil?

        result['id']               = options['id']
        result['name']             = options['name']
        result['path']             = Source.create(options['source']) unless options['source'].nil?
        result['line']             = options['line']
        result['column']           = options['column']
        result['endLine']          = options['endLine'] unless options['endLine'].nil?
        result['endColumn']        = options['endColumn'] unless options['endColumn'].nil?
        result['moduleId']         = options['moduleId'] unless options['moduleId'].nil?
        result['presentationHint'] = options['presentationHint'] unless options['presentationHint'].nil?

        result
      end
    end

    # /** A Scope is a named container for variables. Optionally a scope can map to a source or a range within a source. */
    # export interface Scope {
    #   /** Name of the scope such as 'Arguments', 'Locals'. */
    #   name: string;
    #   /** The variables of this scope can be retrieved by passing the value of variablesReference to the VariablesRequest. */
    #   variablesReference: number;
    #   /** The number of named variables in this scope.
    #     The client can use this optional information to present the variables in a paged UI and fetch them in chunks.
    #   */
    #   namedVariables?: number;
    #   /** The number of indexed variables in this scope.
    #     The client can use this optional information to present the variables in a paged UI and fetch them in chunks.
    #   */
    #   indexedVariables?: number;
    #   /** If true, the number of variables in this scope is large or expensive to retrieve. */
    #   expensive: boolean;
    #   /** Optional source for this scope. */
    #   source?: Source;
    #   /** Optional start line of the range covered by this scope. */
    #   line?: number;
    #   /** Optional start column of the range covered by this scope. */
    #   column?: number;
    #   /** Optional end line of the range covered by this scope. */
    #   endLine?: number;
    #   /** Optional end column of the range covered by this scope. */
    #   endColumn?: number;
    # }
    module Scope
      def self.create(options)
        result = {}

        raise('name is a required field for Scope') if options['name'].nil?
        raise('variablesReference is a required field for Scope') if options['variablesReference'].nil?
        raise('expensive is a required field for Scope') if options['expensive'].nil?

        result['name']               = options['name']
        result['variablesReference'] = options['variablesReference']
        result['expensive']          = options['expensive']

        %w[namedVariables indexedVariables source line column endLine endColumn].each do |varname|
          result[varname]  = options[varname] unless options[varname].nil?
        end

        result
      end
    end

    #   /** A Variable is a name/value pair.
    #   Optionally a variable can have a 'type' that is shown if space permits or when hovering over the variable's name.
    #   An optional 'kind' is used to render additional properties of the variable, e.g. different icons can be used to indicate that a variable is public or private.
    #   If the value is structured (has children), a handle is provided to retrieve the children with the VariablesRequest.
    #   If the number of named or indexed children is large, the numbers should be returned via the optional 'namedVariables' and 'indexedVariables' attributes.
    #   The client can use this optional information to present the children in a paged UI and fetch them in chunks.
    # */
    # export interface Variable {
    #   /** The variable's name. */
    #   name: string;
    #   /** The variable's value. This can be a multi-line text, e.g. for a function the body of a function. */
    #   value: string;
    #   /** The type of the variable's value. Typically shown in the UI when hovering over the value. */
    #   type?: string;
    #   /** Properties of a variable that can be used to determine how to render the variable in the UI. Format of the string value: TBD. */
    #   kind?: string;
    #   /** Optional evaluatable name of this variable which can be passed to the 'EvaluateRequest' to fetch the variable's value. */
    #   evaluateName?: string;
    #   /** If variablesReference is > 0, the variable is structured and its children can be retrieved by passing variablesReference to the VariablesRequest. */
    #   variablesReference: number;
    #   /** The number of named child variables.
    #     The client can use this optional information to present the children in a paged UI and fetch them in chunks.
    #   */
    #   namedVariables?: number;
    #   /** The number of indexed child variables.
    #     The client can use this optional information to present the children in a paged UI and fetch them in chunks.
    #   */
    #   indexedVariables?: number;
    # }
    module Variable
      def self.create(options)
        result = {}

        raise('name is a required field for Variable') if options['name'].nil?
        raise('value is a required field for Variable') if options['value'].nil?
        raise('variablesReference is a required field for Variable') if options['variablesReference'].nil?

        result['name']               = options['name']
        result['value']              = options['value']
        result['variablesReference'] = options['variablesReference']

        %w[type kind evaluateName namedVariables indexedVariables'].each do |varname|
          result[varname]  = options[varname] unless options[varname].nil?
        end

        result
      end
    end

    # /** Properties of a breakpoint passed to the setBreakpoints request. */
    # export interface SourceBreakpoint {
    #   /** The source line of the breakpoint. */
    #   line: number;
    #   /** An optional source column of the breakpoint. */
    #   column?: number;
    #   /** An optional expression for conditional breakpoints. */
    #   condition?: string;
    #   /** An optional expression that controls how many hits of the breakpoint are ignored. The backend is expected to interpret the expression as needed. */
    #   hitCondition?: string;
    # }
    module SourceBreakpoint
      def self.create(options)
        result = {}

        raise('line is a required field for SourceBreakpoint') if options['line'].nil?
        result['line']         = options['line']
        result['column']       = options['column'] unless options['column'].nil?
        result['condition']    = options['condition'] unless options['condition'].nil?
        result['hitCondition'] = options['hitCondition'] unless options['hitCondition'].nil?

        result
      end
    end

    # /** Properties of a breakpoint passed to the setFunctionBreakpoints request. */
    # export interface FunctionBreakpoint {
    #   /** The name of the function. */
    #   name: string;
    #   /** An optional expression for conditional breakpoints. */
    #   condition?: string;
    #   /** An optional expression that controls how many hits of the breakpoint are ignored. The backend is expected to interpret the expression as needed. */
    #   hitCondition?: string;
    # }
    module FunctionBreakpoint
      def self.create(options)
        result = {}

        raise('name is a required field for FunctionBreakpoint') if options['name'].nil?
        result['condition']    = options['condition'] unless options['condition'].nil?
        result['hitCondition'] = options['hitCondition'] unless options['hitCondition'].nil?

        result
      end
    end

    # /** Information about a Breakpoint created in setBreakpoints or setFunctionBreakpoints. */
    # export interface Breakpoint {
    #   /** An optional unique identifier for the breakpoint. */
    #   id?: number;
    #   /** If true breakpoint could be set (but not necessarily at the desired location). */
    #   verified: boolean;
    #   /** An optional message about the state of the breakpoint. This is shown to the user and can be used to explain why a breakpoint could not be verified. */
    #   message?: string;
    #   /** The source where the breakpoint is located. */
    #   source?: Source;
    #   /** The start line of the actual range covered by the breakpoint. */
    #   line?: number;
    #   /** An optional start column of the actual range covered by the breakpoint. */
    #   column?: number;
    #   /** An optional end line of the actual range covered by the breakpoint. */
    #   endLine?: number;
    #   /** An optional end column of the actual range covered by the breakpoint. If no end line is given, then the end column is assumed to be in the start line. */
    #   endColumn?: number;
    # }
    module Breakpoint
      def self.create(options)
        result = {}

        raise('verified is a required field for Breakpoint') if options['verified'].nil?

        result['id']        = options['id'] unless options['id'].nil?
        result['verified']  = options['verified']
        result['message']   = options['message'] unless options['message'].nil?
        result['source']    = options['source'] unless options['source'].nil?
        result['message']   = options['message'] unless options['message'].nil?
        result['line']      = options['line'] unless options['line'].nil?
        result['column']    = options['column'] unless options['column'].nil?
        result['endLine']   = options['message'] unless options['endLine'].nil?
        result['endColumn'] = options['endColumn'] unless options['endColumn'].nil?

        result
      end
    end
  end
end
