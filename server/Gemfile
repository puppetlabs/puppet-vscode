source ENV['GEM_SOURCE'] || "https://rubygems.org"

# -=-=-=-=-=- WARNING -=-=-=-=-=-
# There should be NO runtime gem dependencies here.  In production this code will be running using the Ruby
# runtime provided by Puppet.  That means no native extensions and NO BUNDLER.  All runtime dependences should
# be re-vendored and then the load path modified appropriately.
#
# This gemfile only exists to help when developing the language server and running tests
# -=-=-=-=-=- WARNING -=-=-=-=-=-

group :development do
  gem "puppet",                     :require => false
  gem "win32-dir", "<= 0.4.9",      :require => false
  gem "win32-eventlog", "<= 0.6.5", :require => false
  gem "win32-process", "<= 0.7.5",  :require => false
  gem "win32-security", "<= 0.2.5", :require => false
  gem "win32-service", "<= 0.8.8",  :require => false

  unless ENV['NATIVE_EVENTMACHINE'].nil?
    gem "eventmachine",               :require => false
  end
end

# Evaluate Gemfile.local if it exists
if File.exists? "#{__FILE__}.local"
  eval(File.read("#{__FILE__}.local"), binding)
end

# Evaluate ~/.gemfile if it exists
if File.exists?(File.join(Dir.home, '.gemfile'))
  eval(File.read(File.join(Dir.home, '.gemfile')), binding)
end
