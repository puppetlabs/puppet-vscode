require 'spec_helper'

describe 'document_validator' do
  let(:subject) { PuppetLanguageServer::DocumentValidator }

  describe '#fix_validate_errors' do
    describe "Given an incomplete manifest which has syntax errors but no lint errors" do
      let(:manifest) { 'user { \'Bob\'' }

      it "should return no changes" do
        problems_fixed, new_content = subject.fix_validate_errors(manifest, nil)
        expect(problems_fixed).to eq(0)
        expect(new_content).to eq(manifest)
      end
    end

    describe "Given a complete manifest which has a single fixable lint errors" do
      let(:manifest) { "
        user { \"Bob\":
          ensure => 'present'
        }"
      }
      let(:new_manifest) { "
        user { 'Bob':
          ensure => 'present'
        }"
      }

      it "should return changes" do
        problems_fixed, new_content = subject.fix_validate_errors(manifest, nil)
        expect(problems_fixed).to eq(1)
        expect(new_content).to eq(new_manifest)
      end
    end

    describe "Given a complete manifest which has multiple fixable lint errors" do
      let(:manifest) { "
        // bad comment
        user { \"Bob\":
          name => 'username',
          ensure => 'present'
        }"
      }
      let(:new_manifest) { "
        # bad comment
        user { 'Bob':
          name   => 'username',
          ensure => 'present'
        }"
      }

      it "should return changes" do
        problems_fixed, new_content = subject.fix_validate_errors(manifest, nil)
        expect(problems_fixed).to eq(3)
        expect(new_content).to eq(new_manifest)
      end
    end


    describe "Given a complete manifest which has unfixable lint errors" do
      let(:manifest) { "
        user { 'Bob':
          name   => 'name',
          ensure => 'present'
        }"
      }

      it "should return no changes" do
        problems_fixed, new_content = subject.fix_validate_errors(manifest, nil)
        expect(problems_fixed).to eq(0)
        expect(new_content).to eq(manifest)
      end
    end

    describe "Given a complete manifest with CRLF which has fixable lint errors" do
      let(:manifest)     { "user { \"Bob\":\r\nensure  => 'present'\r\n}" }
      let(:new_manifest) { "user { 'Bob':\r\nensure  => 'present'\r\n}" }

      it "should preserve CRLF" do
        pending('Release of https://github.com/rodjek/puppet-lint/commit/2a850ab3fd3694a4dd0c4d2f22a1e60b9ca0a495')
        problems_fixed, new_content = subject.fix_validate_errors(manifest, nil)
        expect(problems_fixed).to eq(1)
        expect(new_content).to eq(new_manifest)
      end
    end

    describe "Given a complete manifest which has disabed fixable lint errors" do
      let(:manifest) { "
        user { \"Bob\": # lint:ignore:double_quoted_strings
          ensure  => 'present'
        }"
      }

      it "should return no changes" do
        problems_fixed, new_content = subject.fix_validate_errors(manifest, nil)
        expect(problems_fixed).to eq(0)
        expect(new_content).to eq(manifest)
      end
    end
  end

  describe '#valide_epp' do
    describe "Given an EPP which has a syntax error" do
      let(:template) { '<%- String $tmp
      | -%>

      <%= $tmp %>' }

      it "should return a single syntax error" do
        result = subject.validate_epp(template, nil)
        expect(result.length).to be > 0
        expect(result[0]['range']['start']['line']).to eq(1)
        expect(result[0]['range']['start']['character']).to eq(7)
        expect(result[0]['range']['end']['line']).to eq(1)
        expect(result[0]['range']['end']['character']).to eq(8)
      end
    end

    describe "Given a complete EPP which has no syntax errors" do
      let(:template) { '<%- | String $tmp
      | -%>

      <%= $tmp %>' }

      it "should return an empty array" do
        expect(subject.validate_epp(template, nil)).to eq([])
      end
    end
  end

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
