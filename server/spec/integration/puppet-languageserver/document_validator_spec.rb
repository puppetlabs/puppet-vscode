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

  end
end
