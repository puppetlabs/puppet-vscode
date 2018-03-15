module PuppetLanguageServer
  module PuppetHelper
    class Cache
      def initialize(options = {})
        @cache_lock = Mutex.new
        @inmemory_cache = []
        @persistent_cache = nil

        # The cache consists of an array of hashes
        # [ {
        #     :file_key => <Unique name of the file>
        #     :section  => <Type of object in the file :function, :type, :class>
        #     :data     => {
        #                    :name => <Name of the object>
        #                    :data => <Object Data>
        #                  }
        #   },
        #  ...
        # ]

        # Note this cache is not persistent, i.e. once this object is disposed, the cache
        # must be rebuilt.  However this class could use a persistent backing store,
        # such as the filesystem to read cache objects from
        configure_persistent_cache(options)
      end

      def configure_persistent_cache(options = {})
        options = {} if options.nil?
        # Configure the persistent cache if specified
        case options[:persistent_cache]
        when :file
          @persistent_cache = PuppetLanguageServer::PuppetHelper::PersistentFileCache.new(options[:persistent_cache_options])
        else
          @persistent_cache = nil
        end
        true
      end

      def exist?(absolute_path, section = nil)
        return false if absolute_path.nil?
        file_key = canonical_path(absolute_path)

        idx = @inmemory_cache.find_index do |item|
          item[:file_key] == file_key &&
            (section.nil? || item[:section] == section) &&
            !item[:data].nil?
        end

        !idx.nil?
      end

      def load_from_persistent_cache!(absolute_path)
        return false if @persistent_cache.nil?
        file_key = canonical_path(absolute_path)

        json_obj = @persistent_cache.load(absolute_path, file_key)
        return false if json_obj.nil?

        @cache_lock.synchronize do
          # Clear out any existing info
          @inmemory_cache.reject! { |item| item[:file_key] == file_key }
          # Get the json object from the persistent cache
          # Build up the new cache entries
          result = json_obj['content'].map do |entry|
            new_entry = {
              :file_key => entry['file_key'],
              :section  => entry['section'].intern,
              :data     => {}
            }
            entry['data'].each do |name, dataitem|
              case new_entry[:section]
              when :function
                new_entry[:data][name.intern] = PuppetLanguageServer::PuppetHelper::FauxFunction.json_create(dataitem)
              when :type
                new_entry[:data][name.intern] = PuppetLanguageServer::PuppetHelper::FauxType.json_create(dataitem)
              when :class
                new_entry[:data][name.intern] = PuppetLanguageServer::PuppetHelper::FauxPuppetClass.json_create(dataitem)
              end
            end

            new_entry
          end
          @inmemory_cache.concat(result)
        end
        true
      end

      def set(absolute_path, section, object)
        file_key = canonical_path(absolute_path)
        object = {} if object.nil?

        @cache_lock.synchronize do
          idx = @inmemory_cache.find_index { |item| item[:file_key] == file_key && item[:section] == section }
          if idx.nil?
            @inmemory_cache << { :file_key => file_key, :section => section, :data => object }
          else
            item = @inmemory_cache[idx]
            item[:data] = object
          end
        end

        if @persistent_cache.nil?
          true
        else
          content = {
            'metadata' => {},
            'content'  => @inmemory_cache.select { |item| item[:file_key] == file_key }
          }
          @persistent_cache.save!(absolute_path, content)
        end
      end

      def get(absolute_path, section)
        file_key = canonical_path(absolute_path)
        @inmemory_cache.each do |item|
          next unless item[:file_key] == file_key && item[:section] == section
          return item[:data]
        end
        nil
      end

      def object_by_name(section, name)
        name = name.intern if name.is_a?(String)
        @inmemory_cache.each do |item|
          next unless item[:section] == section
          next if item[:data].nil? || item[:data].empty?
          return item[:data][name] unless item[:data][name].nil?
        end
        nil
      end

      def object_names_by_section(section)
        result = []
        @inmemory_cache.each do |item|
          next unless item[:section] == section
          next if item[:data].nil? || item[:data].empty?
          result += item[:data].keys
        end
        result.uniq!
        result.compact
      end

      def objects_by_section(section, &_block)
        @inmemory_cache.each do |item|
          next unless item[:section] == section
          next if item[:data].nil? || item[:data].empty?
          item[:data].each { |name, data| yield name, data }
        end
      end

      private

      def canonical_path(filepath)
        # Strictly speaking some file systems are case sensitive but ruby/puppet throws a fit
        # with naming if you do
        file_key = filepath.downcase

        file_key
      end
    end
  end
end
