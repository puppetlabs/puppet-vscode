require 'json'

# Full debug protocol
# https://github.com/Microsoft/vscode-debugadapter-node/blob/master/protocol/src/debugProtocol.ts

module PuppetDebugServer
  class JSONHandler < PuppetVSCode::SimpleTCPServerConnection
    def initialize(*_options)
      @state = :data
      @buffer = []
      @response_sequence = 1
    end

    def post_init
      PuppetDebugServer.log_message(:info, 'Client has connected to the debug server')
    end

    def unbind
      PuppetDebugServer.log_message(:info, 'Client has disconnected from the debug server')
    end

    def extract_headers(raw_header)
      header = {}
      raw_header.split("\r\n").each do |item|
        name, value = item.split(':', 2)

        if name.casecmp('Content-Length').zero?
          header['Content-Length'] = value.strip.to_i
        elsif name.casecmp('Content-Type').zero?
          header['Content-Length'] = value.strip
        else
          raise("Unknown header #{name} in Debug Server message")
        end
      end
      header
    end

    def receive_data(data)
      # Inspired by https://github.com/PowerShell/PowerShellEditorServices/blob/dba65155c38d3d9eeffae5f0358b5a3ad0215fac/src/PowerShellEditorServices.Protocol/MessageProtocol/MessageReader.cs
      return if data.empty?
      return if @state == :ignore

      # TODO: Thread/Atomic safe? probably not
      @buffer += data.bytes.to_a

      while @buffer.length > 4
        # Check if we have enough data for the headers
        # Need to find the first instance of '\r\n\r\n'
        offset = 0
        while offset < @buffer.length - 4
          break if @buffer[offset] == 13 && @buffer[offset + 1] == 10 && @buffer[offset + 2] == 13 && @buffer[offset + 3] == 10
          offset += 1
        end
        return unless offset < @buffer.length - 4

        # Extract the headers
        raw_header = @buffer.slice(0, offset).pack('C*').force_encoding('ASCII') # Note the headers are always ASCII encoded
        headers = extract_headers(raw_header)
        raise('Missing Content-Length header') if headers['Content-Length'].nil?

        # Now we have the headers and the content length, do we have enough data now
        minimum_buf_length = offset + 3 + headers['Content-Length'] + 1 # Need to add one as we're converting from offset (zero based) to length (1 based) arrays
        return if @buffer.length < minimum_buf_length

        # Extract the message content
        content = @buffer.slice(offset + 3 + 1, headers['Content-Length']).pack('C*').force_encoding('utf-8') # TODO: default is utf-8.  Need to enode based on Content-Type
        # Purge the buffer
        @buffer = @buffer.slice(minimum_buf_length, @buffer.length - minimum_buf_length)
        @buffer = [] if @buffer.nil?

        parse_data(content)
      end
    end

    def send_response(response)
      # Modify the response
      raise('protocol message type was not set to response') unless response['type'] == 'response'
      response['seq'] = @response_sequence
      @response_sequence += 1 # Not thread safe possibly. It's ok on MRI ruby, not jruby

      response_json = encode_json(response)
      PuppetDebugServer.log_message(:debug, "--- OUTBOUND\n#{response_json}\n---")

      size = response_json.bytesize
      send_data "Content-Length: #{size}\r\n\r\n" + response_json
    end

    def send_event(response)
      # Modify the response
      raise('protocol message type was not set to event') unless response['type'] == 'event'
      response['seq'] = @response_sequence
      @response_sequence += 1 # Not thread safe possibly. It's ok on MRI ruby, not jruby

      response_json = encode_json(response)
      PuppetDebugServer.log_message(:debug, "--- OUTBOUND\n#{response_json}\n---")

      size = response_json.bytesize
      send_data "Content-Length: #{size}\r\n\r\n" + response_json
    end

    def parse_data(data)
      PuppetDebugServer.log_message(:debug, "--- INBOUND\n#{data}\n---")

      result = JSON.parse(data)
      received_parsed_object(result)
    end

    # Seperate method so async JSON parsing can be supported.
    def received_parsed_object(obj)
      case obj
      when Hash
        process(obj)

      # Batch: multiple requests/notifications in an array.
      # NOTE: Not implemented as it doesn't make sense using JSON RPC over pure TCP / UnixSocket.
      else
        PuppetDebugServer.log_message(:error, 'Closing connection as request is not a Hash')
        close_connection_after_writing
        @state = :ignore
      end
    end

    def process(obj)
      message = PuppetDebugServer::Protocol::ProtocolMessage.create(obj)
      case message['type']
      when 'request'
        receive_request(PuppetDebugServer::Protocol::Request.create(obj), obj)
      else
        PuppetDebugServer.log_message(:error, "Unknown protocol message type #{message['type']}")
      end
    end

    # This method must be overriden in the user's inherited class.
    def receive_request(request, _request_json)
      PuppetDebugServer.log_message(:debug, "request received:\n#{request.inspect}")
    end

    def encode_json(data)
      JSON.generate(data)
    end

    def reply_error(request, message, body)
      response = PuppetDebugServer::Protocol::Response.new(request)
      response.success = false
      response.message = message unless message.nil?
      response.body = body unless body.nil?
      send_response response
    end

    # This method could be overriden in the user's inherited class.
    def parsing_error(_data, exception)
      PuppetDebugServer.log_message(:error, "parsing error:\n#{exception.message}")
    end

    # This method could be overriden in the user's inherited class.
    def invalid_request(_obj, code, message = nil)
      PuppetDebugServer.log_message(:error, "error #{code}: #{message}")
    end
  end
end
