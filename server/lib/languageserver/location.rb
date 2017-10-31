module LanguageServer
  #  /**
  #  * The result of a hover request.
  #  */
  # export interface Location {
  #   uri: string;
  #   range: Range;
  # }

  module Location
    def self.create(options)
      result = {}
      raise('uri is a required field for Location') if options['uri'].nil?

      result['uri'] = options['uri']
      result['range'] = {
        'start' => {
          'line' => options['fromline'],
          'character' => options['fromchar']
        },
        'end' => {
          'line'      => options['toline'],
          'character' => options['tochar']
        }
      }

      result
    end
  end
end
