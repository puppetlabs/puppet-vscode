module PuppetLanguageServer
  module PuppetParserHelper
    def self.remove_chars_starting_at(content, line_offsets, line_num, char_num, num_chars_to_remove)
      line_offset = line_offsets[line_num]
      raise if line_offset.nil?

      # Remove the offending character
      new_content = content.slice(0, line_offset + char_num - num_chars_to_remove) + content.slice(line_offset + char_num, content.length - num_chars_to_remove)

      new_content
    end

    def self.remove_char_at(content, line_offsets, line_num, char_num)
      remove_chars_starting_at(content, line_offsets, line_num, char_num, 1)
    end

    def self.get_char_at(content, line_offsets, line_num, char_num)
      line_offset = line_offsets[line_num]
      raise if line_offset.nil?

      absolute_offset = line_offset + (char_num - 1)

      content[absolute_offset]
    end

    def self.insert_text_at(content, line_offsets, line_num, char_num, text)
      # Insert text after where the cursor is
      # This helps due to syntax errors like `$facts[]` or `ensure =>`
      line_offset = line_offsets[line_num]
      raise if line_offset.nil?
      # Insert the text
      new_content = content.slice(0, line_offset + char_num) + text + content.slice(line_offset + char_num, content.length - 1)

      new_content
    end

    def self.line_offsets(content)
      # Calculate all of the offsets of \n in the file
      line_offsets = [0]
      line_offset = -1
      loop do
        line_offset = content.index("\n", line_offset + 1)
        break if line_offset.nil?
        line_offsets << line_offset + 1
      end
      line_offsets
    end

    def self.get_line_at(content, line_offsets, line_num)
      # Get the text of the designated line
      start_index = line_offsets[line_num]
      if line_offsets[line_num + 1].nil?
        content.slice(start_index, content.length - start_index)
      else
        content.slice(start_index, line_offsets[line_num + 1] - start_index - 1)
      end
    end

    def self.object_under_cursor(content, line_num, char_num, multiple_attempts = false, disallowed_classes = [])
      # Use Puppet to generate the AST
      parser = Puppet::Pops::Parser::Parser.new

      # Calculating the line offsets can be expensive and is only required
      # if we're doing mulitple passes of parsing
      line_offsets = line_offsets(content) if multiple_attempts

      result = nil
      move_offset = 0
      %i[noop remove_word try_quotes try_quotes_and_comma remove_char].each do |method|
        new_content = nil
        case method
        when :noop
          new_content = content
        when :remove_char
          new_content = remove_char_at(content, line_offsets, line_num, char_num)
          move_offset = -1
        when :remove_word
          next_char = get_char_at(content, line_offsets, line_num, char_num)

          while /[[:word:]]/ =~ next_char
            move_offset -= 1
            next_char = get_char_at(content, line_offsets, line_num, char_num + move_offset)

            break if char_num + move_offset < 0
          end

          new_content = remove_chars_starting_at(content, line_offsets, line_num, char_num, -move_offset)
        when :try_quotes
          # Perhaps try inserting double quotes.  Useful in empty arrays or during variable assignment
          # Grab the line up to the cursor character + 1
          line = get_line_at(content, line_offsets, line_num).slice!(0, char_num + 1)
          if line.strip.end_with?('=') || line.end_with?('[]')
            new_content = insert_text_at(content, line_offsets, line_num, char_num, "''")
          end
        when :try_quotes_and_comma
          # Perhaps try inserting double quotes with a comma.  Useful resource properties and parameter assignments
          # Grab the line up to the cursor character + 1
          line = get_line_at(content, line_offsets, line_num).slice!(0, char_num + 1)
          if line.strip.end_with?('=>')
            new_content = insert_text_at(content, line_offsets, line_num, char_num, "'',")
          end
        else
          raise("Unknown parsing method #{method}")
        end
        # if we have no content to parse, try the next method.
        next if new_content.nil?

        begin
          result = parser.parse_string(new_content, '')
          break
        rescue Puppet::ParseErrorWithIssue => _exception
          next if multiple_attempts
          raise
        end
      end
      raise('Unable to parse content') if result.nil?

      # Convert line and char nums (base 0) to an absolute offset
      #   result.line_offsets contains an array of the offsets on a per line basis e.g.
      #     [0, 14, 34, 36]  means line number 2 starts at absolute offset 34
      #   Once we know the line offset, we can simply add on the char_num to get the absolute offset
      #   If during paring we modified the source we may need to change the cursor location
      begin
        line_offset = result.line_offsets[line_num]
      rescue StandardError => _e
        line_offset = result['locator'].line_index[line_num]
      end
      # Typically we're completing after something was typed, so go back one char
      abs_offset = line_offset + char_num + move_offset - 1

      # Enumerate the AST looking for items that span the line/char we want.
      # Once we have all valid items, sort them by the smallest span.  Typically the smallest span
      # is the most specific object in the AST
      #
      # TODO: Should probably walk the AST and only look for the deepest child, but integer sorting
      #       is so much easier and faster.
      model_path_struct = Struct.new(:model, :path)
      valid_models = []
      if result.model.respond_to? :eAllContents
        valid_models = result.model.eAllContents.select do |item|
          check_for_valid_item(item, abs_offset, disallowed_classes)
        end

        valid_models.sort! { |a, b| a.length - b.length }
      else
        path = []
        result.model._pcore_all_contents(path) do |item|
          if check_for_valid_item(item, abs_offset, disallowed_classes)
            valid_models.push(model_path_struct.new(item, path.dup))
          end
        end

        valid_models.sort! { |a, b| a[:model].length - b[:model].length }
      end
      # nil means the root of the document
      return nil if valid_models.empty?
      item = valid_models[0]

      if item.respond_to? :eAllContents
        item = model_path_struct.new(item, construct_path(item))
      end

      item
    end

    def self.construct_path(item)
      path = []
      item = item.eContainer
      while item.class != Puppet::Pops::Model::Program
        path.unshift item
        item = item.eContainer
      end

      path
    end

    def self.check_for_valid_item(item, abs_offset, disallowed_classes)
      item.respond_to?(:offset) && !item.offset.nil? && !item.length.nil? && abs_offset >= item.offset && abs_offset <= item.offset + item.length && !disallowed_classes.include?(item.class)
    end

    # Reference - https://github.com/puppetlabs/puppet/blob/master/spec/lib/puppet_spec/compiler.rb
    def self.compile_to_catalog(string, node = Puppet::Node.new('test'))
      Puppet[:code] = string
      # see lib/puppet/indirector/catalog/compiler.rb#filter
      Puppet::Parser::Compiler.compile(node).filter(&:virtual?)
    end

    def self.compile_to_ral(manifest, node = Puppet::Node.new('test'))
      # Add the node facts if they don't already exist
      # TODO Still missing the $facts['..'] in the catalog.  Don't know why :-(
      node.merge(PuppetLanguageServer::FacterHelper.facts) if node.facts.nil?

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
