module PuppetLanguageServer
  module PuppetParserHelper
    def self.object_under_cursor(content, line_num, char_num, try_char_removal = false)
      # Use Puppet to generate the AST
      parser = Puppet::Pops::Parser::Parser.new()

      result = nil
      begin
        result = parser.parse_string(content, '')
      rescue Puppet::ParseErrorWithIssue => exception
        raise unless try_char_removal

        # TODO: Do we care about CRLF vs LF - I don't think so.
        line_offset = 0
        (1..line_num).each { |_x| line_offset = content.index("\n",line_offset + 1) unless line_offset.nil? }
        raise if line_offset.nil?

        # Remove the offending character and try parsing again.
        new_content = content.slice(0,line_offset + char_num) + content.slice(line_offset + char_num + 1, content.length - 1)

        result = parser.parse_string(new_content, '')
      end

      # Convert line and char nums (base 0) to an absolute offset
      #   result.line_offsets contains an array of the offsets on a per line basis e.g.
      #     [0, 14, 34, 36]  means line number 2 starts at absolute offset 34
      #   Once we know the line offset, we can simply add on the char_num to get the absolute offset
      abs_offset = result.line_offsets[line_num] + char_num
      # Typically we're completing after something was typed, so go back one char
      abs_offset = abs_offset - 1 if abs_offset > 0

      # Enumerate the AST looking for items that span the line/char we want.
      # Once we have all valid items, sort them by the smallest span.  Typically the smallest span
      # is the most specific object in the AST
      #
      # TODO: Should probably walk the AST and only look for the deepest child, but integer sorting
      #       is so much easier and faster.
      valid_models = result.model.eAllContents.select do |item|
        !item.offset.nil? && !item.length.nil? && abs_offset >= item.offset && abs_offset <= item.offset + item.length
      end.sort { |a, b| a.length - b.length }

      # nil means the root of the document
      return nil if valid_models.length == 0
      item = valid_models[0]

      item
    end

    # Reference - https://github.com/puppetlabs/puppet/blob/master/spec/lib/puppet_spec/compiler.rb
    def self.compile_to_catalog(string, node = Puppet::Node.new('test'))
      Puppet[:code] = string
      # see lib/puppet/indirector/catalog/compiler.rb#filter
      Puppet::Parser::Compiler.compile(node).filter { |r| r.virtual? }
    end

    def self.compile_to_ral(manifest, node = Puppet::Node.new('test'))
      # Add the node facts if they don't already exist
      # TODO Still missing the $facts['..'] in the catalog.  Don't know why :-(
      node.merge(PuppetLanguageServer::FacterHelper.facts) if node.facts == nil

      catalog = compile_to_catalog(manifest, node)
      ral = catalog.to_ral
      ral.finalize
      ral
    end

    def self.compile_to_relationship_graph(manifest, prioritizer = Puppet::Graph::SequentialPrioritizer.new)
      ral = compile_to_ral(manifest)
      graph = Puppet::Graph::RelationshipGraph.new(prioritizer)
      graph.populate_from(ral)
      graph
    end

    def self.compile_to_pretty_relationship_graph(manifest, prioritizer = Puppet::Graph::SequentialPrioritizer.new)
      graph = compile_to_relationship_graph(manifest, prioritizer)

      # Remove vertexes which just clutter the graph

      # Remove all of the Puppet::Type::Whit nodes.  This is an internal only class
      list = graph.vertices.select { |node| node.is_a?(Puppet::Type::Whit) }
      list.each { |node| graph.remove_vertex!(node) }

      # Remove all of the Puppet::Type::Schedule nodes
      list = graph.vertices.select { |node| node.is_a?(Puppet::Type::Schedule) }
      list.each { |node| graph.remove_vertex!(node) }

      # Remove all of the Puppet::Type::Filebucket nodes
      list = graph.vertices.select { |node| node.is_a?(Puppet::Type::Filebucket) }
      list.each { |node| graph.remove_vertex!(node) }

      graph
    end
  end
end
