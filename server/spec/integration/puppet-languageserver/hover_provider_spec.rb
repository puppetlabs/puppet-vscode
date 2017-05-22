require 'spec_helper'

describe 'hover_provider' do
  let(:subject) { PuppetLanguageServer::HoverProvider }
  let(:nil_response) { LanguageServer::Hover.create_nil_response }

  describe '#resolve' do
    let(:content) { <<-EOT
user { 'Bob':
  ensure => 'present',
  name   => 'name',
}

   # Leave this comment.  Needed for the leading whitespace

$test1 = $::operatingsystem
$test2 = $operatingsystem
$test3 = $facts['operatingsystem']

$string1 = 'v1:v2:v3:v4'
$array_var1 = split($string1, ':')

EOT
    }

    describe "Given a manifest which has syntax errors" do
      it "should raise an error" do
        expect{subject.resolve('user { "Bob"', 0, 1)}.to raise_error(RuntimeError)
      end
    end

    describe 'when cursor is in the root of the document' do
      let(:line_num) { 5 }
      let(:char_num) { 3 }

      it 'should return nil' do
        result = subject.resolve(content, line_num, char_num)

        expect(result).to eq(nil_response)
      end
    end

    context "Given a resource in the manifest" do
      let(:content) { <<-EOT
user { 'Bob':
  ensure => 'present',
  name   => 'name',
}
EOT
      }

      describe 'when cursor is on the resource type name' do
        let(:line_num) { 0 }
        let(:char_num) { 3 }

        it 'should return resource description' do
          result = subject.resolve(content, line_num, char_num)

          expect(result['contents']).to start_with("**user** Resource\n")
        end
      end

      describe 'when cursor is on the name of the resource' do
        let(:line_num) { 0 }
        let(:char_num) { 10 }

        it 'should return resource description' do
          pending('Not implemented')
          result = subject.resolve(content, line_num, char_num)

          expect(result['contents']).to start_with("**user** Resource\n")
        end
      end

      describe 'when cursor is on the whitespace before a property name' do
        let(:line_num) { 2 }
        let(:char_num) { 1 }

        it 'should return resource description' do
          pending('Not implemented')
          result = subject.resolve(content, line_num, char_num)

          expect(result['contents']).to start_with("**user** Resource\n")
        end
      end

      describe 'when cursor is on the property name' do
        let(:line_num) { 1 }
        let(:char_num) { 5 }

        it 'should return property description' do
          result = subject.resolve(content, line_num, char_num)

          expect(result['contents']).to start_with("**ensure** Property\n")
        end
      end

      describe 'when cursor is on the "=>" after a property name' do
        let(:line_num) { 1 }
        let(:char_num) { 10 }

        it 'should return property description' do
          result = subject.resolve(content, line_num, char_num)

          expect(result['contents']).to start_with("**ensure** Property\n")
        end
      end

      describe 'when cursor is on the parameter name' do
        let(:line_num) { 2 }
        let(:char_num) { 5 }

        it 'should return property description' do
          result = subject.resolve(content, line_num, char_num)

          expect(result['contents']).to start_with("**name** Parameter\n")
        end
      end

      describe 'when cursor is on the "=>" after a parameter name' do
        let(:line_num) { 2 }
        let(:char_num) { 10 }

        it 'should return property description' do
          result = subject.resolve(content, line_num, char_num)

          expect(result['contents']).to start_with("**name** Parameter\n")
        end
      end
    end

    context "Given a facts variable in the manifest" do
      let(:content) { <<-EOT
$test1 = $::operatingsystem
$test2 = $operatingsystem
$test3 = $facts['operatingsystem']
EOT
      }

      describe 'when cursor is on $::FACTNAME' do
        let(:line_num) { 0 }
        let(:char_num) { 16 }

        it 'should return fact information' do
          result = subject.resolve(content, line_num, char_num)

          expect(result['contents']).to start_with("**operatingsystem** Fact\n")
        end
      end

      describe 'when cursor is on $FACTNAME' do
        let(:line_num) { 1 }
        let(:char_num) { 16 }

        it 'should return fact information' do
          result = subject.resolve(content, line_num, char_num)

          expect(result['contents']).to start_with("**operatingsystem** Fact\n")
        end
      end

      describe 'when cursor is on $facts[FACTNAME]' do
        let(:line_num) { 2 }
        let(:char_num) { 12 }

        it 'should return fact information' do
          result = subject.resolve(content, line_num, char_num)

          expect(result['contents']).to start_with("**operatingsystem** Fact\n")
        end
      end

      describe 'when cursor is inside $facts[FACTNAME]' do
        let(:line_num) { 2 }
        let(:char_num) { 22 }

        it 'should return fact information' do
          pending('Not implemented')
          result = subject.resolve(content, line_num, char_num)

          expect(result['contents']).to start_with("**operatingsystem** Fact\n")
        end
      end
    end

    context "Given a function in the manifest" do
      let(:content) { <<-EOT
$string     = 'v1.v2:v3.v4'
$array_var1 = split($string, ':')
EOT
      }

      describe 'when cursor is on function name' do
        let(:line_num) { 1 }
        let(:char_num) { 17 }

        it 'should return function information' do
          result = subject.resolve(content, line_num, char_num)

          expect(result['contents']).to start_with("**split** Function\n")
        end
      end
    end
  end
end
