require 'rake'
require 'json'

desc "Builds the Puppet Module"
task :package, [:module_version] => ['package:clean', 'package:create']

namespace :package do
  def working_dir
    File.expand_path(File.join(File.dirname(__FILE__),'puppet_language_server'))
  end
  def skeleton_dir
    File.expand_path(File.join(File.dirname(__FILE__),'module_skeleton'))
  end
  def server_source_dir
    File.expand_path(File.join(File.dirname(__FILE__),'..'))
  end
  def server_dest_dir
    File.expand_path(File.join(working_dir,'files'))
  end
  def package_output_dir
    File.expand_path(File.join(working_dir,'pkg'))
  end
  def this_dir
    File.expand_path(File.dirname(__FILE__))
  end

  desc "Cleans working files for packaging"
  task :clean do
    workdir = working_dir
    puts "Cleaning #{workdir}"
    FileUtils.remove_dir(workdir) if Dir.exist?(workdir)
  end

  desc "Package the Language Server into a Puppet Module"
  task :create, [:module_version] do |t, args|
    workdir = working_dir
    puts "Copying module skeleton..."
    FileUtils.cp_r(skeleton_dir,workdir)
    
    puts "Copying language server lib..."
    FileUtils.mkdir_p(server_dest_dir)
    FileUtils.cp_r(File.expand_path(File.join(server_source_dir,'lib')),server_dest_dir)

    puts "Copying vendored gems..."
    FileUtils.mkdir_p(server_dest_dir)
    FileUtils.cp_r(File.expand_path(File.join(server_source_dir,'vendor')),server_dest_dir)

    puts "Copying language server root..."
    FileUtils.cp(File.expand_path(File.join(server_source_dir,'puppet-languageserver')),server_dest_dir)

    unless args[:module_version].nil?
      puts "Injecting module version #{args[:module_version]}..."
      path = File.expand_path(File.join(working_dir,'metadata.json'))

      metadata = JSON.parse(File.read(path))
      metadata['version'] = args[:module_version]
      File.open(path, "w") {|file| file.puts JSON.pretty_generate(metadata) }
    end

    puts "Creating puppet module..."
    FileUtils.cd(workdir) do
      %x(puppet module build)
    end

    puts "Grabbing module tarball..."
    Dir.entries(package_output_dir).select {|f| f.end_with?('.tar.gz') }.each do |f|
      puts "Found tarball #{f}"
      FileUtils.cp(File.expand_path(File.join(package_output_dir,f)),this_dir)
    end
  end
end