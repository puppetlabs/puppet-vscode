require 'spec_helper'

RSpec.shared_examples "a single definition result" do |filename_regex|
  it "should return a single definition result which matches #{filename_regex.to_s}" do
    result = subject.find_definition(content, line_num, char_num)

    expect(result).to be_a(Array)
    expect(result.count).to eq(1)
    expect(result[0]['uri']).to match(filename_regex)
    expect(result[0]['range']['start']['line']).to_not be_nil
    expect(result[0]['range']['start']['character']).to_not be_nil
    expect(result[0]['range']['end']['line']).to_not be_nil
    expect(result[0]['range']['end']['character']).to_not be_nil
  end
end

describe 'definition_provider' do
  let(:subject) { PuppetLanguageServer::DefinitionProvider }

  describe '#find_defintion' do
    before(:all) do
      # Ensure the functions are loaded so that defintion information is available
      PuppetLanguageServer::PuppetHelper.load_functions unless PuppetLanguageServer::PuppetHelper.functions_loaded?

      # Ensure the types are loaded so that defintion information is available
      PuppetLanguageServer::PuppetHelper.load_types unless PuppetLanguageServer::PuppetHelper.types_loaded?

      # Ensure the classes are loaded so that defintion information is available
      PuppetLanguageServer::PuppetHelper.load_classes unless PuppetLanguageServer::PuppetHelper.classes_loaded?
    end

    context 'When cursor is on a function name' do
      let(:content) { <<-EOT
class Test::NoParams {
  alert('This is an alert message')
}
EOT
      }
      let(:line_num) { 1 }
      let(:char_num) { 5 }

      it_should_behave_like "a single definition result", /functions\.rb/
    end

    context 'When cursor is on a custom puppet type' do
      let(:content) { <<-EOT
class Test::NoParams {
  user { 'foo':
    ensure => 'present',
    name   => 'name',
  }
}
EOT
      }
      let(:line_num) { 1 }
      let(:char_num) { 5 }

      it_should_behave_like "a single definition result", /user\.rb/
    end

    context 'When cursor is on a puppet class' do
      let(:content) { <<-EOT
class Test::NoParams {
  class { 'testclasses':
    ensure => 'present',
  }
}
EOT
      }
      let(:line_num) { 1 }
      let(:char_num) { 13 }

      it_should_behave_like "a single definition result", /init\.pp/
    end

    context 'When cursor is on a root puppet class' do
      let(:content) { <<-EOT
class Test::NoParams {
  class { '::testclasses':
    ensure => 'present',
  }
}
EOT
      }
      let(:line_num) { 1 }
      let(:char_num) { 13 }

      it_should_behave_like "a single definition result", /init\.pp/
    end

    context 'When cursor is on a fully qualified puppet class' do
      let(:content) { <<-EOT
class Test::NoParams {
  class { 'testclasses::nestedclass':
    ensure => 'present',
  }
}
EOT
      }
      let(:line_num) { 1 }
      let(:char_num) { 13 }

      it_should_behave_like "a single definition result", /nestedclass\.pp/
    end

    context 'When cursor is on a defined type' do
      let(:content) { <<-EOT
class Test::NoParams {
  deftypeone { 'foo':
    ensure => 'present',
  }
}
EOT
      }
      let(:line_num) { 1 }
      let(:char_num) { 5 }

      it_should_behave_like "a single definition result", /deftypeone\.pp/
    end

    context 'When cursor is on a puppet class' do
      let(:content) { <<-EOT
class Test::NoParams {
  puppetclassone { 'foo':
    ensure => 'present',
  }
}
EOT
      }
      let(:line_num) { 1 }
      let(:char_num) { 5 }

      it_should_behave_like "a single definition result", /puppetclassone\.pp/
    end

    context 'When cursor is on a classname for an include statement' do
      let(:content) { <<-EOT
class Test::NoParams {
  include puppetclassone
}
EOT
      }
      let(:line_num) { 1 }
      let(:char_num) { 14 }

      it_should_behave_like "a single definition result", /puppetclassone\.pp/
    end

    context 'When cursor is on a fully qualified classname for an include statement' do
      let(:content) { <<-EOT
class Test::NoParams {
  include testclasses::nestedclass
}
EOT
      }
      let(:line_num) { 1 }
      let(:char_num) { 14 }

      it_should_behave_like "a single definition result", /nestedclass\.pp/
    end

    context 'When cursor is on a root classname for an include statement' do
      let(:content) { <<-EOT
class Test::NoParams {
  include ::puppetclassone
}
EOT
      }
      let(:line_num) { 1 }
      let(:char_num) { 14 }

      it_should_behave_like "a single definition result", /puppetclassone\.pp/
    end

    context 'When cursor is on a function name for an include statement' do
      let(:content) { <<-EOT
class Test::NoParams {
  include puppetclassone
}
EOT
      }
      let(:line_num) { 1 }
      let(:char_num) { 5 }

      it_should_behave_like "a single definition result", /include\.rb/
    end

  end
end
