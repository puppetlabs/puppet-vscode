# The end-to-end testing file starts a debug server as part of the testing.  This class is used
# to send and receive messages to the server.
#
# By setting the `SPEC_DEBUG` environment variable, it will display debug information to the console
# while the tests are being run.  This can be useful when figuring out why tests have failed

class DebugClient
  attr_reader :received_messages

  def initialize(host, port)
    @socket = TCPSocket.open(host, port)
    @buffer = []
    @received_messages = []
    @new_messages = false
    @tx_seq_id = 0
  end

  # Have any new messages been received since data has been sent to the server
  def new_messages?
    @new_messages
  end

  # Send data to the server
  def send_data(json_string)
    size = json_string.bytesize
    @new_messages = false
    puts "... Sent: #{json_string}" if ENV['SPEC_DEBUG']
    @socket.write("Content-Length: #{size}\r\n\r\n" + json_string)
  end

  # The current sequence ID.  Used when sending messages
  def current_seq_id
    @tx_seq_id
  end

  # Return the next sequence ID
  def next_seq_id
    @tx_seq_id += 1
  end

  # Find the first message received that has the specfied request_sequence ID
  # Used when trying to find responses to requests
  def data_from_request_seq_id(request_seq_id)
    received_messages.find { |item| item['request_seq'] == request_seq_id}
  end

  # Find the first message received that has the specfied event name
  def data_from_event_name(event_name)
    received_messages.find { |item| item['type'] == 'event' && item['event'] == event_name}
  end

  # Drains and processes any data send from the server to the client
  def read_data
    output = []
    # Adapted from the PowerShell manager.  Need to change it
    read_from_stream(@socket, 0.5) { |s| output << s }

    # there's ultimately a bit of a race here
    # read one more time after signal is received
    read_from_stream(@socket, 0) { |s| output << s }

    # string has been binary up to this point, so force UTF-8 now
    receive_data(output.join('').force_encoding(Encoding::UTF_8)) unless output.empty?
  end

  # Closes the TCP connection
  def close
    @socket.close
  end

  # Is the conection closed?
  def closed?
    @socket.closed?
  end

  # Clear the received messages list
  def clear_messages!
    @received_messages = []
  end

  private

  def parse_data(data)
    puts "... Received: #{data}" if ENV['SPEC_DEBUG']
    @received_messages << JSON.parse(data)
    @new_messages = true
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
    return if data.empty?
    return if @state == :ignore

    @buffer += data.bytes

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

  def is_stream_valid?(stream)
    !stream.closed? && !stream.stat.nil?
  rescue # Ignore an errors
    false
  end

  def is_readable?(stream, timeout = 0.5)
    raise Errno::EPIPE if !is_stream_valid?(stream)
    read_ready = IO.select([stream], [], [], timeout)
    read_ready && stream == read_ready[0][0]
  end

  def read_from_stream(stream, timeout = 0.1, &block)
    if is_readable?(stream, timeout)
      data = stream.readpartial(4096)
      yield data unless data.nil?
    end

    nil
  end
end
