module PuppetLanguageServer
  module FacterHelper
    @ops_lock = Mutex.new
    @facts_loaded = nil

    def self.reset
      @ops_lock.synchronize do
        _reset
      end
    end

    def self.load_facts_async
      Thread.new do
        load_facts
      end
    end

    def self.facts_loaded?
      @facts_loaded.nil? ? false : @facts_loaded
    end

    def self.load_facts
      @ops_lock.synchronize do
        _load_facts
      end
    end

    def self.facts
      return {} if @facts_loaded == false
      @ops_lock.synchronize do
        _load_facts if @fact_hash.nil?
        @fact_hash.clone
      end
    end

    # DO NOT ops_lock on any of these methods
    # deadlocks will ensue!
    def self._reset
      @facts_loaded = nil
      Facter.reset
      @fact_hash = nil
    end
    private_class_method :_reset

    def self._load_facts
      _reset
      Facter.loadfacts
      @fact_hash = Facter.to_hash
      PuppetLanguageServer.log_message(:debug, "[FacterHelper::_load_facts] Finished loading #{@fact_hash.keys.count} facts")
      @facts_loaded = true
    end
    private_class_method :_load_facts
  end
end
