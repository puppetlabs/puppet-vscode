module LanguageServer
  module PuppetFixDiagnosticErrorsRequest
    # export interface PuppetFixDiagnosticErrorsRequestParams {
    #   documentUri: string;
    #   alwaysReturnContent: boolean;
    # }

    def self.create(options)
      result = {
        'alwaysReturnContent' => false
      }
      raise('documentUri is a required field for PuppetFixDiagnosticErrorsRequest') if options['documentUri'].nil?

      result['documentUri'] = options['documentUri']
      result['alwaysReturnContent'] = options['alwaysReturnContent'] unless options['alwaysReturnContent'].nil?
      result
    end
  end

  module PuppetFixDiagnosticErrorsResponse
    # export interface PuppetFixDiagnosticErrorsResponse {
    #   documentUri: string;
    #   fixesApplied: number;
    #   newContent?: string;
    # }

    def self.create(options)
      result = {}
      raise('documentUri is a required field for PuppetFixDiagnosticErrorsResponse') if options['documentUri'].nil?
      raise('fixesApplied is a required field for PuppetFixDiagnosticErrorsResponse') if options['fixesApplied'].nil?

      result['documentUri']  = options['documentUri']
      result['fixesApplied'] = options['fixesApplied']
      result['newContent']   = options['newContent'] unless options['newContent'].nil?

      result
    end
  end
end
