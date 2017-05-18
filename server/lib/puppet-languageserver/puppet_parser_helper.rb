module PuppetLanguageServer
  module PuppetParserHelper

    def self.remove_char_at(content, line_num, char_num)
      # TODO: Do we care about CRLF vs LF - I don't think so.
      line_offset = 0
      (1..line_num).each { |_x| line_offset = content.index("\n",line_offset + 1) unless line_offset.nil? }
      raise if line_offset.nil?

      # Remove the offending character
      new_content = content.slice(0,line_offset + char_num) + content.slice(line_offset + char_num + 1, content.length - 1)

      new_content
    end

    def self.object_under_cursor(content, line_num, char_num, multiple_attempts = false)
      # Use Puppet to generate the AST
      parser = Puppet::Pops::Parser::Parser.new()

      result = nil
      [:noop, :remove_char].each do |method|
        case method
          when :noop
            new_content = content
          when :remove_char
            new_content = remove_char_at(content, line_num, char_num)
          else
            raise("Unknown parsing method #{method}")
        end

        begin
          result = parser.parse_string(content, '')
        rescue Puppet::ParseErrorWithIssue => exception
          next if multiple_attempts
          raise
        end
      end
      raise("Unable to parse content") if result.nil?

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
  end
end
