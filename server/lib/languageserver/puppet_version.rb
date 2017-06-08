module LanguageServer
  module PuppetVersion
    # export interface PuppetVersionDetails {
    #     puppetVersion:         string;
    #     facterVersion:         string;
    #     languageServerVersion: string;
    # }

    def self.create(options)
      result = {}
      raise('puppetVersion is a required field for PuppetVersion') if options['puppetVersion'].nil?
      raise('facterVersion is a required field for PuppetVersion') if options['facterVersion'].nil?

      result['puppetVersion'] = options['puppetVersion']
      result['facterVersion'] = options['facterVersion']
      result['languageServerVersion'] = PuppetLanguageServer.version

      result
    end
  end
end
