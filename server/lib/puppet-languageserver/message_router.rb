module PuppetLanguageServer

  # TODO: Thread/Atomic safe? probably not
  class DocumentStore
    def set_document(uri,content)
      @documents[uri] = content
    end

    def remove_document(uri)
      @documents[uri] = nil
    end

    def document(uri)
      @documents[uri].clone
    end

    def initialize()
      @documents = {}
    end
  end

  class MessageRouter < JSONRPCHandler
    def initialize(*options)
      super(*options)
      @@documents = PuppetLanguageServer::DocumentStore.new()
    end

    def receive_request(request)
      case request.rpc_method
        when 'initialize'
          PuppetLanguageServer::LogMessage('debug','Received initialize method')
          request.reply_result( { 'capabilities' => PuppetLanguageServer::ServerCapabilites.capabilities} )

        when 'shutdown'
          PuppetLanguageServer::LogMessage('debug','Received shutdown method')
          request.reply_result(nil)

        when 'puppet/getVersion'
          request.reply_result(LanguageServer::PuppetVersion.create({
            'puppetVersion' => Puppet::version,
            'facterVersion' => Facter.version,
          }))

        when 'puppet/getResource'
          type_name = request.params['typename']
          title = request.params['title']
          request.reply_result(LanguageServer::PuppetCompilation.create({ 'error' => 'Missing Typename'})) if type_name.nil?
          resources = nil

          if title.nil?
            resources = PuppetLanguageServer::PuppetHelper.resource_face_get_by_typename(type_name)
          else
            resources = PuppetLanguageServer::PuppetHelper.resource_face_get_by_typename_and_title(type_name, title)
            resources = [resources] unless resources.nil?
          end
          request.reply_result(LanguageServer::PuppetCompilation.create({ 'data' => ''})) if resources.nil? || resources.length.zero?

          # TODO Should probably move this to a helper?
          content = ''
          resources.each { |res| content += res.to_manifest + "\n"}
          request.reply_result(LanguageServer::PuppetCompilation.create({ 'data' => content}))

        when 'puppet/compileNodeGraph'
          file_uri = request.params['external']
          content = @@documents.document(file_uri)

          dotContent = nil
          errorContent = nil
          begin
            # The fontsize is inserted in the puppet code.  Need to remove it so the client can render appropriately.  Need to
            # set it to blank.  The graph label is set to vscode so that we can do text replacement client side to inject the
            # appropriate styling.
            options = {
              'fontsize' => '""',
              'name' => 'vscode',
            }
            dotContent = PuppetLanguageServer::PuppetParserHelper.compile_to_pretty_relationship_graph(content).to_dot(options)
          rescue => exception
            errorContent = "Error while parsing the file. #{exception}"
          end
          request.reply_result(LanguageServer::PuppetCompilation.create({
            'dotContent' => dotContent,
            'error' => errorContent,
          }))

        when 'textDocument/completion'
          file_uri = request.params['textDocument']['uri']
          line_num = request.params['position']['line']
          char_num = request.params['position']['character']
          content = @@documents.document(file_uri)
          begin
            request.reply_result(PuppetLanguageServer::CompletionProvider.complete(content, line_num, char_num))
          rescue => exception
            PuppetLanguageServer::LogMessage('error',"(textDocument/completion) #{exception}")
            request.reply_result(LanguageServer::CompletionList.create_nil_response())
          end

        when 'completionItem/resolve'
          begin
            request.reply_result(PuppetLanguageServer::CompletionProvider.resolve(request.params.clone))
          rescue => exception
            PuppetLanguageServer::LogMessage('error',"(completionItem/resolve) #{exception}")
            # Spit back the same params if an error happens
            request.reply_result(request.params)
          end

        when 'textDocument/hover'
          file_uri = request.params['textDocument']['uri']
          line_num = request.params['position']['line']
          char_num = request.params['position']['character']
          content = @@documents.document(file_uri)
          begin
            request.reply_result(PuppetLanguageServer::HoverProvider.resolve(content, line_num, char_num))
          rescue => exception
            PuppetLanguageServer::LogMessage('error',"(textDocument/hover) #{exception}")
            request.reply_result(LanguageServer::Hover.create_nil_response())
          end
        else
          PuppetLanguageServer::LogMessage('error',"Unknown RPC method #{request.rpc_method}")
      end
    end

    def receive_notification(method, params)
      case method
        when 'initialized'
          PuppetLanguageServer::LogMessage('information','Client has received initialization')

        when 'exit'
          PuppetLanguageServer::LogMessage('information','Received exit notification.  Closing connection to client...')
          close_connection

        when 'textDocument/didOpen'
          PuppetLanguageServer::LogMessage('information','Received textDocument/didOpen notification.')
          file_uri = params['textDocument']['uri']
          content = params['textDocument']['text']
          @@documents.set_document(file_uri, content)
          reply_diagnostics(file_uri, PuppetLanguageServer::DocumentValidator.validate(content))

        when 'textDocument/didChange'
          PuppetLanguageServer::LogMessage('information','Received textDocument/didChange notification.')
          file_uri = params['textDocument']['uri']
          content = params['contentChanges'][0]['text'] # TODO: Bad hardcoding zero
          @@documents.set_document(file_uri, content)
          reply_diagnostics(file_uri, PuppetLanguageServer::DocumentValidator.validate(content))

        when 'textDocument/didSave'
          PuppetLanguageServer::LogMessage('information','Received textDocument/didSave notification.')

        else
          PuppetLanguageServer::LogMessage('error',"Unknown RPC notification #{method}")
      end
    end
  end
end
