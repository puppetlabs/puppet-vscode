require 'spec_helper'

def number_of_completion_item_with_type(completion_list, typename)
  (completion_list['items'].select { |item| item['data']['type'] == typename}).length
end

describe 'completion_provider' do
  let(:subject) { PuppetLanguageServer::CompletionProvider }
  let(:nil_response) { LanguageServer::CompletionList.create_nil_response }

  before(:all) do
    wait_for_puppet_loading
  end

  describe '#complete' do
    describe "Given an incomplete manifest which has syntax errors" do
      it "should raise an error" do
        expect{subject.complete('user { "Bob"', 0, 1)}.to raise_error(RuntimeError)
      end
    end

    context "Given a simple valid manifest" do
      let(:content) { <<-EOT
class Alice {

  user { 'Bob':
    ensure => 'present',
    name   => 'name',
  }
}

  # Needed

user { 'Charlie':

  ensure => 'present',
  name   => 'name',
}
EOT
      }

      describe "When inside the root of the manifest" do
        let(:char_num) { 0 }
        let(:expected_types) { ['keyword','resource_type','function'] }

        [0, 8].each do |line_num|
          it "should return a list of keyword, resource_type, function regardless of cursor location (Testing line #{line_num})" do
            result = subject.complete(content, line_num, char_num)

            result['items'].each do |item|
              expect(item).to be_completion_item_with_type(expected_types)
            end

            expected_types.each do |typename|
              expect(number_of_completion_item_with_type(result,typename)).to be > 0
            end
          end
        end
      end

      describe "When inside the root of a class" do
        let(:line_num) { 1 }
        let(:char_num) { 0 }
        let(:expected_types) { ['keyword','resource_type'] }

        it 'should return a list of keyword, resource_type' do
          result = subject.complete(content, line_num, char_num)

          result['items'].each do |item|
            expect(item).to be_completion_item_with_type(expected_types)
          end

          expected_types.each do |typename|
            expect(number_of_completion_item_with_type(result,typename)).to be > 0
          end
        end
      end

      describe "When inside the root of a resource" do
        let(:line_num) { 11 }
        let(:char_num) { 0 }
        let(:expected_types) { ['resource_parameter','resource_property'] }

        it 'should return a list of resource_parameter, resource_property' do
          result = subject.complete(content, line_num, char_num)

          result['items'].each do |item|
            expect(item).to be_completion_item_with_type(expected_types)
          end

          expected_types.each do |typename|
            expect(number_of_completion_item_with_type(result,typename)).to be > 0
          end
        end
      end
    end

    context "Given a simple manifest mid-typing" do
      let(:content_empty) { <<-EOT
c
EOT
      }

      let(:content_simple) { <<-EOT
user { 'Charlie':

  ensure => 'present',
  name   => 'name',
}

r
EOT
      }

      describe "When typing inside the root of an empty manifest" do
        let(:line_num) { 0 }
        let(:char_num) { 1 }
        let(:expected_types) { ['keyword','resource_type','function'] }

        it "should return a list of keyword, resource_type, function" do
          result = subject.complete(content_empty, line_num, char_num)

          result['items'].each do |item|
            expect(item).to be_completion_item_with_type(expected_types)
          end

          expected_types.each do |typename|
            expect(number_of_completion_item_with_type(result,typename)).to be > 0
          end
        end
      end

      describe "When typing inside the root of a non-empty manifest" do
        let(:line_num) { 6 }
        let(:char_num) { 1 }
        let(:expected_types) { ['keyword','resource_type','function'] }

        it "should return a list of keyword, resource_type, function" do
          result = subject.complete(content_simple, line_num, char_num)

          result['items'].each do |item|
            expect(item).to be_completion_item_with_type(expected_types)
          end

          expected_types.each do |typename|
            expect(number_of_completion_item_with_type(result,typename)).to be > 0
          end
        end
      end
    end

    context '$facts variable' do
      describe "With newlines at the beginning of the document and inside the brackets of $facts" do
        let(:content) { <<-EOT

# Newlines are need above to test if parsing is ok.
$test1 = $::operatingsystem
$test2 = $operatingsystem
$test3 = $facts[]
EOT
        }
        let(:line_num) { 4 }
        let(:char_num) { 16 }

        it 'should return a list of facts' do
          result = subject.complete(content, line_num, char_num)

          result['items'].each do |item|
            expect(item).to be_completion_item_with_type('variable_expr_fact')
          end
        end
      end

      describe "When inside the brackets of $facts" do
        let(:content) { <<-EOT
$test1 = $::operatingsystem
$test2 = $operatingsystem
$test3 = $facts[]
EOT
        }
        let(:line_num) { 2 }
        let(:char_num) { 16 }

        it 'should return a list of facts' do
          result = subject.complete(content, line_num, char_num)

          result['items'].each do |item|
            expect(item).to be_completion_item_with_type('variable_expr_fact')
          end
        end
      end

      describe "When inside the start brackets of $facts" do
        let(:content) { <<-EOT
$test1 = $::operatingsystem
$test2 = $operatingsystem
$test3 = $facts[
EOT
        }
        let(:line_num) { 2 }
        let(:char_num) { 16 }

        it 'should return a list of facts' do
          result = subject.complete(content, line_num, char_num)

          result['items'].each do |item|
            expect(item).to be_completion_item_with_type('variable_expr_fact')
          end
        end
      end
    end
  end

  describe '#resolve' do
    it 'should return the original request if it is not understood' do
      resolve_request = {
        'label'  => 'spec-test-label',
        'kind'   => LanguageServer::COMPLETIONITEMKIND_TEXT,
        'detail' => 'spec-test-detail',
        'data'   => { 'type' => 'unknown_type' }
      }

      result = subject.resolve(resolve_request)
      expect(result).to eq(resolve_request)
    end

    context 'when resolving a variable_expr_fact request' do
      let(:content) { <<-EOT
  $test = $facts[
EOT
      }
      let(:line_num) { 0 }
      let(:char_num) { 17 }

      before(:each) do
        # Generate the resolution request based on a completion response
        @completion_response = subject.complete(content, line_num, char_num)
      end

      context 'for a well known fact (operatingsystem)' do
        before(:each) do
          @resolve_request = @completion_response["items"].find do |item|
            item["label"] == 'operatingsystem' && item["kind"] == LanguageServer::COMPLETIONITEMKIND_VARIABLE
          end
          raise RuntimeError, "operatingsystem fact could not be found" if @resolve_request.nil?
        end

        it 'should return the fact value' do
          result = subject.resolve(@resolve_request)
          expect(result['documentation']).to eq(Facter.fact('operatingsystem').value)
        end
      end

      context 'for a fact that does not exist' do
        it 'should return empty string' do
          resolve_request = {
            'label'  => 'spec-test-label',
            'kind'   => LanguageServer::COMPLETIONITEMKIND_TEXT,
            'detail' => 'spec-test-detail',
            'data'   => { 'type' => 'variable_expr_fact', 'expr' => 'I_dont_exist'}
          }

          result = subject.resolve(resolve_request)

          expect(result['documentation']).to eq('')
        end
      end
    end

    context 'when resolving a keyword request' do
      let(:content) { <<-EOT
        class Alice {
        }
      EOT
      }
      let(:line_num) { 0 }
      let(:char_num) { 0 }

      before(:each) do
        # Generate the resolution request based on a completion response
        @completion_response = subject.complete(content, line_num, char_num)
      end

      %w[class define].each do |testcase|
        context "for #{testcase}" do
          before(:each) do
            @resolve_request = @completion_response["items"].find do |item|
              item["label"] == testcase && item["kind"] == LanguageServer::COMPLETIONITEMKIND_KEYWORD
            end
            raise RuntimeError, "A #{testcase} keyword response could not be found" if @resolve_request.nil?
          end

          it 'should return the documentation' do
            result = subject.resolve(@resolve_request)
            expect(result['documentation']).to match(/.+/)
          end

          it 'should return a text snippet' do
            result = subject.resolve(@resolve_request)
            expect(result['insertText']).to match(/.+/)
            expect(result['insertTextFormat']).to eq(LanguageServer::INSERTTEXTFORMAT_SNIPPET)
          end
        end
      end

      %w[application site].each do |testcase|
        context "for #{testcase}" do
          before(:each) do
            @resolve_request = @completion_response["items"].find do |item|
              item["label"] == testcase && item["kind"] == LanguageServer::COMPLETIONITEMKIND_KEYWORD
            end
            raise RuntimeError, "A #{testcase} keyword response could not be found" if @resolve_request.nil?
          end

          it 'should return the documentation' do
            result = subject.resolve(@resolve_request)
            expect(result['documentation']).to match(/.+/)
          end

          it 'should return Orchestrator detail' do
            result = subject.resolve(@resolve_request)
            expect(result['detail']).to eq('Orchestrator')
          end

          it 'should return a text snippet' do
            result = subject.resolve(@resolve_request)
            expect(result['insertText']).to match(/.+/)
            expect(result['insertTextFormat']).to eq(LanguageServer::INSERTTEXTFORMAT_SNIPPET)
          end
        end
      end
    end

    context 'when resolving a function request' do
      let(:content) { <<-EOT
        class Alice {
        }
      EOT
      }
      let(:line_num) { 0 }
      let(:char_num) { 0 }

      before(:each) do
        # Generate the resolution request based on a completion response
        @completion_response = subject.complete(content, line_num, char_num)
      end

      context 'for a well known function (alert)' do
        before(:each) do
          @resolve_request = @completion_response["items"].find do |item|
            item["label"] == 'alert' && item["kind"] == LanguageServer::COMPLETIONITEMKIND_FUNCTION
          end
          raise RuntimeError, "alert function could not be found" if @resolve_request.nil?
        end

        it 'should return the documentation' do
          result = subject.resolve(@resolve_request)
          expect(result['documentation']).to match(/.+/)
        end

        it 'should return a text snippet' do
          result = subject.resolve(@resolve_request)
          expect(result['insertText']).to match(/.+/)
          expect(result['insertTextFormat']).to eq(LanguageServer::INSERTTEXTFORMAT_SNIPPET)
        end
      end
    end

    context 'when resolving a resource_type request' do
      let(:content) { <<-EOT
        class Alice {
        }
      EOT
      }
      let(:line_num) { 0 }
      let(:char_num) { 0 }

      before(:each) do
        # Generate the resolution request based on a completion response
        @completion_response = subject.complete(content, line_num, char_num)
      end

      context 'for a well known puppet type (user)' do
        before(:each) do
          @resolve_request = @completion_response["items"].find do |item|
            item["label"] == 'user' && item["kind"] == LanguageServer::COMPLETIONITEMKIND_MODULE
          end
          raise RuntimeError, "user type could not be found" if @resolve_request.nil?
        end

        it 'should return the documentation' do
          result = subject.resolve(@resolve_request)
          expect(result['documentation']).to match(/.+/)
        end

        it 'should return a text snippet' do
          result = subject.resolve(@resolve_request)
          expect(result['insertText']).to match(/.+/)
          expect(result['insertTextFormat']).to eq(LanguageServer::INSERTTEXTFORMAT_SNIPPET)
        end
      end
    end

    context 'when resolving a resource_parameter request' do
      let(:content) { <<-EOT
        user { 'Alice':

        }
      EOT
      }
      let(:line_num) { 1 }
      let(:char_num) { 0 }

      before(:each) do
        # Generate the resolution request based on a completion response
        @completion_response = subject.complete(content, line_num, char_num)
      end

      context 'for the name parameter of a well known puppet type (user)' do
        before(:each) do
          @resolve_request = @completion_response["items"].find do |item|
            item["label"] == 'name' && item["kind"] == LanguageServer::COMPLETIONITEMKIND_PROPERTY
          end
          raise RuntimeError, "name parameter could not be found" if @resolve_request.nil?
        end

        it 'should return the documentation' do
          result = subject.resolve(@resolve_request)
          expect(result['documentation']).to match(/.+/)
        end

        it 'should return a text literal with the parameter defintion' do
          result = subject.resolve(@resolve_request)
          expect(result['insertText']).to match(/.+ => /)
          expect(result['insertTextFormat']).to be_nil
        end
      end
    end

    context 'when resolving a resource_property request' do
      let(:content) { <<-EOT
        user { 'Alice':

        }
      EOT
      }
      let(:line_num) { 1 }
      let(:char_num) { 0 }

      before(:each) do
        # Generate the resolution request based on a completion response
        @completion_response = subject.complete(content, line_num, char_num)
      end

      context 'for the ensure property of a well known puppet type (user)' do
        before(:each) do
          @resolve_request = @completion_response["items"].find do |item|
            item["label"] == 'ensure' && item["kind"] == LanguageServer::COMPLETIONITEMKIND_PROPERTY
          end
          raise RuntimeError, "ensure property could not be found" if @resolve_request.nil?
        end

        it 'should return the documentation' do
          result = subject.resolve(@resolve_request)
          expect(result['documentation']).to match(/.+/)
        end

        it 'should return a text literal with the property defintion' do
          result = subject.resolve(@resolve_request)
          expect(result['insertText']).to match(/.+ => /)
          expect(result['insertTextFormat']).to be_nil
        end
      end
    end
  end
end
