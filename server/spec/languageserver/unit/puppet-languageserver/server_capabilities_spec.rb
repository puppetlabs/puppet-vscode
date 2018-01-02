require 'spec_helper'

describe 'server_capabilites' do
  describe '#capabilities' do
    it 'should return a hash' do
      expect(PuppetLanguageServer::ServerCapabilites.capabilities).to be_a(Hash)
    end
  end
end
