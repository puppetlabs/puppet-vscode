module LanguageServer
  module PuppetCompilation
    # export interface GetPuppetResourceResponse {
    #   data: string;
    #   error: string;
    # }

    def self.create(options)
      result = {}

      result['data']       = options['data'] unless options['data'].nil?
      result['error']      = options['error'] unless options['error'].nil?

      result
    end
  end
end
