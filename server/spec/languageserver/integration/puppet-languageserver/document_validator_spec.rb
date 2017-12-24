require 'spec_helper'

describe 'document_validator' do
  let(:subject) { PuppetLanguageServer::DocumentValidator }

  describe '#validate' do
    describe "Given an incomplete manifest which has syntax errors" do
      let(:manifest) { 'user { "Bob"' }

      it "should return at least one error" do
        result = subject.validate(manifest, nil)
        expect(result.length).to be > 0
      end
    end

    describe "Given a complete manifest with no validation errors" do
      let(:manifest) { "user { 'Bob': ensure => 'present' }" }

      it "should return an empty array" do
        expect(subject.validate(manifest, nil)).to eq([])
      end
    end

    describe "Given a complete manifest with a single linting error" do
      let(:manifest) { "
        user { 'Bob':
          ensure  => 'present',
          comment => '123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
        }"
      }

      it "should return an array with one entry" do
        expect(subject.validate(manifest, nil).count).to eq(1)
      end

      it "should return an entry with linting error information" do
        lint_error = subject.validate(manifest, nil)[0]

        expect(lint_error['source']).to eq('Puppet')
        expect(lint_error['message']).to match('140')
        expect(lint_error['range']).to_not be_nil
        expect(lint_error['code']).to_not be_nil
        expect(lint_error['severity']).to_not be_nil
      end

      context "but disabled" do
        context "on a single line" do
          let(:manifest) { "
            user { 'Bob':
              ensure  => 'present',
              comment => '123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'   # lint:ignore:140chars
            }"
          }

          it "should return an empty array" do
            expect(subject.validate(manifest, nil)).to eq([])
          end
        end

        context "in a linting block" do
          let(:manifest) { "
            user { 'Bob':
              ensure  => 'present',
              # lint:ignore:140chars
              comment => '123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
              # lint:endignore
            }"
          }

          it "should return an empty array" do
            expect(subject.validate(manifest, nil)).to eq([])
          end
        end
      end
    end
  end
end
