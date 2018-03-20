module PuppetLanguageServer
  module DocumentStore
    @documents = {}
    @doc_mutex = Mutex.new

    def self.set_document(uri, content, doc_version)
      @doc_mutex.synchronize do
        @documents[uri] = {
          :content => content,
          :version => doc_version
        }
      end
    end

    def self.remove_document(uri)
      @doc_mutex.synchronize { @documents[uri] = nil }
    end

    def self.clear
      @doc_mutex.synchronize { @documents.clear }
    end

    def self.document(uri, doc_version = nil)
      @doc_mutex.synchronize do
        return nil if @documents[uri].nil?
        return nil unless doc_version.nil? || @documents[uri][:version] == doc_version
        @documents[uri][:content].clone
      end
    end

    def self.document_version(uri)
      @doc_mutex.synchronize do
        return nil if @documents[uri].nil?
        @documents[uri][:version]
      end
    end

    def self.document_uris
      @doc_mutex.synchronize { @documents.keys.dup }
    end
  end

  module CrashDump
    def self.default_crash_file
      File.join(Dir.tmpdir, 'puppet_language_server_crash.txt')
    end

    def self.write_crash_file(err, filename = nil, additional = {})
      # Create the crash text

      puppet_version         = Puppet.version rescue 'Unknown' # rubocop:disable Lint/RescueWithoutErrorClass, Style/RescueModifier
      facter_version         = Facter.version rescue 'Unknown' # rubocop:disable Lint/RescueWithoutErrorClass, Style/RescueModifier
      languageserver_version = PuppetLanguageServer.version rescue 'Unknown' # rubocop:disable Lint/RescueWithoutErrorClass, Style/RescueModifier

      # rubocop:disable Layout/IndentHeredoc, Style/FormatStringToken
      crashtext = <<-TEXT
Puppet Language Server Crash File
-=--=--=--=--=--=--=--=--=--=--=-
#{DateTime.now.strftime('%a %b %e %Y %H:%M:%S %Z')}
Puppet Version #{puppet_version}
Facter Version #{facter_version}
Ruby Version #{RUBY_VERSION}-p#{RUBY_PATCHLEVEL}
Language Server Version #{languageserver_version}

Error: #{err}

Backtrace
---------
#{err.backtrace.join("\n")}

TEXT
      # rubocop:enable Layout/IndentHeredoc, Style/FormatStringToken

      # Append the documents in the cache
      PuppetLanguageServer::DocumentStore.document_uris.each do |uri|
        crashtext += "Document - #{uri}\n---\n#{PuppetLanguageServer::DocumentStore.document(uri)}\n\n"
      end
      # Append additional objects from the crash
      additional.each do |k, v|
        crashtext += "#{k}\n---\n#{v}\n\n"
      end

      crash_file = filename.nil? ? default_crash_file : filename
      File.open(crash_file, 'wb') { |file| file.write(crashtext) }
    rescue # rubocop:disable Style/RescueStandardError, Lint/HandleExceptions
      # Swallow all errors.  Errors in the error handler should not
      # terminate the application
    end

    nil
  end

  class MessageRouter < JSONRPCHandler
    def initialize(*options)
      super(*options)

      @workspace = options.first[:workspace] unless options.compact.empty?
    end

    def documents
      PuppetLanguageServer::DocumentStore
    end

    def document_type(uri)
      case uri
      when /\/Puppetfile$/i
        :puppetfile
      when /\.pp$/i
        :manifest
      when /\.epp$/i
        :epp
      else
        :unknown
      end
    end

    def receive_request(request)
      case request.rpc_method
      when 'initialize'
        PuppetLanguageServer.log_message(:debug, 'Received initialize method')
        request.reply_result('capabilities' => PuppetLanguageServer::ServerCapabilites.capabilities)

      when 'shutdown'
        PuppetLanguageServer.log_message(:debug, 'Received shutdown method')
        request.reply_result(nil)

      when 'puppet/getVersion'
        request.reply_result(LanguageServer::PuppetVersion.create('puppetVersion'   => Puppet.version,
                                                                  'facterVersion'   => Facter.version,
                                                                  'factsLoaded'     => PuppetLanguageServer::FacterHelper.facts_loaded?,
                                                                  'functionsLoaded' => PuppetLanguageServer::PuppetHelper.functions_loaded?,
                                                                  'typesLoaded'     => PuppetLanguageServer::PuppetHelper.types_loaded?,
                                                                  'classesLoaded'   => PuppetLanguageServer::PuppetHelper.classes_loaded?))

      when 'puppet/getResource'
        type_name = request.params['typename']
        title = request.params['title']
        if type_name.nil?
          request.reply_result(LanguageServer::PuppetCompilation.create('error' => 'Missing Typename'))
          return
        end
        resources = nil

        if title.nil?
          resources = PuppetLanguageServer::PuppetHelper.resource_face_get_by_typename(type_name)
        else
          resources = PuppetLanguageServer::PuppetHelper.resource_face_get_by_typename_and_title(type_name, title)
          resources = [resources] unless resources.nil?
        end
        if resources.nil? || resources.length.zero?
          request.reply_result(LanguageServer::PuppetCompilation.create('data' => ''))
          return
        end
        # TODO: Should probably move this to a helper?
        content = resources.map(&:to_manifest).join("\n\n") + "\n"
        request.reply_result(LanguageServer::PuppetCompilation.create('data' => content))

      when 'puppet/compileNodeGraph'
        file_uri = request.params['external']
        unless document_type(file_uri) == :manifest
          request.reply_result(LanguageServer::PuppetCompilation.create('error' => 'Files of this type can not be used to create a node graph.'))
          return
        end
        content = documents.document(file_uri)

        dot_content = nil
        error_content = nil
        begin
          # The fontsize is inserted in the puppet code.  Need to remove it so the client can render appropriately.  Need to
          # set it to blank.  The graph label is set to vscode so that we can do text replacement client side to inject the
          # appropriate styling.
          options = {
            'fontsize' => '""',
            'name' => 'vscode'
          }
          node_graph = PuppetLanguageServer::PuppetParserHelper.compile_to_pretty_relationship_graph(content)
          if node_graph.vertices.count.zero?
            error_content = 'There were no resources created in the node graph. Is there an include statement missing?'
          else
            dot_content = node_graph.to_dot(options)
          end
        rescue StandardError => exception
          error_content = "Error while parsing the file. #{exception}"
        end
        request.reply_result(LanguageServer::PuppetCompilation.create('dotContent' => dot_content,
                                                                      'error' => error_content))

      when 'puppet/fixDiagnosticErrors'
        begin
          formatted_request = LanguageServer::PuppetFixDiagnosticErrorsRequest.create(request.params)
          file_uri = formatted_request['documentUri']
          content = documents.document(file_uri)

          case document_type(file_uri)
          when :manifest
            changes, new_content = PuppetLanguageServer::DocumentValidator.fix_validate_errors(content, @workspace)
          else
            raise "Unable to fixDiagnosticErrors on #{file_uri}"
          end

          request.reply_result(LanguageServer::PuppetFixDiagnosticErrorsResponse.create(
                                 'documentUri'  => formatted_request['documentUri'],
                                 'fixesApplied' => changes,
                                 'newContent'   => changes > 0 || formatted_request['alwaysReturnContent'] ? new_content : nil
          ))
        rescue StandardError => exception
          PuppetLanguageServer.log_message(:error, "(puppet/fixDiagnosticErrors) #{exception}")
          unless formatted_request.nil?
            request.reply_result(LanguageServer::PuppetFixDiagnosticErrorsResponse.create(
                                   'documentUri'  => formatted_request['documentUri'],
                                   'fixesApplied' => 0,
                                   'newContent'   => formatted_request['alwaysReturnContent'] ? content : nil # rubocop:disable Metrics/BlockNesting
            ))
          end
        end

      when 'textDocument/completion'
        file_uri = request.params['textDocument']['uri']
        line_num = request.params['position']['line']
        char_num = request.params['position']['character']
        content = documents.document(file_uri)
        begin
          case document_type(file_uri)
          when :manifest
            request.reply_result(PuppetLanguageServer::CompletionProvider.complete(content, line_num, char_num))
          else
            raise "Unable to provide completion on #{file_uri}"
          end
        rescue StandardError => exception
          PuppetLanguageServer.log_message(:error, "(textDocument/completion) #{exception}")
          request.reply_result(LanguageServer::CompletionList.create_nil_response)
        end

      when 'completionItem/resolve'
        begin
          request.reply_result(PuppetLanguageServer::CompletionProvider.resolve(request.params.clone))
        rescue StandardError => exception
          PuppetLanguageServer.log_message(:error, "(completionItem/resolve) #{exception}")
          # Spit back the same params if an error happens
          request.reply_result(request.params)
        end

      when 'textDocument/hover'
        file_uri = request.params['textDocument']['uri']
        line_num = request.params['position']['line']
        char_num = request.params['position']['character']
        content = documents.document(file_uri)
        begin
          case document_type(file_uri)
          when :manifest
            request.reply_result(PuppetLanguageServer::HoverProvider.resolve(content, line_num, char_num))
          else
            raise "Unable to provide hover on #{file_uri}"
          end
        rescue StandardError => exception
          PuppetLanguageServer.log_message(:error, "(textDocument/hover) #{exception}")
          request.reply_result(LanguageServer::Hover.create_nil_response)
        end

      when 'textDocument/definition'
        file_uri = request.params['textDocument']['uri']
        line_num = request.params['position']['line']
        char_num = request.params['position']['character']
        content = documents.document(file_uri)
        begin
          case document_type(file_uri)
          when :manifest
            request.reply_result(PuppetLanguageServer::DefinitionProvider.find_definition(content, line_num, char_num))
          else
            raise "Unable to provide definition on #{file_uri}"
          end
        rescue StandardError => exception
          PuppetLanguageServer.log_message(:error, "(textDocument/definition) #{exception}")
          request.reply_result(nil)
        end

      else
        PuppetLanguageServer.log_message(:error, "Unknown RPC method #{request.rpc_method}")
      end
    rescue StandardError => err
      PuppetLanguageServer::CrashDump.write_crash_file(err, nil, 'request' => request.rpc_method, 'params' => request.params)
      raise
    end

    def receive_notification(method, params)
      case method
      when 'initialized'
        PuppetLanguageServer.log_message(:info, 'Client has received initialization')

      when 'exit'
        PuppetLanguageServer.log_message(:info, 'Received exit notification.  Closing connection to client...')
        close_connection

      when 'textDocument/didOpen'
        PuppetLanguageServer.log_message(:info, 'Received textDocument/didOpen notification.')
        file_uri = params['textDocument']['uri']
        content = params['textDocument']['text']
        doc_version = params['textDocument']['version']
        documents.set_document(file_uri, content, doc_version)
        PuppetLanguageServer::ValidationQueue.enqueue(file_uri, doc_version, @workspace, self)

      when 'textDocument/didClose'
        PuppetLanguageServer.log_message(:info, 'Received textDocument/didClose notification.')
        file_uri = params['textDocument']['uri']
        documents.remove_document(file_uri)

      when 'textDocument/didChange'
        PuppetLanguageServer.log_message(:info, 'Received textDocument/didChange notification.')
        file_uri = params['textDocument']['uri']
        content = params['contentChanges'][0]['text'] # TODO: Bad hardcoding zero
        doc_version = params['textDocument']['version']
        documents.set_document(file_uri, content, doc_version)
        PuppetLanguageServer::ValidationQueue.enqueue(file_uri, doc_version, @workspace, self)

      when 'textDocument/didSave'
        PuppetLanguageServer.log_message(:info, 'Received textDocument/didSave notification.')

      else
        PuppetLanguageServer.log_message(:error, "Unknown RPC notification #{method}")
      end
    rescue StandardError => err
      PuppetLanguageServer::CrashDump.write_crash_file(err, nil, 'notification' => method, 'params' => params)
      raise
    end
  end
end
