module LanguageServer
  module PuppetCompilation
    # export interface CompileNodeGraphResponse {
    #   dotContent: string;
    #   data: string;
    # }

    def self.create(options)
      result = {}

      result['dotContent'] = options['dotContent'] unless options['dotContent'].nil?
      result['error']      = options['error'] unless options['error'].nil?
      result['data']       = options['data'] unless options['data'].nil?

      result
    end
  end
end
