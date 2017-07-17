require 'puppet/indirector/face'

module PuppetLanguageServer
  module PuppetHelper
    # Reference - https://github.com/puppetlabs/puppet/blob/master/lib/puppet/reference/type.rb

    @ops_lock_types = Mutex.new
    @ops_lock_funcs = Mutex.new
    @types_hash = nil
    @function_module = nil

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

    def self.load_types
      @ops_lock_types.synchronize do
        _load_types
      end
    end

    def self.get_type(name)
      result = nil
      @ops_lock_types.synchronize do
        _load_types if @types_hash.nil?
        result = @types_hash[name.intern]
      end
      result
    end

    def self.type_names
      result = []
      @ops_lock_types.synchronize do
        _load_types if @types_hash.nil?
        result = @types_hash.keys.map(&:to_s)
      end
      result
    end

    # Functions
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
      @ops_lock_funcs.synchronize do
        _load_functions if @function_module.nil?
        result = @function_module.all_function_info.dup
      end
      result
    end

    def self.function(name)
      result = nil
      @ops_lock_funcs.synchronize do
        _load_functions if @function_module.nil?
        result = @function_module.all_function_info[name.intern]
      end
      result
    end

    def self.function_names
      result = []
      @ops_lock_funcs.synchronize do
        _load_functions if @function_module.nil?
        result = @function_module.all_function_info.keys.map(&:to_s)
      end
      result
    end

    # DO NOT ops_lock on any of these methods
    # deadlocks will ensue!
    def self._reset
      @types_hash = nil
      @function_module = nil
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

    def self._load_types
      @types_hash = {}
      # This is an expensive call
      # From https://github.com/puppetlabs/puppet/blob/ebd96213cab43bb2a8071b7ac0206c3ed0be8e58/lib/puppet/metatype/manager.rb#L182-L189

      autoloader = Puppet::Util::Autoload.new(self, 'puppet/type')
      autoloader.files_to_load.each do |file|
        name = file.gsub(autoloader.path + '/','')
        begin
          result = autoloader.load(name)
          PuppetLanguageServer.log_message(:error, "[PuppetHelper::_load_types] type #{file} did not load") unless result
        rescue StandardError => err
          PuppetLanguageServer.log_message(:error, "[PuppetHelper::_load_types] Error loading type #{file}: #{err}")
        end unless autoloader.loaded?(name)
      end

      Puppet::Type.eachtype do |type|
        next if type.name == :component
        next if type.name == :whit

        @types_hash[type.name] = type
      end

      type_count = @types_hash.count
      PuppetLanguageServer.log_message(:debug, "[PuppetHelper::_load_types] Finished loading #{type_count} types")

      nil
    end
    private_class_method :_load_types

    def self._load_functions
      autoloader = Puppet::Parser::Functions.autoloader

      # This is an expensive call
      autoloader.files_to_load.each do |file|
        name = file.gsub(autoloader.path + '/','')
        begin
          result = autoloader.load(name)
          PuppetLanguageServer.log_message(:error, "[PuppetHelper::_load_functions] function #{file} did not load") unless result
        rescue StandardError => err
          PuppetLanguageServer.log_message(:error, "[PuppetHelper::_load_functions] Error loading function #{file}: #{err}")
        end unless autoloader.loaded?(name)
      end

      @function_module = Puppet::Parser::Functions.environment_module(Puppet.lookup(:current_environment))

      function_count = @function_module.all_function_info.keys.map(&:to_s).count
      PuppetLanguageServer.log_message(:debug, "[PuppetHelper::_load_functions] Finished loading #{function_count} functions")
      nil
    end
    private_class_method :_load_functions
  end
end
