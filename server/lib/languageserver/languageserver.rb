%w(constants diagnostic completion_list completion_item hover puppet_version).each do |lib|
  begin
    require "languageserver/#{lib}"
  rescue LoadError
    require File.expand_path(File.join(File.dirname(__FILE__), lib))
  end
end
