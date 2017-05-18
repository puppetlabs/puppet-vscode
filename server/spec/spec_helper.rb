# Emulate the setup from the root 'puppet-languageserver' file

# Add the language server into the load path
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__),'..','lib'))
# Add the vendored gems into the load path
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__),'..','vendor','puppet-lint','lib'))

require 'puppet-languageserver'
