require 'rspec/core/rake_task'

rubocop_available = Gem::Specification::find_all_by_name('rubocop').any?
require 'rubocop/rake_task' if rubocop_available

desc 'Run rspec tests with coloring.'
RSpec::Core::RakeTask.new(:test) do |t|
  t.rspec_opts = %w[--color --format documentation]
  t.pattern    = 'spec/'
end

desc 'Run rspec tests and save JUnit output to results.xml.'
RSpec::Core::RakeTask.new(:junit) do |t|
  t.rspec_opts = %w[-r yarjuf -f JUnit -o results.xml]
  t.pattern    = 'spec/'
end

if rubocop_available
  desc 'Run RuboCop'
  RuboCop::RakeTask.new(:rubocop) do |task|
    task.options << '--display-cop-names'
  end
end

namespace :rubocop do
  desc "Generate the Rubocop Todo file"
  task :generate do
    begin
      sh "rubocop --auto-gen-config"
    rescue => exception
      # Ignore any errors
    end
  end
end

desc "Download and vendor required gems"
task :gem_revendor do
  require 'fileutils'

  gem_list = [
    {
      :directory => 'puppet-lint',
      :github_repo => 'https://github.com/rodjek/puppet-lint.git',
      :github_ref => '2.3.3',
    }
  ]

  # Clean out the vendor directory first
  puts "Clearing the vendor directory..."
  vendor_dir = File.join(File.dirname(__FILE__),'vendor')
  FileUtils.rm_rf(vendor_dir) if Dir.exists?(vendor_dir)
  Dir.mkdir(vendor_dir)

  gem_list.each do |vendor|
    puts "Vendoring #{vendor[:directory]}..."
    gem_dir = File.join(vendor_dir,vendor[:directory])
    
    sh "git clone #{vendor[:github_repo]} #{gem_dir}"
    Dir.chdir(gem_dir) do
      sh 'git fetch origin'
      sh "git checkout #{vendor[:github_ref]}"
    end

    # Cleanup the gem directory...
    FileUtils.rm_rf(File.join(gem_dir,'.git'))
    FileUtils.rm_rf(File.join(gem_dir,'spec'))
  end

  # Generate the README
  readme = <<-HEREDOC
# Vendored Gems

The puppet language server is designed to run within the Puppet Agent ruby environment which means no access to Native Extensions or Gem bundling.

This means any Gems required outside of Puppet Agent for the language server must be vendored in this directory and the load path modified in the `puppet-languageserver` file.

Note - To comply with Licensing, the Gem source should be MIT licensed or even more unrestricted.

Note - To improve the packaging size, test files etc. were stripped from the Gems prior to committing.

Gem List
--------

HEREDOC
  gem_list.each { |vendor| readme += "* #{vendor[:directory]} (#{vendor[:github_repo]} ref #{vendor[:github_ref]})"}
  File.open(File.join(vendor_dir,'README.md'), 'wb') { |file| file.write(readme + "\n") }
end

task :default => [:test]
