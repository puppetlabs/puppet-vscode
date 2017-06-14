require 'puppet/face'

Puppet::Face.define(:language_server, '0.1.0') do
  action :quickstart do
    summary "Start a Puppet Language Server with quick defaults"
    description <<-EOT
      Starts a puppet language server with quick default settings:
        - Port 8080
        - No connection timeout
        - Listen on all interfaces
        - Stop the server once a client disconnects
    EOT

    when_invoked do |options|
      # Can't use --debug as its reserved by Puppet.  Instead detect if --debug has been passed to Puppet
      # and use that as a trigger
      debug_enabled = Puppet::Util::Log.level == :debug
      lang_server = File.join(File.dirname(__FILE__),'..','..','..','..','files','puppet-languageserver')

      cmd = "ruby \"#{lang_server}\""

      cmd += " --port=8080"
      cmd += " --timeout=0"
      cmd += " --ip=0.0.0.0"

      cmd += " --debug=STDOUT" if debug_enabled
      Puppet.debug("Starting language server with #{cmd}")

      exec( cmd )
    end
  end
end
