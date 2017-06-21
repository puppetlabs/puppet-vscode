module LanguageServer
  #  /**
  #  * The result of a hover request.
  #  */
  # interface Hover {
  #   /**
  #    * The hover's content
  #    */
  #   contents: MarkedString | MarkedString[];

  #   /**
  #    * An optional range is a range inside a text document
  #    * that is used to visualize a hover, e.g. by changing the background color.
  #    */
  #   range?: Range;
  # }

  module Hover
    def self.create(options)
      result = {}
      raise('contents is a required field for Hover') if options['contents'].nil?

      result['contents'] = options['contents']
      result['range'] = options['range'] unless options['range'].nil?

      result
    end

    def self.create_nil_response
      result = {}
      result['contents'] = nil

      result
    end
  end
end
