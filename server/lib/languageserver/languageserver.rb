%w[constants diagnostic completion_list completion_item hover location puppet_version puppet_compilation puppet_fix_diagnostic_errors].each do |lib|
  begin
    require "languageserver/#{lib}"
  rescue LoadError
    require File.expand_path(File.join(File.dirname(__FILE__), lib))
  end
end
