module PuppetDebugServer
  module PuppetDebugSession
    @hook_handler = nil

    def self.hooks
      if @hook_handler.nil?
        @hook_handler = PuppetDebugServer::Hooks.new

        @hook_handler.add_hook(:hook_before_apply_exit, :debug_session)           { |args| PuppetDebugServer::PuppetDebugSession.on_hook_before_apply_exit(args) }
        @hook_handler.add_hook(:hook_breakpoint, :debug_session)                  { |args| PuppetDebugServer::PuppetDebugSession.hook_breakpoint(args) }
        @hook_handler.add_hook(:hook_step_breakpoint, :debug_session)             { |args| PuppetDebugServer::PuppetDebugSession.hook_step_breakpoint(args) }
        @hook_handler.add_hook(:hook_function_breakpoint, :debug_session)         { |args| PuppetDebugServer::PuppetDebugSession.hook_function_breakpoint(args) }
        @hook_handler.add_hook(:hook_before_compile, :debug_session)              { |args| PuppetDebugServer::PuppetDebugSession.hook_before_compile(args) }
        @hook_handler.add_hook(:hook_exception, :debug_session)                   { |args| PuppetDebugServer::PuppetDebugSession.hook_exception(args) }
        @hook_handler.add_hook(:hook_log_message, :debug_session)                 { |args| PuppetDebugServer::PuppetDebugSession.hook_log_message(args) }
        @hook_handler.add_hook(:hook_after_parser_function_reset, :debug_session) { |args| PuppetDebugServer::PuppetDebugSession.hook_after_parser_function_reset(args) }
        @hook_handler.add_hook(:hook_before_pops_evaluate, :debug_session)        { |args| PuppetDebugServer::PuppetDebugSession.hook_before_pops_evaluate(args) }
        @hook_handler.add_hook(:hook_after_pops_evaluate, :debug_session)         { |args| PuppetDebugServer::PuppetDebugSession.hook_after_pops_evaluate(args) }
      end
      @hook_handler
    end

    def self.hook_before_pops_evaluate(args)
      return if PuppetDebugServer::PuppetDebugSession.session_paused?
      @session_pops_eval_depth += 1
      target = args[1]
      # Ignore this if there is no positioning information available
      return unless target.is_a?(Puppet::Pops::Model::Positioned)
      target_loc = get_location_from_pops_object(target)

      # Even if it's positioned, it can still contain invalid information.  Ignore it if
      # it's missing required information.  This can happen when evaluting strings (e.g. watches from VSCode)
      # i.e. not a file on disk
      return if target_loc.file.nil? || target_loc.file.empty?
      target_classname = get_puppet_class_name(target)
      ast_classname = get_ast_class_name(target)

      # Break if we hit a specific puppet function
      if target_classname == 'CallNamedFunctionExpression'
        # TODO: Do we really need to break on a function called breakpoint?
        if target.functor_expr.value == 'breakpoint'
          # Re-raise the hook as a breakpoint
          PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_function_breakpoint, [target.functor_expr.value, ast_classname] + args)
          return
        else
          func_names = PuppetDebugServer::PuppetDebugSession.function_breakpoints
          func_names.each do |func|
            next unless func['name'] == target.functor_expr.value
            # Re-raise the hook as a breakpoint
            PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_function_breakpoint, [target.functor_expr.value, ast_classname] + args)
            return # rubocop:disable Lint/NonLocalExitFromIterator
          end
        end
      end

      unless target_loc.length.zero?
        excluded_classes = %w[BlockExpression HostClassDefinition]
        file_path = target_loc.file
        breakpoints = PuppetDebugServer::PuppetDebugSession.source_breakpoints(file_path)
        # TODO: Should check if it's an object we don't care aount
        unless excluded_classes.include?(target_classname) || breakpoints.nil? || breakpoints.empty?
          # Calculate the start and end lines of the target
          target_start_line = target_loc.line
          target_end_line   = line_for_offset(target, target_loc.offset + target_loc.length)

          breakpoints.each do |bp|
            bp_line = bp['line']
            # TODO: What about Hit and Conditional BreakPoints?
            if bp_line >= target_start_line && bp_line <= target_end_line
              # Re-raise the hook as a breakpoint
              PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_breakpoint, [ast_classname, ''] + args)
              return # rubocop:disable Lint/NonLocalExitFromIterator
            end
          end
        end
      end

      # Break if we are stepping
      case PuppetDebugServer::PuppetDebugSession.run_mode
      when :stepin
        # Stepping-in is basically break on everything
        # Re-raise the hook as a step breakpoint
        PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_step_breakpoint, [ast_classname, ''] + args)
        return
      when :next
        # Next will break on anything at this Pop depth or shallower
        # Re-raise the hook as a step breakpoint
        run_options = PuppetDebugServer::PuppetDebugSession.run_mode_options
        if !run_options[:pops_depth_level].nil? && @session_pops_eval_depth <= run_options[:pops_depth_level]
          PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_step_breakpoint, [ast_classname, ''] + args)
          return
        end
      when :stepout
        # Stepping-Out will break on anything shallower than this Pop depth
        # Re-raise the hook as a step breakpoint
        run_options = PuppetDebugServer::PuppetDebugSession.run_mode_options
        if !run_options[:pops_depth_level].nil? && @session_pops_eval_depth < run_options[:pops_depth_level]
          PuppetDebugServer::PuppetDebugSession.hooks.exec_hook(:hook_step_breakpoint, [ast_classname, ''] + args)
          return
        end
      end
    end

    def self.hook_after_pops_evaluate(args)
      return if PuppetDebugServer::PuppetDebugSession.session_paused?
      @session_pops_eval_depth -= 1
      target = args[1]
      return unless target.is_a?(Puppet::Pops::Model::Positioned)
    end

    def self.hook_after_parser_function_reset(args)
      func_object = args[0]

      # TODO: Do we really need to break on a function called breakpoint?
      func_object.newfunction(:breakpoint, :type => :rvalue, :arity => -1, :doc => 'Breakpoint Function') do |arguments|
        # This function is just a place holder.  It gets interpretted at the pops_evaluate hooks but the function
        # itself still needs to exist though.
      end
    end

    def self.on_hook_before_apply_exit(args)
      option = args[0]

      PuppetDebugServer::PuppetDebugSession.connection.send_exited_event(option)
      PuppetDebugServer::PuppetDebugSession.connection.send_output_event(
        'category' => 'console',
        'output' => "puppet exited with #{option}"
      )
    end

    def self.hook_breakpoint(args)
      process_breakpoint_hook('breakpoint', args)
    end

    def self.hook_function_breakpoint(args)
      process_breakpoint_hook('function breakpoint', args)
    end

    def self.hook_step_breakpoint(args)
      process_breakpoint_hook('step', args)
    end

    def self.process_breakpoint_hook(reason, args)
      # If the debug session is paused, can't raise a new breakpoint
      return if PuppetDebugServer::PuppetDebugSession.session_paused?
      break_display_text = args[0]
      break_description = args[1]

      scope_object = nil
      pops_target_object = nil
      pops_depth_level = nil

      # Check if the breakpoint came from the Pops::Evaluator
      if args[2].is_a?(Puppet::Pops::Evaluator::EvaluatorImpl)
        pops_target_object = args[3]
        scope_object = args[4]
        pops_depth_level = @session_pops_eval_depth
      end

      break_description = break_display_text if break_description.empty?
      stack_trace = Puppet::Pops::PuppetStack.stacktrace
      # Due to https://github.com/puppetlabs/puppet/commit/0f96dd918b6184261bc2219e5e68e246ffbeac10
      # Prior to Puppet 4.8.0, stacktrace is in reverse order
      stack_trace.reverse! if Gem::Version.new(Puppet.version) < Gem::Version.new('4.8.0')

      PuppetDebugServer::PuppetDebugSession.raise_and_wait_stopped_event(
        reason,
        break_display_text,
        break_description,
        :pops_target       => pops_target_object,
        :scope             => scope_object,
        :pops_depth_level  => pops_depth_level,
        :puppet_stacktrace => stack_trace
      )
    end

    def self.hook_before_compile(args)
      PuppetDebugServer::PuppetDebugSession.session_compiler = args[0]

      # Spin-wait for the configurationDone message from the client before we continue compilation
      sleep(0.5) until PuppetDebugServer::PuppetDebugSession.client_completed_configuration?
    end

    def self.hook_exception(args)
      # If the debug session is paused, can't raise a new exception
      return if PuppetDebugServer::PuppetDebugSession.session_paused?

      error_detail = args[0]

      PuppetDebugServer::PuppetDebugSession.raise_and_wait_stopped_event(
        'exception',
        'Compilation Exception',
        error_detail.basic_message,
        :session_exception => error_detail,
        :puppet_stacktrace => Puppet::Pops::PuppetStack.stacktrace_from_backtrace(error_detail)
      )
    end

    def self.hook_log_message(args)
      return if suppress_log_messages
      msg = args[0]
      str = msg.respond_to?(:multiline) ? msg.multiline : msg.to_s
      str = msg.source == 'Puppet' ? str : "#{msg.source}: #{str}"

      level = msg.level.to_s.capitalize

      category = 'stderr'
      category = 'stdout' if msg.level == :notice || msg.level == :info || msg.level == :debug

      PuppetDebugServer::PuppetDebugSession.connection.send_output_event(
        'category' => category,
        'output' => "#{level}: #{str}\n"
      )
    end
  end
end
