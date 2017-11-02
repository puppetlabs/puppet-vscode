require 'puppet/face'

Puppet::Face.define(:language_server, '0.1.0') do
  action :start do
    summary "Start a Puppet Language Server"

    description <<-EOT
      Start a puppet language server with configurable settings
    EOT

    # Note these options should mirror those in the langauge server options parser, minus debug, help and version
    option '--port=', '-p=' do
      summary 'TCP Port to listen on.  Default is 8081'
      description 'TCP Port to listen on.  Default is 8081'
    end

    option '--timeout=', '-t=' do
      summary 'Stop the language server if a client does not connect within TIMEOUT seconds.  A value of zero will not timeout.  Default is 10 seconds'
      description 'Stop the language server if a client does not connect within TIMEOUT seconds.  A value of zero will not timeout.  Default is 10 seconds'
    end

    option '--ipaddress=', '-i=' do
      summary 'IP Address to listen on (0.0.0.0 for all interfaces).  Default is 127.0.01'
      description 'IP Address to listen on (0.0.0.0 for all interfaces).  Default is 127.0.01'
    end

    option '--no-stop', '-c' do
      summary 'Do not stop the language server once a client disconnects.  Default is to stop'
      description 'Do not stop the language server once a client disconnects.  Default is to stop'
    end

    option '--no-preload', '-d' do
      summary 'Do not preload Puppet information when the language server starts.  Default is to preload'
      description 'Do not preload Puppet information when the language server starts.  Default is to preload'
    end

    option '--slow-start', '-s' do
      summary 'Delay starting the TCP Server until Puppet initialisation has completed.  Default is to start fast'
      description 'Delay starting the TCP Server until Puppet initialisation has completed.  Default is to start fast'
    end

    when_invoked do |options|
      # Can't use --debug as its reserved by Puppet.  Instead detect if --debug has been passed to Puppet
      # and use that as a trigger
      debug_enabled = Puppet::Util::Log.level == :debug
      lang_server = File.join(File.dirname(__FILE__),'..','..','..','..','files','puppet-languageserver')

      cmd = "ruby \"#{lang_server}\""

      cmd += " --port=#{options[:port]}"       unless options[:port].nil?
      cmd += " --timeout=#{options[:timeout]}" unless options[:timeout].nil?
      cmd += " --ip=#{options[:ip]}"           unless options[:ip].nil?
      cmd += " --no-stop"                      unless options[:no_stop].nil?
      cmd += " --no-preload"                   unless options[:no_preload].nil?
      cmd += " --slow-start"                   unless options[:slow_start].nil?

      cmd += " --debug=STDOUT" if debug_enabled
      Puppet.debug("Starting language server with #{cmd}")

      exec( cmd )
    end
  end

  deactivate_action(:destroy)
  deactivate_action(:search)
end
