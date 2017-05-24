require 'puppet-lint'
module PuppetLanguageServer
  module DocumentValidator
    def self.validate(content, _max_problems = 100)
      result = []
      # TODO: Need to implement max_problems
      problems = 0

      begin
        linter = PuppetLint::Checks.new
        problems = linter.run(nil, content)
        unless problems.nil?
          problems.each do |problem|
            # Syntax errors are better handled by the puppet parser, not puppet lint
            next if problem[:kind] == :error && problem[:check] == :syntax

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

            result << LanguageServer::Diagnostic.create('severity' => severity,
                                                        'code' => problem[:check].to_s,
                                                        'fromline' => problem[:line] - 1,   # Line numbers from puppet are base 1
                                                        'toline' => problem[:line] - 1,     # Line numbers from puppet are base 1
                                                        'fromchar' => problem[:column] - 1, # Pos numbers from puppet are base 1
                                                        'tochar' => endpos,
                                                        'source' => 'Puppet',
                                                        'message' => problem[:message])
          end
        end
      # rubocop:disable Lint/HandleExceptions
      rescue => _exception
        # If anything catastrophic happens we resort to puppet parsing anyway
      end

      # TODO: Should I wrap this thing in a big rescue block?
      Puppet[:code] = content
      env = Puppet.lookup(:current_environment)
      loaders = Puppet::Pops::Loaders.new(env)
      Puppet.override({ :loaders => loaders }, _('For puppet parser validate')) do
        begin
          validation_environment = env
          validation_environment.check_for_reparse
          validation_environment.known_resource_types.clear
        rescue => detail
          # Somtimes the error is in the cause not the root object itself
          detail = detail.cause if !detail.respond_to?(:line) && detail.respond_to?(:cause) && detail.cause.respond_to?(:line)

          message = detail.respond_to?(:message) ? detail.message : nil
          message = detail.basic_message if message.nil? && detail.respond_to?(:basic_message)

          unless detail.line.nil? || detail.pos.nil? || message.nil?
            result << LanguageServer::Diagnostic.create('severity' => LanguageServer::DIAGNOSTICSEVERITY_ERROR,
                                                        'fromline' => detail.line - 1,  # Line numbers from puppet are base 1
                                                        'toline' => detail.line - 1,    # Line numbers from puppet are base 1
                                                        'fromchar' => detail.pos - 1,   # Pos numbers from puppet are base 1
                                                        'tochar' => detail.pos + 1 - 1, # Pos numbers from puppet are base 1
                                                        'source' => 'Puppet',
                                                        'message' => message)
          end
        end
      end

      result
    end
  end
end
