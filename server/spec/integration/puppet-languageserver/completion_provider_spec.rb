require 'spec_helper'

def number_of_completion_item_with_type(completion_list, typename)
  (completion_list['items'].select { |item| item['data']['type'] == typename}).length
end

describe 'completion_provider' do
  let(:subject) { PuppetLanguageServer::CompletionProvider }
  let(:nil_response) { LanguageServer::CompletionList.create_nil_response }

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
        let(:line_num) { 8 }
        let(:char_num) { 0 }
        let(:expected_types) { ['keyword','resource_type','function'] }

        it 'should return a list of keyword, resource_type, function' do
          result = subject.complete(content, line_num, char_num)

          result['items'].each do |item|
            expect(item).to be_completion_item_with_type(expected_types)
          end

          expected_types.each do |typename|
            expect(number_of_completion_item_with_type(result,typename)).to be > 0
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
end
