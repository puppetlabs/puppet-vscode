module PuppetLanguageServer
  module ServerCapabilites
    def self.capabilities
      # https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#initialize-request

      {
        'textDocumentSync'   => LanguageServer::TEXTDOCUMENTSYNCKIND_FULL,
        'hoverProvider'      => true,
        'completionProvider' => {
          'resolveProvider'   => true,
          'triggerCharacters' => ['>', '$', '[', '=']
        },
        'definitionProvider' => true
      }
    end
  end
end
