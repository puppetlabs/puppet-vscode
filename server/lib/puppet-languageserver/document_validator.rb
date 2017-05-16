require 'puppet-lint'
module PuppetLanguageServer

  module DocumentValidator
    def self.validate(content, max_problems = 100)
      result = []
      problems = 0

      use_puppet_parser = false
      begin
        linter = PuppetLint::Checks.new
        problems = linter.run(nil, content)
        unless problems.nil?
          problems.each do |problem|
            if problem[:kind] == :error && problem[:check] == :syntax
              # Syntax errors are better handled by the puppet parser, not puppet lint
              use_puppet_parser = true
              next
            end

            severity = case problem[:kind]
              when :error
                LanguageServer::DIAGNOSTICSEVERITY_ERROR
              when :warning
                LanguageServer::DIAGNOSTICSEVERITY_WARNING
              else
                LanguageServer::DIAGNOSTICSEVERITY_HINT
            end

            endpos = problem[:column] - 1
            endpos = problem[:column] - 1 + problem[:token].to_manifest.length unless problem[:token].nil? || problem[:token].value.nil?

          result << LanguageServer::Diagnostic.create({
            'severity' => severity,
            'code' => problem[:check].to_s,
            'fromline' => problem[:line] - 1,   # Line numbers from puppet are base 1
            'toline' => problem[:line] - 1,     # Line numbers from puppet are base 1
            'fromchar' => problem[:column] - 1, # Pos numbers from puppet are base 1
            'tochar' => endpos,
            'source' => 'Puppet',
            'message' => problem[:message],
          })

          end
        end
      rescue => exception
        # If anything catastrophic happens resort to puppet parsing
        use_puppet_parser = true
      end

      # TODO: Should I wrap this thing in a big rescue block?
      if use_puppet_parser
        Puppet[:code] = content
        env = Puppet.lookup(:current_environment)
        loaders = Puppet::Pops::Loaders.new(env)
        Puppet.override( {:loaders => loaders } , _('For puppet parser validate')) do
          begin
            validation_environment = nil ? env.override_with(:manifest => nil) : env
            validation_environment.check_for_reparse
            validation_environment.known_resource_types.clear
          rescue => detail
            unless detail.line.nil? || detail.pos.nil? || detail.basic_message.nil?
              result << LanguageServer::Diagnostic.create({
                'severity' => LanguageServer::DIAGNOSTICSEVERITY_ERROR,
                'fromline' => detail.line - 1,  # Line numbers from puppet are base 1
                'toline' => detail.line - 1,    # Line numbers from puppet are base 1
                'fromchar' => detail.pos - 1,   # Pos numbers from puppet are base 1
                'tochar' => detail.pos + 1 - 1, # Pos numbers from puppet are base 1
                'source' => 'Puppet',
                'message' => detail.basic_message,
              })
            end
          end
        end
      end

      result
    end
  end
end
