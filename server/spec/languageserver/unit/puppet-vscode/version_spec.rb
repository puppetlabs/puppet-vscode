require 'spec_helper'
require 'puppet-vscode'

describe "version" do
  before :each do
    PuppetVSCode.instance_eval do
      @lang_server_version = nil if @lang_server_version
    end
  end

  context "without a VERSION file" do
    before :each do
      expect(PuppetVSCode).to receive(:read_version_file).and_return(nil)
    end

    it "is PuppetVSCode::PUPPETVSCODEVERSION" do
      expect(PuppetVSCode.version).to eq(PuppetVSCode::PUPPETVSCODEVERSION)
    end
  end

  context "with a VERSION file" do
    let (:file_version) { '1.2.3' }

    before :each do
      expect(PuppetVSCode).to receive(:read_version_file).with(/VERSION$/).and_return(file_version)
    end

    it "is the content of the file" do
      expect(PuppetVSCode.version).to eq(file_version)
    end
  end
end
