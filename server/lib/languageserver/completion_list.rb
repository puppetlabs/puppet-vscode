module LanguageServer
  # /**
  #  * Represents a collection of [completion items](#CompletionItem) to be presented
  #  * in the editor.
  #  */
  # interface CompletionList {
  #   /**
  #    * This list it not complete. Further typing should result in recomputing
  #    * this list.
  #    */
  #   isIncomplete: boolean;
  #   /**
  #    * The completion items.
  #    */
  #   items: CompletionItem[];
  # }

  module CompletionList
    def self.create(options)
      result = {}
      raise('isIncomplete is a required field for CompletionList') if options['isIncomplete'].nil?
      raise('items is a required field for CompletionList') if options['items'].nil?

      result['isIncomplete'] = options['isIncomplete']
      result['items']        = options['items']

      result
    end

    def self.create_nil_response
      {
        'isIncomplete' => false,
        'items'        => []
      }
    end
  end
end
