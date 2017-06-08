require 'spec_helper'

describe "version" do
  before :each do
    PuppetLanguageServer.instance_eval do
      @lang_server_version = nil if @lang_server_version
    end
  end

  context "without a VERSION file" do
    before :each do
      expect(PuppetLanguageServer).to receive(:read_version_file).and_return(nil)
    end

    it "is PuppetLanguageServer::PUPPETLANGUAGESERVERVERSION" do
      expect(PuppetLanguageServer.version).to eq(PuppetLanguageServer::PUPPETLANGUAGESERVERVERSION)
    end
  end

  context "with a VERSION file" do
    let (:file_version) { '1.2.3' }

    before :each do
      expect(PuppetLanguageServer).to receive(:read_version_file).with(/VERSION$/).and_return(file_version)
    end

    it "is the content of the file" do
      expect(PuppetLanguageServer.version).to eq(file_version)
    end
  end
end
