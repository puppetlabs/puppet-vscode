module PuppetLanguageServer
  module CompletionProvider
    def self.complete(content, line_num, char_num)
      items = []
      incomplete = false

      item = PuppetLanguageServer::PuppetParserHelper.object_under_cursor(content, line_num, char_num, true)

      if item.nil?
        # We are in the root of the document.

        # Add keywords
        ['class','define','application'].each do |keyword|
          items << LanguageServer::CompletionItem.create({
            'label'  => keyword,
            'kind'   => LanguageServer::COMPLETIONITEMKIND_KEYWORD,
            'detail' => 'Keyword',
            'data'   => { 'type' => 'keyword',
                          'name' => keyword,
                        },
          })
        end

        # Add resources
        PuppetLanguageServer::PuppetHelper.types.each do |pup_type|
          items << LanguageServer::CompletionItem.create({
            'label'  => pup_type,
            'kind'   => LanguageServer::COMPLETIONITEMKIND_MODULE,
            'detail' => 'Resource',
            'data'   => { 'type' => 'resource_type',
                          'name' => pup_type,
                        },
          })
        end

        return LanguageServer::CompletionList.create({
          'isIncomplete' => incomplete,
          'items'        => items,
        })
      end

      return LanguageServer::CompletionList.create_nil_response() if item.nil?

      case item.class.to_s
        when "Puppet::Pops::Model::VariableExpression"
          expr = item.expr.value

          # Complete for `$facts[...`
          if expr == 'facts'
            PuppetLanguageServer::FacterHelper.facts.each do |name,value|
              items << LanguageServer::CompletionItem.create({
                'label'      => "#{name}",
                'insertText' => "'#{name}'",
                'kind'       => LanguageServer::COMPLETIONITEMKIND_VARIABLE,
                'detail'     => 'Fact',
                'data'       => { 'type' => 'variable_expr_fact',
                                  'expr' => name,
                                },
              })
            end
          end

        when "Puppet::Pops::Model::HostClassDefinition"
          # We are in the root of a `class` statement

          # Add keywords
          ['require', 'contain'].each do |keyword|
            items << LanguageServer::CompletionItem.create({
              'label'  => keyword,
              'kind'   => LanguageServer::COMPLETIONITEMKIND_KEYWORD,
              'detail' => 'Keyword',
              'data'   => { 'type' => 'keyword',
                            'name' => keyword,
                          },
            })
          end

          # Add resources
          PuppetLanguageServer::PuppetHelper.types.each do |pup_type|
            items << LanguageServer::CompletionItem.create({
              'label'  => pup_type,
              'kind'   => LanguageServer::COMPLETIONITEMKIND_MODULE,
              'detail' => 'Resource',
              'data'   => { 'type' => 'resource_type',
                            'name' => pup_type,
                          },
            })
          end

        when "Puppet::Pops::Model::ResourceExpression"
          # We are inside a resource definition.  Should display all available
          # properities and parameters.

          # TODO: Should really cache all of the resources and params/props for quick
          # searching and then only actually instatiate when needed.  For the moment,
          # instantiate all the things!

          item_type = Puppet::Type.type(item.type_name.value)
          # Add Parameters
          item_type.parameters.each do |param|
            items << LanguageServer::CompletionItem.create({
              'label'  => param.to_s,
              'kind'   => LanguageServer::COMPLETIONITEMKIND_PROPERTY,
              'detail' => 'Parameter',
              'data'   => { 'type' => 'resource_parameter',
                            'param' => param.to_s,
                            'resource_type' => item.type_name.value,
                          },
            })
          end
          # Add Properties
          item_type.properties.each do |prop|
            items << LanguageServer::CompletionItem.create({
              'label'  => prop.name.to_s,
              'kind'   => LanguageServer::COMPLETIONITEMKIND_PROPERTY,
              'detail' => 'Property',
              'data'   => { 'type' => 'resource_property',
                           'prop' => prop.name.to_s,
                           'resource_type' => item.type_name.value,
                          },
            })
          end
      end

      LanguageServer::CompletionList.create({
        'isIncomplete' => incomplete,
        'items'        => items,
      })
    end

    def self.resolve(completion_item)
      data = completion_item['data'].clone
      case data['type']
        when 'variable_expr_fact'
          value = PuppetLanguageServer::FacterHelper.facts[data['expr']]
          # TODO: More things?
          completion_item['documentation'] = value.to_s

        when 'keyword'
          case data['name']
            when 'class'
              completion_item['documentation'] = 'Classes are named blocks of Puppet code that are stored in modules for later use and ' +
                                                 'are not applied until they are invoked by name. They can be added to a node’s catalog ' +
                                                 'by either declaring them in your manifests or assigning them from an ENC.'
              completion_item['insertText'] = "# Class: $1\n#\n#\nclass ${1:name} {\n\t${2:# resources}\n}$0"
              completion_item['insertTextFormat'] = LanguageServer::INSERTTEXTFORMAT_SNIPPET
            when 'define'
              completion_item['documentation'] = 'Defined resource types (also called defined types or defines) are blocks of Puppet code ' +
                                                 'that can be evaluated multiple times with different parameters. Once defined, they act ' +
                                                 'like a new resource type: you can cause the block to be evaluated by declaring a resource ' +
                                                 'of that new resource type.'
              completion_item['insertText'] = "define ${1:name} () {\n\t${2:# resources}\n}$0"
              completion_item['insertTextFormat'] = LanguageServer::INSERTTEXTFORMAT_SNIPPET
            when 'application'
              completion_item['detail'] = 'Orchestrator'
              completion_item['documentation'] = 'Application definitions are a lot like a defined resource type except that instead of defining ' +
                                                 'a chunk of reusable configuration that applies to a single node, the application definition ' +
                                                 'operates at a higher level. The components you declare inside an application can be individually '+
                                                 'assigned to separate nodes you manage with Puppet.'
              completion_item['insertText'] = "application ${1:name} () {\n\t${2:# resources}\n}$0"
              completion_item['insertTextFormat'] = LanguageServer::INSERTTEXTFORMAT_SNIPPET
            when 'site'
              completion_item['detail'] = 'Orchestrator'
              completion_item['documentation'] = 'Within the site block, applications are declared like defined types. They can be declared any ' +
                                                 'number of times, but their type and title combination must be unique within an environment.'
              completion_item['insertText'] = "site ${1:name} () {\n\t${2:# applications}\n}$0"
              completion_item['insertTextFormat'] = LanguageServer::INSERTTEXTFORMAT_SNIPPET
          end

        when 'resource_type'
          item_type = Puppet::Type.type(data['name'])
          # TODO: More things?
          completion_item['documentation'] = item_type.doc unless item_type.doc.nil?
          completion_item['insertText'] = "#{data['name']} { '${1:title}':\n\tensure => '${2:present}'\n},"
          completion_item['insertTextFormat'] = LanguageServer::INSERTTEXTFORMAT_SNIPPET
        when 'resource_parameter'
          item_type = Puppet::Type.type(data['resource_type'])
          param_type = item_type.attrclass(data['param'].intern)
          # TODO: More things?
          completion_item['documentation'] = param_type.doc unless param_type.doc.nil?
          completion_item['insertText'] = "#{data['param']} => "
        when 'resource_property'
          item_type = Puppet::Type.type(data['resource_type'])
          prop_type = item_type.attrclass(data['prop'].intern)
          # TODO: More things?
          completion_item['documentation'] = prop_type.doc unless prop_type.doc.nil?
          completion_item['insertText'] = "#{data['prop']} => "
      end

      LanguageServer::CompletionItem.create(completion_item)
    end
  end
end
