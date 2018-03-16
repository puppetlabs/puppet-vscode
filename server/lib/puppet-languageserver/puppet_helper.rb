require 'puppet/indirector/face'
require 'pathname'

%w[puppet_helper/faux_objects].each do |lib|
  begin
    require "puppet-languageserver/#{lib}"
  rescue LoadError
    require File.expand_path(File.join(File.dirname(__FILE__), lib))
  end
end

module PuppetLanguageServer
  module PuppetHelper
    # Reference - https://github.com/puppetlabs/puppet/blob/master/lib/puppet/reference/type.rb

    @ops_lock_types = Mutex.new
    @ops_lock_funcs = Mutex.new
    @ops_lock_classes = Mutex.new
    @class_load_info = {}
    @function_load_info = {}
    @type_load_info = {}

    @default_types_loaded = nil
    @default_functions_loaded = nil
    @default_classes_loaded = nil

    # Resource Face
    def self.resource_face_get_by_typename(typename)
      resources = Puppet::Face[:resource, '0.0.1'].search(typename)
      prune_resource_parameters(resources)
    end

    def self.resource_face_get_by_typename_and_title(typename, title)
      resources = Puppet::Face[:resource, '0.0.1'].find("#{typename}/#{title}")
      prune_resource_parameters(resources)
    end

    # Types
    def self.load_types_async
      Thread.new do
        load_types
      end
    end

    def self.types_loaded?
      @default_types_loaded.nil? ? false : @default_types_loaded
    end

    def self.load_types
      _load_default_types
    end

    def self.get_type(name)
      result = nil
      return result if @default_types_loaded.nil?
      @ops_lock_types.synchronize do
        result = @type_load_info[name.intern]
      end
      result
    end

    def self.type_names
      result = []
      return result if @default_types_loaded.nil?
      @ops_lock_types.synchronize do
        result = @type_load_info.keys.map(&:to_s)
      end
      result
    end

    # Functions
    def self.functions_loaded?
      @default_functions_loaded.nil? ? false : @default_functions_loaded
    end

    def self.load_functions
      _load_default_functions if @default_functions_loaded.nil?
    end

    def self.load_functions_async
      Thread.new do
        load_functions
      end
    end

    def self.filtered_function_names(&block)
      result = []
      return result if @default_functions_loaded.nil?
      @ops_lock_funcs.synchronize do
        @function_load_info.each do |name, data|
          filter = block.call(name, data)
          result << name if filter == true
        end
      end
      result
    end

    def self.function(name)
      result = nil
      return result if @default_functions_loaded.nil?
      @ops_lock_funcs.synchronize do
        result = @function_load_info[name.intern].dup if @function_load_info.key?(name.intern)
      end
      result
    end

    def self.function_names
      result = []
      return result if @default_functions_loaded.nil?
      @ops_lock_funcs.synchronize do
        result = @function_load_info.keys.map(&:to_s)
      end
      result
    end

    # Classes and Defined Types
    def self.classes_loaded?
      @default_classes_loaded.nil? ? false : @default_classes_loaded
    end

    def self.load_classes
      _load_default_classes if @default_classes_loaded.nil?
    end

    def self.load_classes_async
      Thread.new do
        load_classes
      end
    end

    def self.get_class(name)
      result = nil
      return result if @default_classes_loaded.nil?
      @ops_lock_funcs.synchronize do
        result = @class_load_info[name.intern].dup if @class_load_info.key?(name.intern)
      end
      result
    end

    def self.prune_resource_parameters(resources)
      # From https://github.com/puppetlabs/puppet/blob/488661d84e54904124514ab9e4500e81b10f84d1/lib/puppet/application/resource.rb#L146-L148
      if resources.is_a?(Array)
        resources.map(&:prune_parameters)
      else
        resources.prune_parameters
      end
    end
    private_class_method :prune_resource_parameters

    # Class and Defined Type loading
    def self._load_default_classes
      @default_classes_loaded = false
      PuppetLanguageServer.log_message(:debug, '[PuppetHelper::_load_default_classes] Starting')

      module_path_list = []
      # Add the base modulepath
      module_path_list.concat(Puppet::Node::Environment.split_path(Puppet.settings[:basemodulepath]))
      # Add the modulepath
      module_path_list.concat(Puppet::Node::Environment.split_path(Puppet.settings[:modulepath]))

      # Add the environment specified in puppet conf - This can be overridden by the master but there's no way to know.
      unless Puppet.settings[:environmentpath].nil?
        module_path_list << File.join(Puppet.settings[:environmentpath], Puppet.settings[:environment], 'modules') unless Puppet.settings[:environment].nil?

        module_path_list.concat(Pathname.new(Puppet.settings[:environmentpath])
                                        .children
                                        .select { |c| c.directory? }
                                        .collect { |c| File.join(c, 'modules') })
      end
      module_path_list.uniq!
      PuppetLanguageServer.log_message(:debug, "[PuppetHelper::_load_default_classes] Loading classes from #{module_path_list}")

      # Find all of the manifest paths for all of the modules...
      manifest_path_list = []
      module_path_list.each do |module_path|
        next unless File.exist?(module_path)
        Pathname.new(module_path)
                .children
                .select { |c| c.directory? }
                .each do |module_filepath|
                  manifest_path = File.join(module_filepath, 'manifests')
                  manifest_path_list << manifest_path if File.exist?(manifest_path)
                end
      end

      # Find and parse all manifests in the manifest paths
      @class_load_info = {}
      class_count = 0
      manifest_path_list.each do |manifest_path|
        Dir.glob("#{manifest_path}/**/*.pp").each do |manifest_file|
          class_count += load_classes_from_manifest(manifest_file)
        end
      end
      @default_classes_loaded = true

      PuppetLanguageServer.log_message(:debug, "[PuppetHelper::_load_default_classes] Finished loading #{class_count} classes")
      nil
    end
    private_class_method :_load_default_classes

    def self.load_classes_from_manifest(manifest_file)
      file_content = File.open(manifest_file, 'r:UTF-8') { |f| f.read }

      parser = Puppet::Pops::Parser::Parser.new
      result = nil
      begin
        result = parser.parse_string(file_content, '')
      rescue Puppet::ParseErrorWithIssue => _exception
        # Any parsing errors means we can't inspect the document
        return 0
      end

      class_info_count = 0
      # Enumerate the entire AST looking for classes and defined types
      # TODO: Need to learn how to read the help/docs for hover support
      if result.model.respond_to? :eAllContents
        # Puppet 4 AST
        result.model.eAllContents.select do |item|
          puppet_class = {}
          case item.class.to_s
          when 'Puppet::Pops::Model::HostClassDefinition'
            puppet_class['type'] = :class
          when 'Puppet::Pops::Model::ResourceTypeDefinition'
            puppet_class['type'] = :typedefinition
          else
            next
          end
          puppet_class['name']       = item.name
          puppet_class['parameters'] = item.parameters
          puppet_class['source']     = manifest_file
          puppet_class['line']       = result.locator.line_for_offset(item.offset) - 1
          puppet_class['char']       = result.locator.offset_on_line(item.offset)

          obj = FauxPuppetClass.new
          obj.from_puppet!(item.name, puppet_class)
          @ops_lock_classes.synchronize do
            @class_load_info[item.name.intern] = obj
          end
          class_info_count += 1
        end
      else
        result.model._pcore_all_contents([]) do |item|
          puppet_class = {}
          case item.class.to_s
          when 'Puppet::Pops::Model::HostClassDefinition'
            puppet_class['type'] = :class
          when 'Puppet::Pops::Model::ResourceTypeDefinition'
            puppet_class['type'] = :typedefinition
          else
            next
          end
          puppet_class['name']       = item.name
          puppet_class['parameters'] = item.parameters
          puppet_class['source']     = manifest_file
          puppet_class['line']       = item.line
          puppet_class['char']       = item.pos

          obj = FauxPuppetClass.new
          obj.from_puppet!(item.name, puppet_class)
          @ops_lock_classes.synchronize do
            @class_load_info[item.name.intern] = obj
          end
          class_info_count += 1
        end
      end

      class_info_count
    end

    def self.load_type_file(name, autoloader, env)
      expanded_name = autoloader.expand(name)
      absolute_name = Puppet::Util::Autoload.get_file(expanded_name, env)
      if absolute_name.nil?
        PuppetLanguageServer.log_message(:warn, "[PuppetHelper::load_type_file] Could not find absolute path of type #{name}")
        return 0
      end

      # Get the list of currently loaded types
      loaded_types = []
      # Due to PUP-8301, if no types have been loaded yet then Puppet::Type.eachtype
      # will throw instead of not yielding.
      begin
        Puppet::Type.eachtype { |item| loaded_types << item.name }
      rescue NoMethodError => detail
        # Detect PUP-8301
        if detail.respond_to?(:receiver)
          raise unless detail.name == :each && detail.receiver.nil?
        else
          raise unless detail.name == :each && detail.message =~ /nil:NilClass/
        end
      end

      unless autoloader.loaded?(name)
        # This is an expensive call
        unless autoloader.load(name)
          PuppetLanguageServer.log_message(:error, "[PuppetHelper::load_type_file] type #{absolute_name} did not load")
        end
      end

      # Find the types that were loaded
      type_count = 0
      # Due to PUP-8301, if no types have been loaded yet then Puppet::Type.eachtype
      # will throw instead of not yielding.
      begin
        Puppet::Type.eachtype do |item|
          next if loaded_types.include?(item.name)
          # Ignore the internal only Puppet Types
          next if item.name == :component || item.name == :whit
          obj = FauxType.new
          obj.from_puppet!(item.name, item)
          @ops_lock_types.synchronize do
            @type_load_info[obj.key] = obj
          end
          type_count += 1
        end
      rescue NoMethodError => detail
        # Detect PUP-8301
        if detail.respond_to?(:receiver)
          raise unless detail.name == :each && detail.receiver.nil?
        else
          raise unless detail.name == :each && detail.message =~ /nil:NilClass/
        end
      end

      PuppetLanguageServer.log_message(:warn, "[PuppetHelper::load_type_file] type #{absolute_name} did not load any types") if type_count.zero?

      type_count
    end
    private_class_method :load_type_file

    def self._load_default_types
      @default_types_loaded = false
      PuppetLanguageServer.log_message(:debug, '[PuppetHelper::_load_default_types] Starting')

      # From https://github.com/puppetlabs/puppet/blob/ebd96213cab43bb2a8071b7ac0206c3ed0be8e58/lib/puppet/metatype/manager.rb#L182-L189
      autoloader = Puppet::Util::Autoload.new(self, 'puppet/type')
      current_env = Puppet.lookup(:current_environment)
      type_count = 0

      # This is an expensive call
      autoloader.files_to_load.each do |file|
        name = file.gsub(autoloader.path + '/', '')
        begin
          type_count += load_type_file(name, autoloader, current_env)
        rescue StandardError => err
          PuppetLanguageServer.log_message(:error, "[PuppetHelper::_load_default_types] Error loading type #{file}: #{err} #{err.backtrace}")
        end
      end

      PuppetLanguageServer.log_message(:debug, "[PuppetHelper::_load_default_types] Finished loading #{type_count} type/s")

      @default_types_loaded = true
      nil
    end
    private_class_method :_load_default_types

    def self.load_function_file(name, autoloader, env)
      expanded_name = autoloader.expand(name)
      absolute_name = Puppet::Util::Autoload.get_file(expanded_name, env)
      if absolute_name.nil?
        PuppetLanguageServer.log_message(:warn, "[PuppetHelper::load_function_file] Could not find absolute path of function #{name}")
        return 0
      end

      function_module = Puppet::Parser::Functions.environment_module(env)
      function_count = 0
      unless autoloader.loaded?(name)
        # This is an expensive call
        unless autoloader.load(name, env)
          PuppetLanguageServer.log_message(:error, "[PuppetHelper::load_function_file] function #{absolute_name} did not load")
        end
      end

      # Find the functions that were loaded based on source file name (case insensitive)
      funcs = {}
      function_module.all_function_info
                     .select { |_k, i| absolute_name.casecmp(i[:source_location][:source].to_s).zero? }
                     .each do |func_name, item|
        obj = FauxFunction.new
        obj.from_puppet!(func_name, item)
        obj.calling_source = absolute_name
        @ops_lock_funcs.synchronize do
          @function_load_info[obj.key] = obj
        end

        funcs[obj.key] = obj
        function_count += 1
      end
      PuppetLanguageServer.log_message(:warn, "[PuppetHelper::load_function_file] file #{absolute_name} did load any functions") if function_count.zero?

      function_count
    end
    private_class_method :load_function_file

    def self._load_default_functions
      @default_functions_loaded = false
      PuppetLanguageServer.log_message(:debug, '[PuppetHelper::_load_default_functions] Starting')

      autoloader = Puppet::Parser::Functions.autoloader
      current_env = Puppet.lookup(:current_environment)
      function_count = 0

      # Functions that are already loaded (e.g. system default functions like alert)
      # should already be populated so insert them into the function results
      #
      # Find the unique filename list
      function_module = Puppet::Parser::Functions.environment_module(current_env)
      filenames = []
      function_module.all_function_info.each_value do |data|
        filenames << data[:source_location][:source] unless data[:source_location].nil? || data[:source_location][:source].nil?
      end
      filenames.uniq!.compact!
      # Now add the functions in each file to the cache
      filenames.each do |filename|
        function_module.all_function_info
                       .select { |_k, i| filename.casecmp(i[:source_location][:source].to_s).zero? }
                       .each do |name, item|
          obj = FauxFunction.new
          obj.from_puppet!(name, item)
          @ops_lock_funcs.synchronize do
            @function_load_info[obj.key] = obj
          end
          function_count += 1
        end
      end

      # Now we can load functions from the default locations
      autoloader.files_to_load.each do |file|
        name = file.gsub(autoloader.path + '/', '')
        begin
          function_count += load_function_file(name, autoloader, current_env)
        rescue StandardError => err
          PuppetLanguageServer.log_message(:error, "[PuppetHelper::_load_default_functions] Error loading function #{file}: #{err} #{err.backtrace}")
        end
      end

      PuppetLanguageServer.log_message(:debug, "[PuppetHelper::_load_default_functions] Finished loading #{function_count} functions")
      @default_functions_loaded = true
      nil
    end
    private_class_method :_load_default_functions
  end
end
