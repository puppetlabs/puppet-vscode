require 'puppet/indirector/face'
require 'pathname'
module PuppetLanguageServer
  module PuppetHelper
    # Reference - https://github.com/puppetlabs/puppet/blob/master/lib/puppet/reference/type.rb

    @ops_lock_types = Mutex.new
    @ops_lock_funcs = Mutex.new
    @ops_lock_classes = Mutex.new
    @types_hash = nil
    @function_module = nil
    @types_loaded = nil
    @functions_loaded = nil
    @classes_loaded = nil
    @class_load_info = {}
    @function_load_info = {}
    @type_load_info = {}

    def self.reset
      @ops_lock_types.synchronize do
        @ops_lock_funcs.synchronize do
          _reset
        end
      end
    end

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
      @types_loaded.nil? ? false : @types_loaded
    end

    def self.load_types
      @ops_lock_types.synchronize do
        _load_types
      end
    end

    def self.get_type(name)
      result = nil
      return result if @types_loaded == false
      @ops_lock_types.synchronize do
        _load_types if @types_hash.nil?
        result = @types_hash[name.intern]
      end
      result
    end

    def self.type_names
      result = []
      return result if @types_loaded == false
      @ops_lock_types.synchronize do
        _load_types if @types_hash.nil?
        result = @types_hash.keys.map(&:to_s)
      end
      result
    end

    # Functions
    def self.functions_loaded?
      @functions_loaded.nil? ? false : @functions_loaded
    end

    def self.load_functions
      @ops_lock_funcs.synchronize do
        _load_functions if @function_module.nil?
      end
    end

    def self.load_functions_async
      Thread.new do
        load_functions
      end
    end

    def self.functions
      result = []
      return result if @functions_loaded == false
      @ops_lock_funcs.synchronize do
        _load_functions if @function_module.nil?
        result = @function_module.all_function_info.dup
      end
      result
    end

    def self.function(name)
      result = nil
      return result if @functions_loaded == false
      @ops_lock_funcs.synchronize do
        _load_functions if @function_module.nil?
        result = @function_module.all_function_info[name.intern]
      end
      result
    end

    def self.function_names
      result = []
      return result if @functions_loaded == false
      @ops_lock_funcs.synchronize do
        _load_functions if @function_module.nil?
        result = @function_module.all_function_info.keys.map(&:to_s)
      end
      result
    end

    # Classes and Defined Types
    def self.classes_loaded?
      @classes_loaded.nil? ? false : @classes_loaded
    end

    def self.load_classes
      @ops_lock_classes.synchronize do
        _load_classes if @classes_loaded.nil?
      end
    end

    def self.load_classes_async
      Thread.new do
        load_classes
      end
    end

    # Loading information
    def self.add_function_load_info(name, options)
      @function_load_info[name.to_s] = options
    end

    def self.function_load_info(name)
      options = @function_load_info[name.to_s]
      options.nil? ? nil : options.dup
    end

    def self.add_type_load_info(name, options)
      @type_load_info[name.to_s] = options
    end

    def self.type_load_info(name)
      options = @type_load_info[name.to_s]
      options.nil? ? nil : options.dup
    end

    def self.class_load_info(name)
      # This is the only entrypoint to class loading
      load_classes
      options = @class_load_info[name.to_s]
      options.nil? ? nil : options.dup
    end

    # DO NOT ops_lock on any of these methods
    # deadlocks will ensue!
    def self._reset
      @types_hash = nil
      @function_module = nil
      @types_loaded = nil
      @functions_loaded = nil
      @classes_loaded = nil
      @function_load_info = {}
      @type_load_info = {}
      @class_load_info = {}
    end
    private_class_method :_reset

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
    def self._load_classes
      @classes_loaded = false
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
      PuppetLanguageServer.log_message(:debug, "[PuppetHelper::_load_classes] Loading classes from #{module_path_list}")

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
      manifest_path_list.each do |manifest_path|
        Dir.glob("#{manifest_path}/**/*.pp").each do |manifest_file|
          classes = load_classes_from_manifest(manifest_file)
          next if classes.nil?
          classes.each do |key, data|
            @class_load_info[key] = data unless @class_load_info.key?(name)
          end
        end
      end
      @classes_loaded = true

      PuppetLanguageServer.log_message(:debug, "[PuppetHelper::_load_classes] Finished loading #{@class_load_info.count} classes")
      nil
    end
    private_class_method :_load_classes

    def self.load_classes_from_manifest(manifest_file)
      file_content = File.open(manifest_file, 'r:UTF-8') { |f| f.read }

      parser = Puppet::Pops::Parser::Parser.new
      result = nil
      begin
        result = parser.parse_string(file_content, '')
      rescue Puppet::ParseErrorWithIssue => _exception
        # Any parsing errors means we can't inspect the document
        return nil
      end

      class_info = {}
      # Enumerate the entire AST looking for classes and defined types
      # TODO: Need to learn how to read the help/docs for hover support
      if result.model.respond_to? :eAllContents
        # TODO: Puppet 4 language stuff
        result.model.eAllContents.select do |item|
          case item.class.to_s
          when 'Puppet::Pops::Model::HostClassDefinition'
            class_info[item.name] = {
              'name' => item.name,
              'type' => 'class',
              'parameters' => item.parameters,
              'source' => manifest_file,
              'line' => result.locator.line_for_offset(item.offset) - 1,
              'char' => result.locator.offset_on_line(item.offset)
            }
          when 'Puppet::Pops::Model::ResourceTypeDefinition'
            class_info[item.name] = {
              'name' => item.name,
              'type' => 'typedefinition',
              'parameters' => item.parameters,
              'source' => manifest_file,
              'line' => result.locator.line_for_offset(item.offset) - 1,
              'char' => result.locator.offset_on_line(item.offset)
            }
          end
        end
      else
        result.model._pcore_all_contents([]) do |item|
          case item.class.to_s
          when 'Puppet::Pops::Model::HostClassDefinition'
            class_info[item.name] = {
              'name' => item.name,
              'type' => 'class',
              'parameters' => item.parameters,
              'source' => manifest_file,
              'line' => item.line,
              'char' => item.pos
            }
          when 'Puppet::Pops::Model::ResourceTypeDefinition'
            class_info[item.name] = {
              'name' => item.name,
              'type' => 'typedefinition',
              'parameters' => item.parameters,
              'source' => manifest_file,
              'line' => item.line,
              'char' => item.pos
            }
          end
        end
      end

      class_info
    end

    def self._load_types
      @types_loaded = false
      @types_hash = {}
      # This is an expensive call
      # From https://github.com/puppetlabs/puppet/blob/ebd96213cab43bb2a8071b7ac0206c3ed0be8e58/lib/puppet/metatype/manager.rb#L182-L189

      autoloader = Puppet::Util::Autoload.new(self, 'puppet/type')
      autoloader.files_to_load.each do |file|
        name = file.gsub(autoloader.path + '/', '')
        next if autoloader.loaded?(name)
        begin
          result = autoloader.load(name)
          PuppetLanguageServer.log_message(:error, "[PuppetHelper::_load_types] type #{file} did not load") unless result
        rescue StandardError => err
          PuppetLanguageServer.log_message(:error, "[PuppetHelper::_load_types] Error loading type #{file}: #{err}")
        end
      end

      Puppet::Type.eachtype do |type|
        next if type.name == :component
        next if type.name == :whit

        @types_hash[type.name] = type
      end

      type_count = @types_hash.count
      PuppetLanguageServer.log_message(:debug, "[PuppetHelper::_load_types] Finished loading #{type_count} types")

      @types_loaded = true
      nil
    end
    private_class_method :_load_types

    def self._load_functions
      @functions_loaded = false
      autoloader = Puppet::Parser::Functions.autoloader

      # This is an expensive call
      autoloader.files_to_load.each do |file|
        name = file.gsub(autoloader.path + '/', '')
        next if autoloader.loaded?(name)
        begin
          result = autoloader.load(name)
          PuppetLanguageServer.log_message(:error, "[PuppetHelper::_load_functions] function #{file} did not load") unless result
        rescue StandardError => err
          PuppetLanguageServer.log_message(:error, "[PuppetHelper::_load_functions] Error loading function #{file}: #{err}")
        end
      end

      @function_module = Puppet::Parser::Functions.environment_module(Puppet.lookup(:current_environment))

      function_count = @function_module.all_function_info.keys.map(&:to_s).count
      PuppetLanguageServer.log_message(:debug, "[PuppetHelper::_load_functions] Finished loading #{function_count} functions")
      @functions_loaded = true
      nil
    end
    private_class_method :_load_functions
  end
end
