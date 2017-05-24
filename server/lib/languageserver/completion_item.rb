module LanguageServer
  # interface CompletionItem {
  #   /**
  #    * The label of this completion item. By default
  #    * also the text that is inserted when selecting
  #    * this completion.
  #    */
  #   label: string;
  #   /**
  #    * The kind of this completion item. Based of the kind
  #    * an icon is chosen by the editor.
  #    */
  #   kind?: number;
  #   /**
  #    * A human-readable string with additional information
  #    * about this item, like type or symbol information.
  #    */
  #   detail?: string;
  #   /**
  #    * A human-readable string that represents a doc-comment.
  #    */
  #   documentation?: string;
  #   /**
  #    * A string that shoud be used when comparing this item
  #    * with other items. When `falsy` the label is used.
  #    */
  #   sortText?: string;
  #   /**
  #    * A string that should be used when filtering a set of
  #    * completion items. When `falsy` the label is used.
  #    */
  #   filterText?: string;
  #   /**
  #    * A string that should be inserted a document when selecting
  #    * this completion. When `falsy` the label is used.
  #    */
  #   insertText?: string;
  #   /**
  #    * v3.0 with Snippet Support
  #    * Requires client capability
  #    * The format of the insert text. The format applies to both the `insertText` property
  #    * and the `newText` property of a provided `textEdit`.
  #    */
  #   insertTextFormat?: InsertTextFormat;
  #   /**
  #    * An edit which is applied to a document when selecting this completion. When an edit is provided the value of
  #    * `insertText` is ignored.
  #    *
  #    * *Note:* The range of the edit must be a single line range and it must contain the position at which completion
  #    * has been requested.
  #    */
  #   textEdit?: TextEdit;
  #   /**
  #    * An optional array of additional text edits that are applied when
  #    * selecting this completion. Edits must not overlap with the main edit
  #    * nor with themselves.
  #    */
  #   additionalTextEdits?: TextEdit[];
  #   /**
  #    * An optional command that is executed *after* inserting this completion. *Note* that
  #    * additional modifications to the current document should be described with the
  #    * additionalTextEdits-property.
  #    */
  #   command?: Command;
  #   /**
  #    * An data entry field that is preserved on a completion item between
  #    * a completion and a completion resolve request.
  #    */
  #   data?: any
  # }

  module CompletionItem
    def self.create(options)
      result = {}
      raise('label is a required field for CompletionItem') if options['label'].nil?
      raise('kind is a required field for CompletionItem') if options['kind'].nil?
      raise('Invalid value for kind') unless options['kind'] == COMPLETIONITEMKIND_TEXT ||
                                             options['kind'] == COMPLETIONITEMKIND_METHOD ||
                                             options['kind'] == COMPLETIONITEMKIND_FUNCTION ||
                                             options['kind'] == COMPLETIONITEMKIND_CONSTRUCTOR ||
                                             options['kind'] == COMPLETIONITEMKIND_FIELD ||
                                             options['kind'] == COMPLETIONITEMKIND_VARIABLE ||
                                             options['kind'] == COMPLETIONITEMKIND_CLASS ||
                                             options['kind'] == COMPLETIONITEMKIND_INTERFACE ||
                                             options['kind'] == COMPLETIONITEMKIND_MODULE ||
                                             options['kind'] == COMPLETIONITEMKIND_PROPERTY ||
                                             options['kind'] == COMPLETIONITEMKIND_UNIT ||
                                             options['kind'] == COMPLETIONITEMKIND_VALUE ||
                                             options['kind'] == COMPLETIONITEMKIND_ENUM ||
                                             options['kind'] == COMPLETIONITEMKIND_KEYWORD ||
                                             options['kind'] == COMPLETIONITEMKIND_SNIPPET ||
                                             options['kind'] == COMPLETIONITEMKIND_COLOR ||
                                             options['kind'] == COMPLETIONITEMKIND_FILE ||
                                             options['kind'] == COMPLETIONITEMKIND_REFERENCE
      raise('data is a required field for CompletionItem') if options['data'].nil?
      raise('Invalid value for insertTextFormat') unless options['insertTextFormat'].nil? ||
                                                         options['insertTextFormat'] == INSERTTEXTFORMAT_PLAINTEXT ||
                                                         options['insertTextFormat'] == INSERTTEXTFORMAT_SNIPPET

      result['label']               = options['label']
      result['kind']                = options['kind']
      result['data']                = options['data']
      result['detail']              = options['detail'] unless options['detail'].nil?
      result['documentation']       = options['documentation'].strip unless options['documentation'].nil?
      result['sortText']            = options['sortText'] unless options['sortText'].nil?
      result['filterText']          = options['filterText'] unless options['filterText'].nil?
      result['insertText']          = options['insertText'] unless options['insertText'].nil?
      result['insertTextFormat']    = options['insertTextFormat'] unless options['insertTextFormat'].nil?
      result['textEdit']            = options['textEdit'] unless options['textEdit'].nil?
      result['additionalTextEdits'] = options['additionalTextEdits'] unless options['additionalTextEdits'].nil?
      result['command']             = options['command'] unless options['command'].nil?

      result
    end
  end
end
