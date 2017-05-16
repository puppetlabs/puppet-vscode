module PuppetLanguageServer
  module PuppetHelper
    # Reference - https://github.com/puppetlabs/puppet/blob/master/lib/puppet/reference/type.rb

    @ops_lock_types = Mutex.new
    @ops_lock_funcs = Mutex.new
    @types_hash = nil
    @function_module = nil

    def self.reset
      @ops_lock.synchronize do
        _reset
      end
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

    def self.types
      result = []
      @ops_lock_types.synchronize do
        _load_types if @types_hash.nil?
        result = @types_hash.keys.map { |key| key.to_s }
      end

      result
    end

    # Functions
    def self.load_functions
      @ops_lock_funcs.synchronize do
        _load_functions
      end
    end

    def self.functions
      result = []
      @ops_lock_funcs.synchronize do
        _load_functions if @function_module.nil?

        result = @function_module.all_function_info.keys.map { |key| key.to_s }
      end

      result
    end

    private
    # DO NOT ops_lock on any of these methods
    # deadlocks will ensue!
    def self._reset
      @types_hash = nil
      @function_module = nil
    end

    def self._load_types
      @types_hash = {}
      Puppet::Type.loadall

      Puppet::Type.eachtype { |type|
        next if type.name == :component
        next if type.name == :whit
        @types_hash[type.name] = type
      }

      nil
    end

    def self._load_functions
      autoloader = Puppet::Parser::Functions.autoloader
      autoloader.loadall

      @function_module = Puppet::Parser::Functions.environment_module(Puppet.lookup(:current_environment))

      nil
    end

  end
end
