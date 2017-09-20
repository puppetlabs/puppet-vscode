module LanguageServer
  module PuppetVersion
    # export interface PuppetVersionDetails {
    #   puppetVersion: string;
    #   facterVersion: string;
    #   languageServerVersion: string;
    #   factsLoaded: boolean;
    #   functionsLoaded: boolean;
    #   typesLoaded: boolean;
    # }

    def self.create(options)
      result = {}
      raise('puppetVersion is a required field for PuppetVersion') if options['puppetVersion'].nil?
      raise('facterVersion is a required field for PuppetVersion') if options['facterVersion'].nil?

      result['puppetVersion'] = options['puppetVersion']
      result['facterVersion'] = options['facterVersion']

      result['factsLoaded']     = options['factsLoaded'] unless options['factsLoaded'].nil?
      result['functionsLoaded'] = options['functionsLoaded'] unless options['functionsLoaded'].nil?
      result['typesLoaded']     = options['typesLoaded'] unless options['typesLoaded'].nil?

      result['languageServerVersion'] = PuppetLanguageServer.version

      result
    end
  end
end
