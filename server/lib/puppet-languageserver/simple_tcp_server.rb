require 'socket'

# Based on code from
# http://stackoverflow.com/questions/29858113/unable-to-make-socket-accept-non-blocking-ruby-2-2

module PuppetLanguageServer
  class SimpleTCPServerConnection
    attr_accessor :socket
    attr_accessor :simple_tcp_server

    # Methods to override
    def post_init
      # Override this to recieve events after a client is connected
      PuppetLanguageServer.log_message(:debug, 'TCPSRV: Client has connected')
    end

    def unbind
      # Override this to recieve events after a client is disconnected
      PuppetLanguageServer.log_message(:debug, 'TCPSRV: Client has disconnected')
    end

    def receive_data(data)
      # Override this to recieve data
      PuppetLanguageServer.log_message(:debug, "TCPSRV: Received #{data.length} characters")
    end

    # @api public
    def error?
      false
    end

    # @api public
    def send_data(data)
      socket.write(data)
      true
    end

    # @api public
    def close_connection_after_writing
      socket.flush
      simple_tcp_server.remove_connection_async(socket)
    end

    # @api public
    def close_connection
      simple_tcp_server.remove_connection_async(socket)
    end
  end

  class SimpleTCPServer
    IO_LOCKER = Mutex.new
    EVENTS = []
    E_LOCKER = Mutex.new
    SERVICES = {}
    S_LOCKER = Mutex.new
    IO_CONNECTION_DIC = {}
    C_LOCKER = Mutex.new

    def log(message)
      # Override this to recieve log messages
      PuppetLanguageServer.log_message(:debug, "TCPSRV: #{message}")
    end

    ####
    # this code will be called when a socket recieves data.
    # @api private
    def get_data(io, connection_data)
      data = io.recv_nonblock(1048576) # with maximum number of bytes to read at a time...
      raise "Received a 0byte payload" if data.length.zero?

      # We're already in a callback so no need to invoke as a callback
      connection_data[:handler].receive_data(data)
    rescue => e
      # should also log error
      remove_connection(io)
      log("Closed socket due to error - #{e}\n#{e.backtrace}")
    end

    #########
    # main loop and activation code
    #
    # This will create a thread pool and set them running.
    # @api public
    @handler_klass = nil
    @handler_start_options = nil
    @server_options = nil

    def start(handler = PuppetLanguageServer::SimpleTCPServerConnection, connection_options = {}, max_threads = 2)
      # prepare threads
      exit_flag = false
      threads = []
      thread_cycle = proc do
        io_review rescue false
        true while fire_event
      end
      max_threads.times { Thread.new { thread_cycle.call until exit_flag } }

      @handler_klass = handler
      @handler_start_options = connection_options
      @server_options = connection_options # Currently the same as handler options.  Could be different later.
      log("Services running. Press ^C to stop")

      # sleep until trap raises exception (cycling might cause the main thread to loose signals that might be caught inside rescue clauses)
      kill_timer = connection_options[:connection_timeout]
      kill_timer = -1 if kill_timer.nil? || kill_timer < 1
      log("Will stop the server in #{connection_options[:connection_timeout]} seconds if no connection is made.") if kill_timer > 0
      log('Will stop the server when client disconnects') if !@server_options[:stop_on_client_exit].nil? && @server_options[:stop_on_client_exit]

      # Output to STDOUT.  This is required by Langugage Client so it knows the server is now running
      S_LOCKER.synchronize do
        SERVICES.each do |_service, options|
          $stdout.write("LANGUAGE SERVER RUNNING #{options[:hostname]}:#{options[:port]}\n")
        end
      end
      $stdout.flush

      loop do
        begin
          sleep(1)
          # The kill_timer is used to stop the server if no clients have connected in X seconds
          # a value of 0 or less will not timeout.
          if kill_timer > 0
            kill_timer -= 1
            if kill_timer.zero?
              connection_count = 0
              C_LOCKER.synchronize { connection_count = IO_CONNECTION_DIC.count }
              if connection_count.zero?
                log("No connection has been received in #{connection_options[:connection_timeout]} seconds.  Shutting down server.")
                stop_services
              end
            end
          end
        end
        break if SERVICES.empty?
      end rescue true

      # start shutdown.
      exit_flag = true
      log('Started shutdown process. Press ^C to force quit.')
      # shut down listening sockets
      stop_services
      # disconnect active connections
      stop_connections
      # cycle down threads
      log("Waiting for workers to cycle down")
      threads.each { |t| t.join if t.alive? }

      # rundown any active events
      thread_cycle.call
    end

    #######################
    ## Events (Callbacks) / Multi-tasking Platform
    # returns true if there are any unhandled events
    # @api private
    def events?
      E_LOCKER.synchronize { !EVENTS.empty? }
    end

    # pushes an event to the event's stack
    # if a block is passed along, it will be used as a callback: the block will be called with the values returned by the handler's `call` method.
    # @api private
    def push_event(handler, *args, &block)
      if block
        E_LOCKER.synchronize { EVENTS << [(proc { |a| push_event block, handler.call(*a) }), args] }
      else
        E_LOCKER.synchronize { EVENTS << [handler, args] }
      end
    end

    # Runs the block asynchronously by pushing it as an event to the event's stack
    #
    # @api private
    def run_async(*args, &block)
      E_LOCKER.synchronize { EVENTS << [block, args] } if block
      !block.nil?
    end

    # creates an asynchronous call to a method, with an optional callback (shortcut)
    # @api private
    def callback(object, method, *args, &block)
      push_event object.method(method), *args, &block
    end

    # event handling FIFO
    # @api private
    def fire_event
      event = E_LOCKER.synchronize { EVENTS.shift }
      return false unless event
      begin
        event[0].call(*event[1])
      rescue OpenSSL::SSL::SSLError => _
        log("SSL Bump - SSL Certificate refused?")
      # rubocop:disable RescueException
      rescue Exception => e
        raise if e.is_a?(SignalException) || e.is_a?(SystemExit)
        error e
      end
      # rubocop:enable RescueException

      true
    end

    #####
    # Reactor
    #
    # IO review code will review the connections and sockets
    # it will accept new connections and react to socket input
    # @api private
    def io_review
      IO_LOCKER.synchronize do
        return false unless EVENTS.empty?
        united = SERVICES.keys + IO_CONNECTION_DIC.keys
        return false if united.empty?
        io_r = IO.select(united, nil, united, 0.1)
        if io_r
          io_r[0].each do |io|
            if SERVICES[io]
              begin
                callback(self, :add_connection, io.accept_nonblock, SERVICES[io])
              # rubocop:disable HandleExceptions
              rescue Errno::EWOULDBLOCK => _
              # rubocop:enable HandleExceptions
              rescue => e
                log(e.message)
              end
            elsif IO_CONNECTION_DIC[io]
              callback(self, :get_data, io, IO_CONNECTION_DIC[io])
            else
              log("what?!")
              remove_connection(io)
              SERVICES.delete(io)
            end
          end
          io_r[2].each { |io| (remove_connection(io) || SERVICES.delete(io)).close rescue true }
        end
      end
      callback self, :clear_connections
      true
    end

    #######################
    # IO - listening sockets (services)

    # @api public
    def add_service(hostname = '127.0.0.1', port = 8081, parameters = {})
      parameters[:port] = port
      parameters[:hostname] = hostname
      parameters.update port if port.is_a?(Hash)
      service = TCPServer.new(parameters[:hostname], parameters[:port])
      S_LOCKER.synchronize { SERVICES[service] = parameters }
      callback(self, :log, "Started listening on #{hostname}:#{port}.")
      true
    end

    # @api public
    def stop_services
      log('Stopping services')
      S_LOCKER.synchronize do
        SERVICES.each do |s, p|
          s.close rescue true
          log("Stopped listening on #{p[:hostname]}:#{p[:port]}")
        end
        SERVICES.clear
      end
    end

    # @api public
    def remove_connection_async(io)
      callback(self, :remove_connection, io)
    end

    #####################
    # IO - Active connections handling

    # @api private
    def stop_connections
      C_LOCKER.synchronize do
        IO_CONNECTION_DIC.each do |io, _params|
          io.close rescue true
        end
        IO_CONNECTION_DIC.clear
      end
    end

    # @api private
    def add_connection(io, service_object)
      handler = @handler_klass.new(@handler_start_options)
      handler.socket = io
      handler.simple_tcp_server = self
      if io
        C_LOCKER.synchronize do
          IO_CONNECTION_DIC[io] = { handler: handler, service: service_object }
        end
      end
      callback(handler, :post_init)
    end

    # @api private
    def remove_connection(io)
      # This needs to be synchronous
      IO_CONNECTION_DIC[io][:handler].unbind
      connection_count = 0
      C_LOCKER.synchronize do
        IO_CONNECTION_DIC.delete io
        connection_count = IO_CONNECTION_DIC.count
        io.close rescue true
      end

      return unless connection_count.zero? && !@server_options[:stop_on_client_exit].nil? && @server_options[:stop_on_client_exit]
      callback(self, :log, 'Client has disconnected.  Shutting down server.')
      callback(self, :stop_services)
    end

    # clears closed connections from the stack
    # @api private
    def clear_connections
      C_LOCKER.synchronize { IO_CONNECTION_DIC.delete_if(&:closed?) }
    end
  end
end
