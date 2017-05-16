module PuppetLanguageServer
  module CompletionProvider
    def self.complete(content, line_num, char_num)
      items = []
      incomplete = false

      item = PuppetLanguageServer::PuppetParserHelper.object_under_cursor(content, line_num, char_num, true)
      return LanguageServer::CompletionList.create_nil_response() if item.nil?

      case item.class.to_s
        when "Puppet::Pops::Model::VariableExpression"
          expr = item.expr.value

          if expr == 'facts'
            PuppetLanguageServer::FacterHelper.facts.each do |name,value|
              items << LanguageServer::CompletionItem.create({
                'label' => "'#{name}'",
                'kind'  => LanguageServer::COMPLETIONITEMKIND_VARIABLE,
                'detail' => 'Fact',
                'data'  => { 'type' => 'variable_expr_fact',
                             'expr' => name,
                          },
              })
            end
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
              'label' => param.to_s,
              'kind'  => LanguageServer::COMPLETIONITEMKIND_PROPERTY,
              'detail' => 'Parameter',
              'data'  => { 'type' => 'resource_parameter',
                           'param' => param.to_s,
                           'resource_type' => item.type_name.value,
                         },
            })
          end
          # Add Properties
          item_type.properties.each do |prop|
            items << LanguageServer::CompletionItem.create({
              'label' => prop.name.to_s,
              'kind'  => LanguageServer::COMPLETIONITEMKIND_PROPERTY,
              'detail' => 'Property',
              'data'  => { 'type' => 'resource_property',
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
          completion_item['insertText'] = "'#{data['expr']}'"

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
