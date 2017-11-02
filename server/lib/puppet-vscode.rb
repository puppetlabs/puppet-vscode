%w[logging version simple_tcp_server].each do |lib|
  begin
    require "puppet-vscode/#{lib}"
  rescue LoadError
    require File.expand_path(File.join(File.dirname(__FILE__), 'puppet-vscode', 'lib', lib))
  end
end
