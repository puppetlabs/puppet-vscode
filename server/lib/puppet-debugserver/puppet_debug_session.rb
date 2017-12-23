module PuppetDebugServer
  module PuppetDebugSession
    @connection = nil
    @puppet_thread = nil
    @watcher_thread = nil
    @exit_session = false
    @configuration_completed = false
    @session_options = {}
    @session_paused = false
    @session_suppress_log_messages = false
    @session_mutex = Mutex.new()

    @session_evaluating_parser = nil

    @session_compiler = nil # TODO Not sure we need this
    @session_paused_state = {}
    @session_variables_cache = {}

    def self.puppet_thread_id
      @puppet_thread.object_id.to_i unless @puppet_thread.nil?
    end

    def self.connection
      @connection
    end

    def self.setup(connection_object, options = {})
      @connection = connection_object
      @session_options = options
    end
    def self.setup?
      !@connection.nil?
    end

    def self.client_completed_configuration=(value)
      @configuration_completed = value
    end
    def self.client_completed_configuration?
      @configuration_completed
    end

    # BEGIN Session flow methods
    # valid values :run, :stepin, :next, :stepout
    @session_run_mode = { :value => :run, :options => {} }

    def self.clear_paused_state
      # Clear out any saved state from being paused
      @session_paused_state = {}
      @session_variables_cache = {}
    end

    def self.pause_session
      @session_mutex.synchronize {
        @session_paused = true
      }
    end

    def self.continue_session
      @session_mutex.synchronize {
        @session_paused = false
        @session_run_mode = { :value => :run, :options => {} }
        clear_paused_state
      }
    end

    def self.continue_stepin_session
      @session_mutex.synchronize {
        @session_paused = false
        @session_run_mode = { :value => :stepin, :options => {} }
        clear_paused_state
      }
    end

    def self.continue_stepout_session
      @session_mutex.synchronize {
        @session_paused = false
        @session_run_mode = { :value => :stepout, :options => { :pops_depth_level => @session_paused_state[:pops_depth_level] } }
        clear_paused_state
      }
    end

    def self.continue_next_session
      @session_mutex.synchronize {
        @session_paused = false
        @session_run_mode = { :value => :next, :options => { :pops_depth_level => @session_paused_state[:pops_depth_level] } }
        clear_paused_state
      }
    end

    def self.run_mode
      value = nil
      @session_mutex.synchronize {
        value = @session_run_mode[:value]
      }
      value
    end
    def self.run_mode_options
      value = nil
      @session_mutex.synchronize {
        value = @session_run_mode[:options]
      }
      value
    end

    def self.session_paused?
      paused_value = nil
      @session_mutex.synchronize {
        paused_value = @session_paused
      }
      paused_value
    end
    # END Session flow methods

    def self.session_compiler=(value)
      @session_compiler = value
    end

    def self.suppress_log_messages
      value = false
      @session_mutex.synchronize {
        value = @session_suppress_log_messages
      }
      value
    end
    def self.suppress_log_messages=(value)
      @session_mutex.synchronize {
        @session_suppress_log_messages = value
      }
    end

    def self.session_active?
      return false if @puppet_thread.nil? || @watcher_thread.nil?

      @puppet_thread.alive? || @watcher_thread.alive?
    end

    def self.eval_parser
      @session_evaluating_parser ||= ::Puppet::Pops::Parser::EvaluatingParser.new
    end

    def self.evaluate_string(command, suppress_log = false)
      return if command.nil?

      self.suppress_log_messages = true if suppress_log
      result = eval_parser.evaluate_string(@session_compiler.topscope, command)
      self.suppress_log_messages = false if suppress_log

      result
    end

    def self.raise_and_wait_stopped_event(reason, description, text, options = {})
      # Signal an exception stop event
      PuppetDebugServer::PuppetDebugSession.pause_session

      # Setup the state so when the client queries us, we can respond.
      @session_paused_state = {}
      @session_paused_state[:exception]         = options[:session_exception] unless options[:session_exception].nil?
      @session_paused_state[:puppet_stacktrace] = options[:puppet_stacktrace] unless options[:puppet_stacktrace].nil?
      @session_paused_state[:pops_target]       = options[:pops_target] unless options[:pops_target].nil?
      @session_paused_state[:scope]             = options[:scope] unless options[:scope].nil?
      @session_paused_state[:pops_depth_level]  = options[:pops_depth_level] unless options[:pops_depth_level].nil?

      PuppetDebugServer::PuppetDebugSession.connection.send_stopped_event(reason, {
        'description' => description,
        'text'        => text,
        'threadId'    => PuppetDebugServer::PuppetDebugSession.puppet_thread_id,
      })

      # Spin-wait for the session to be unpaused...
      begin
        sleep(0.5)
      end while PuppetDebugServer::PuppetDebugSession.session_paused?
    end

    def self.start
      PuppetDebugServer.log_message(:info, 'Launching Puppet Debug Session...')

      @exit_session = false
      continue_session
      @puppet_thread = Thread.new do
        begin
          PuppetDebugServer::PuppetDebugSession.start_puppet
        rescue => err
          PuppetDebugServer.log_message(:error, "Error in Puppet Thread: #{err}")
          raise
        end
      end
      # Raise ThreadStart event
      connection.send_thread_event('started', puppet_thread_id)

      @watcher_thread = Thread.new do
        begin
          PuppetDebugServer::PuppetDebugSession.debug_session_watcher
        rescue => err
          PuppetDebugServer.log_message(:error, "Error in Watcher Thread: #{err}")
          raise
        end
      end
    end

    def self.stop
      PuppetDebugServer.log_message(:info, 'Stopping Puppet Debug Session...')
      return if @puppet_thread.nil?
      Thread.kill(@puppet_thread)
      @session_compiler = nil
      clear_paused_state
      @exit_session = true
      true
    end

    def self.variable_from_ruby_object(name, value)
      var_ref = 0
      named_variables = nil
      indexed_variables = nil
      out_value = value.to_s

      if value.is_a?(Array)
        indexed_variables = value.count
        var_ref = value.object_id
        out_value = "Array [#{indexed_variables} item/s]"
        @session_variables_cache[var_ref] = value
      end

      if value.is_a?(Hash)
        named_variables = value.count
        var_ref = value.object_id
        out_value = "Hash [#{named_variables} item/s]"
        @session_variables_cache[var_ref] = value
      end

      PuppetDebugServer::Protocol::Variable.create({
        'name' => name,
        'value' => out_value,
        'variablesReference' => var_ref,
      })
    end

    def self.variable_list_from_hash(obj_hash = {})
      result = []
      obj_hash.sort.each do |key,value|
        result << variable_from_ruby_object(key, value)
      end

      result
    end

    def self.variable_list_from_array(obj_array = [])
      result = []
      obj_array.each_index do |index|
        result << variable_from_ruby_object(index.to_s, obj_array[index])
      end

      result
    end

    def self.generate_variable_list(variable_reference, options = {})
      result = nil

      # Check if this is the topscope
      if result.nil? && variable_reference == VARIABLE_REFERENCE_TOP_SCOPE
        result = variable_list_from_hash(@session_compiler.topscope.to_hash(false))
      end

      # Could be a cached variables reference
      if result.nil? && @session_variables_cache.include?(variable_reference)
        this_var = @session_variables_cache[variable_reference]
        result = variable_list_from_hash(this_var) if this_var.is_a?(Hash)
        result = variable_list_from_array(this_var) if this_var.is_a?(Array)
      end

      # Could be a child scope
      if result.nil? && !@session_paused_state[:scope].nil?
        this_scope = @session_paused_state[:scope]
        begin
          if this_scope.object_id == variable_reference
            result = variable_list_from_hash(this_scope.to_hash(false))
            break
          end
          this_scope = this_scope.parent
        end while !(this_scope.nil? || this_scope.is_topscope?)
      end

      # TODO Add paging

      result || []
    end

    VARIABLE_REFERENCE_TOP_SCOPE = 1

    def self.generate_scopes_list(options = {})
      result = []

      unless @session_paused_state[:scope].nil?
        this_scope = @session_paused_state[:scope]
        begin
          result << PuppetDebugServer::Protocol::Scope.create({
            'name' => this_scope.to_s,
            'variablesReference' => this_scope.object_id,
            'namedVariables' => this_scope.to_hash(false).count,
            'expensive' => false,
          })
          this_scope = this_scope.parent
        end while !(this_scope.nil? || this_scope.is_topscope?)
      end

      unless @session_compiler.nil?
        result << PuppetDebugServer::Protocol::Scope.create({
          'name' => @session_compiler.topscope.to_s,
          'variablesReference' => VARIABLE_REFERENCE_TOP_SCOPE,
          'namedVariables' => @session_compiler.topscope.to_hash(false).count,
          'expensive' => false,
        })
      end
      result
    end

    def self.generate_stackframe_list(options = {})
      stack_frames = []

      # Generate StackFrame for a Pops::Evaluator object with location information
      unless @session_paused_state[:pops_target].nil?
        target = @session_paused_state[:pops_target]

        frame = {
          'id' => stack_frames.count,
          'name' => get_puppet_class_name(target),
          'line' => 0,
          'column' => 0,
        }

        # TODO need to check on the client capabilities of zero or one based indexes
        if target.is_a?(Puppet::Pops::Model::Positioned)
          # TODO - Potential issue here with 4.10.x not implementing .file on the Positioned class
          frame['source'] = PuppetDebugServer::Protocol::Source.create({
            'path'   => target.file,
          })
          frame['name'] = target.file
          frame['line'] = target.line
          frame['column'] = target.pos || 0

          if target.length > 0
            end_offset = target.offset + target.length
            frame['endLine'] = target.locator.line_for_offset(end_offset)
            frame['endColumn'] = target.locator.pos_on_line(end_offset)
          end
        end

        stack_frames << frame
      end

      # Generate StackFrame for an error
      unless @session_paused_state[:exception].nil?
        err = @session_paused_state[:exception]
        frame = {
          'id' => stack_frames.count,
          'name' => err.class.to_s,
          'line' => 0,
          'column' => 0,
        }

        # TODO need to check on the client capabilities of zero or one based indexes
        # TODO - Potential issue here with 4.10.x not implementing .file on the Positioned class
        unless err.file.nil? || err.line.nil?
          frame['source'] = PuppetDebugServer::Protocol::Source.create({
            'path'   => err.file,
          })
          frame['line'] = err.line
          frame['column'] = err.pos || 0
        end

        stack_frames << frame
      end

      # Generate StackFrame for each PuppetStack element
      unless @session_paused_state[:puppet_stacktrace].nil?
        @session_paused_state[:puppet_stacktrace].each do |pup_stack|
          source_file = pup_stack[0]
          # TODO need to check on the client capabilities of zero or one based indexes
          source_line = pup_stack[1]

          frame = {
            'id' => stack_frames.count,
            'name' => "#{source_file}",
            'source' => PuppetDebugServer::Protocol::Source.create({
              'path' => source_file,
            }),
            'line' => source_line,
            'column' => 0,
          }
          stack_frames << frame
        end
      end

      stack_frames
    end

    # Public method but only called publicly for
    # for testing
    def self.reset_pops_eval_depth
      @session_pops_eval_depth = 0
    end

    # Private methods
    def self.get_location_from_pops_object(obj)
      pos = SourcePosition.new()
      return pos unless obj.is_a?(Puppet::Pops::Model::Positioned)

      if obj.respond_to?(:file) && obj.respond_to?(:line)
        # These methods were added to the Puppet::Pops::Model::Positioned in Puppet 5.x
        pos.file   = obj.file
        pos.line   = obj.line
        pos.offset = obj.offset
        pos.length = obj.length
      else
        # Revert to Puppet 4.x location information.  A little more expensive to call
        obj_loc = Puppet::Pops::Utils.find_closest_positioned(obj)
        pos.file   = obj_loc.locator.file
        pos.line   = obj_loc.line
        pos.offset = obj_loc.offset
        pos.length = obj_loc.length
      end

      pos
    end

    def self.get_puppet_class_name(obj)
      # Puppet 5 has PCore Types
      return obj._pcore_type.simple_name if obj.respond_to?(:_pcore_type)
      # .. otherwise revert to simple naive text splitting
      # e.g. Puppet::Pops::Model::CallNamedFunctionExpression becomes CallNamedFunctionExpression
      obj.class.to_s.split('::').last
    end

    def self.get_ast_class_name(obj)
      # Puppet 5 has PCore Types
      return obj._pcore_type.name if obj.respond_to?(:_pcore_type)
      # .. otherwise revert to Pops classname
      obj.class.to_s
    end

    def self.line_for_offset(obj, offset)
      # Puppet 5 exposes the source locator on the Pops object
      return obj.locator.line_for_offset(offset) if obj.respond_to?(:locator)

      # Revert to Puppet 4.x location information.  A little more expensive to call
      obj_loc = Puppet::Pops::Utils.find_closest_positioned(obj)
      obj_loc.locator.line_for_offset(offset)
    end

    def self.debug_session_watcher
      loop do
        sleep(1)
        break if @exit_session
        unless @puppet_thread.alive?
          # Raise ThreadStop event
          connection.send_thread_event('exited', puppet_thread_id)
          PuppetDebugServer.log_message(:info, 'Puppet Debug session is no longer running. Sending termination event')
          # TODO Do we need the termination?
          connection.send_termination_event
          break
        end
      end
    end

    def self.start_puppet
      # Run puppet
      cmd_args = ['apply',@session_options['manifest'],'--detailed-exitcodes','--logdest','debugserver']
      cmd_args << '--noop' if @session_options['noop'] == true
      cmd_args.push(*@session_options['args']) unless @session_options['args'].nil?

      reset_pops_eval_depth

      # Send experimental warning
      PuppetDebugServer::PuppetDebugSession.connection.send_output_event({
        'category' => 'console',
        'output' => "**************************************************\n* The Puppet debugger is an experimental feature *\n* Debug Server v#{PuppetVSCode.version}                            *\n**************************************************\n\n",
      })

      PuppetDebugServer::PuppetDebugSession.connection.send_output_event({
        'category' => 'console',
        'output' => 'puppet ' + cmd_args.join(' ') + "\n",
      })
      Puppet::Util::CommandLine.new('puppet.rb',cmd_args).execute
    end

    class SourcePosition
      attr_accessor :file
      attr_accessor :line
      attr_accessor :offset
      attr_accessor :length
    end
  end
end
