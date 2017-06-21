module LanguageServer
  # interface Diagnostic {
  #   /**
  #    * The range at which the message applies.
  #    */
  #   range: Range;

  #   /**
  #    * The diagnostic's severity. Can be omitted. If omitted it is up to the
  #    * client to interpret diagnostics as error, warning, info or hint.
  #    */
  #   severity?: number;

  #   /**
  #    * The diagnostic's code. Can be omitted.
  #    */
  #   code?: number | string;

  #   /**
  #    * A human-readable string describing the source of this
  #    * diagnostic, e.g. 'typescript' or 'super lint'.
  #    */
  #   source?: string;

  #   /**
  #    * The diagnostic's message.
  #    */
  #   message: string;
  # }

  module Diagnostic
    def self.create(options)
      result = {}
      raise('source is a required field for Diagnostic') if options['source'].nil?
      raise('message is a required field for Diagnostic') if options['message'].nil?
      raise('fromline is a required field for Diagnostic') if options['fromline'].nil?
      raise('toline is a required field for Diagnostic') if options['toline'].nil?
      raise('fromchar is a required field for Diagnostic') if options['fromchar'].nil?
      raise('toline is a required field for Diagnostic') if options['toline'].nil?

      unless options['severity'].nil?
        raise('Invalid value for severity') unless options['severity'] == DIAGNOSTICSEVERITY_ERROR ||
                                                   options['severity'] == DIAGNOSTICSEVERITY_WARNING ||
                                                   options['severity'] == DIAGNOSTICSEVERITY_INFORMATION ||
                                                   options['severity'] == DIAGNOSTICSEVERITY_HINT
      end

      result['source']   = options['source']
      result['message']  = options['message']
      result['range'] = { 'start' => {
        'line' => options['fromline'],
        'character' => options['fromchar']
      },
                          'end' => {
                            'line'      => options['toline'],
                            'character' => options['tochar']
                          } }
      result['code']     = options['code'] unless options['code'].nil?
      result['severity'] = options['severity'] unless options['severity'].nil?

      result
    end
  end
end
