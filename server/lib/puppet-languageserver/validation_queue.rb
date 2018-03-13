module PuppetLanguageServer
  # Module for enqueing and running document level validation asynchronously
  # When adding a document to be validation, it will remove any validation requests for the same
  # document in the queue so that only the latest document needs to be processed.
  #
  # It will also ignore sending back validation results to the client if the document is
  # updated during the validation process
  module ValidationQueue
    @queue = []
    @queue_mutex = Mutex.new
    @queue_thread = nil

    # Enqueue a file to be validated
    def self.enqueue(file_uri, doc_version, workspace, connection_object)
      document_type = connection_object.document_type(file_uri)

      unless %i[manifest epp].include?(document_type)
        # Can't validate these types so just emit an empty validation result
        connection_object.reply_diagnostics(file_uri, [])
        return
      end

      @queue_mutex.synchronize do
        @queue.reject! { |item| item['file_uri'] == file_uri }

        @queue << {
          'file_uri'          => file_uri,
          'doc_version'       => doc_version,
          'document_type'     => document_type,
          'workspace'         => workspace,
          'connection_object' => connection_object
        }
      end

      if @queue_thread.nil? || !@queue_thread.alive?
        @queue_thread = Thread.new do
          begin
            worker
          rescue => err # rubocop:disable Style/RescueStandardError
            PuppetLanguageServer.log_message(:error, "Error in ValidationQueue Thread: #{err}")
            raise
          end
        end
      end

      nil
    end

    # Synchronously validate a file
    def self.validate_sync(file_uri, doc_version, workspace, connection_object)
      document_type = connection_object.document_type(file_uri)
      content = documents.document(file_uri, doc_version)
      return nil if content.nil?
      result = validate(document_type, content, workspace)

      # Send the response
      connection_object.reply_diagnostics(file_uri, result)
    end

    # Helper method to the Document Store
    def self.documents
      PuppetLanguageServer::DocumentStore
    end

    # Wait for the queue to become empty
    def self.drain_queue
      return if @queue_thread.nil? || !@queue_thread.alive?
      @queue_thread.join
      nil
    end

    # Testing helper resets the queue and prepopulates it with
    # a known arbitrary configuration.
    # ONLY USE THIS FOR TESTING!
    def self.reset_queue(initial_state = [])
      @queue_mutex.synchronize do
        @queue = initial_state
      end
    end

    # Validate a document
    def self.validate(document_type, content, workspace)
      # Perform validation
      case document_type
      when :manifest
        PuppetLanguageServer::DocumentValidator.validate(content, workspace)
      when :epp
        PuppetLanguageServer::DocumentValidator.validate_epp(content, workspace)
      else
        []
      end
    end
    private_class_method :validate

    # Thread worker which processes all jobs in the queue and validates each document
    # serially
    def self.worker
      work_item = nil
      loop do
        @queue_mutex.synchronize do
          return if @queue.empty?
          work_item = @queue.shift
        end
        return if work_item.nil?

        file_uri          = work_item['file_uri']
        doc_version       = work_item['doc_version']
        connection_object = work_item['connection_object']
        document_type     = work_item['document_type']
        workspace         = work_item['workspace']

        # Check if the document is the latest version
        content = documents.document(file_uri, doc_version)
        if content.nil?
          PuppetLanguageServer.log_message(:debug, "ValidationQueue Thread: Ignoring #{work_item['file_uri']} as it is not the latest version or has been removed")
          return
        end

        # Perform validation
        result = validate(document_type, content, workspace)

        # Check if the document is still latest version
        current_version = documents.document_version(file_uri)
        if current_version != doc_version
          PuppetLanguageServer.log_message(:debug, "ValidationQueue Thread: Ignoring #{work_item['file_uri']} as has changed version from #{doc_version} to #{current_version}")
          return
        end

        # Send the response
        connection_object.reply_diagnostics(file_uri, result)
      end
    end
    private_class_method :worker
  end
end
