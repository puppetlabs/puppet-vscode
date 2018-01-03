module PuppetDebugServer
  module PuppetDebugSession
    @session_function_breakpoints = []
    @session_source_breakpoints = {}

    def self.function_breakpoints=(value)
      @session_mutex.synchronize { @session_function_breakpoints = value }
    end

    def self.function_breakpoints
      value = nil
      @session_mutex.synchronize { value = @session_function_breakpoints.dup }
      value
    end

    def self.source_breakpoints(filename)
      value = nil
      @session_mutex.synchronize do
        value = @session_source_breakpoints[filename].dup unless @session_source_breakpoints[filename].nil?
      end
      value
    end

    def self.validate_and_set_source_breakpoints(filesource, breakpoints)
      bp_list = []

      bp_response = []

      file_path = File.expand_path(filesource['path']) # Rub-ify the filepath. Important on Windows platforms.
      file_contents = nil

      if File.exist?(file_path)
        # TODO: Need to guard against big files
        file_contents = File.readlines(file_path)
      end

      breakpoints.each do |bp|
        verified = nil
        message = nil

        if file_contents.nil?
          verified = false
          message = "Source \"#{file_path}\" does not exist or not readable"
        else
          line_text = nil
          line_num = bp['line']

          # TODO: Factor in zero based line numbers
          line_text = file_contents[line_num - 1] unless line_num.nil?
          line_text = '' if line_text.nil?
          # Strip whitespace
          line_text.strip!
          # Strip comments
          line_text = line_text.partition('#')[0]

          if line_text.empty?
            verified = false
            message = 'Line does not exist or is blank'
          else
            verified = true
          end
        end

        verified = false if verified.nil?

        # Generate a BreakPoint response object
        bpr = PuppetDebugServer::Protocol::Breakpoint.create(
          'verified' => verified,
          'message' => message
        )
        bp_response << bpr

        # Add to the list of breakpoints we should use
        bp_list << bp if verified
      end

      @session_mutex.synchronize { @session_source_breakpoints[file_path] = bp_list }

      bp_response
    end
  end
end
