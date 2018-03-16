module PuppetLanguageServer
  module PuppetHelper
    # key            => Unique name of the object
    # calling_source => The file that was invoked to create the object
    # source         => The file that _actually_ created the object
    # line           => The line number in the source file where the object was created
    # char           => The character number in the source file where the object was created
    # length         => The length of characters from `char` in the source file where the object was created
    class FauxBaseObject
      attr_accessor :key
      attr_accessor :calling_source
      attr_accessor :source
      attr_accessor :line
      attr_accessor :char
      attr_accessor :length

      def from_puppet!(*)
        raise NotImplmentedError
      end

      def to_json(*)
        raise NotImplmentedError
      end

      def self.json_create(*)
        raise NotImplmentedError
      end
    end

    class FauxFunction < FauxBaseObject
      attr_accessor :doc
      attr_accessor :arity
      attr_accessor :type

      def from_puppet!(name, item)
        self.key            = name
        self.source         = item[:source_location][:source]
        self.calling_source = source
        self.line           = item[:source_location][:line]
        # TODO: name ?
        self.doc   = item[:doc]
        self.arity = item[:arity]
        self.type  = item[:type]
      end

      def to_json(*options)
        {
          'key'            => key,
          'calling_source' => calling_source,
          'source'         => source,
          'line'           => line,
          'char'           => char,
          'length'         => length,

          'doc'            => doc,
          'arity'          => arity,
          'type'           => type
        }.to_json(*options)
      end

      def self.json_create(obj)
        result = new

        result.key            = obj['key'].intern
        result.calling_source = obj['calling_source']
        result.source         = obj['source']
        result.line           = obj['line']
        result.char           = obj['char']
        result.length         = obj['length']

        result.doc = obj['doc']
        result.arity = obj['arity']
        result.type = obj['type'].intern

        result
      end
    end

    class FauxType < FauxBaseObject
      attr_accessor :doc
      attr_accessor :attributes

      def allattrs
        @attributes.keys
      end

      def parameters
        @attributes.select { |_name, data| data[:type] == :param }
      end

      def properties
        @attributes.select { |_name, data| data[:type] == :property }
      end

      def meta_parameters
        @attributes.select { |_name, data| data[:type] == :meta }
      end

      def from_puppet!(name, item)
        name = name.intern if name.is_a?(String)
        self.key            = name
        self.source         = item._source_location[:source]
        self.calling_source = source
        self.line           = item._source_location[:line]
        self.doc            = item.doc

        self.attributes = {}
        item.allattrs.each do |attrname|
          attrclass = item.attrclass(attrname)
          val = {
            :type => item.attrtype(attrname),
            :doc  => attrclass.doc
          }
          val[:required?] = attrclass.required? if attrclass.respond_to?(:required?)
          attributes[attrname] = val
        end
      end

      def to_json(*options)
        {
          'key'            => key,
          'calling_source' => calling_source,
          'source'         => source,
          'line'           => line,
          'char'           => char,
          'length'         => length,

          'doc'            => doc,
          'attributes'     => attributes
        }.to_json(*options)
      end

      def self.json_create(obj)
        result = new

        result.key            = obj['key'].intern
        result.calling_source = obj['calling_source']
        result.source         = obj['source']
        result.line           = obj['line']
        result.char           = obj['char']
        result.length         = obj['length']

        result.doc = obj['doc']
        result.attributes = {}
        unless obj['attributes'].nil?
          obj['attributes'].each do |attr_name, obj_attr|
            result.attributes[attr_name.intern] = {
              :type      => obj_attr['type'].intern,
              :doc       => obj_attr['doc'],
              :required? => obj_attr['required?']
            }
          end
        end

        result
      end
    end

    class FauxPuppetClass < FauxBaseObject
      def from_puppet!(name, item)
        self.key            = name
        self.source         = item['source']
        self.calling_source = source
        self.line           = item['line']
        self.char           = item['char']

        # TODO: Doc, parameters?
      end

      def to_json(*options)
        {
          'key'            => key,
          'calling_source' => calling_source,
          'source'         => source,
          'line'           => line,
          'char'           => char,
          'length'         => length
        }.to_json(*options)
      end

      def self.json_create(obj)
        result = new

        result.key            = obj['key'].intern
        result.calling_source = obj['calling_source']
        result.source         = obj['source']
        result.line           = obj['line']
        result.char           = obj['char']
        result.length         = obj['length']

        result
      end
    end
  end
end
