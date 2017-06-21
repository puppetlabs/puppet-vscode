module PuppetLanguageServer
  module FacterHelper
    @ops_lock = Mutex.new

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

    def self.load_facts
      @ops_lock.synchronize do
        _load_facts
      end
    end

    def self.facts
      @ops_lock.synchronize do
        _load_facts if @fact_hash.nil?
        @fact_hash.clone
      end
    end

    # DO NOT ops_lock on any of these methods
    # deadlocks will ensue!
    def self._reset
      Facter.reset
      @fact_hash = nil
    end
    private_class_method :_reset

    def self._load_facts
      _reset
      Facter.loadfacts
      @fact_hash = Facter.to_hash
    end
    private_class_method :_load_facts
  end
end
