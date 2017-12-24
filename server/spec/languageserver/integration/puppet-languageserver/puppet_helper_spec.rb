require 'spec_helper'

describe 'puppet_helper' do
  let(:subject) { PuppetLanguageServer::PuppetHelper }

  # The concat function is loaded from the fixtures/cache/lib/puppet/parser/functions/concat.rb file
  # The bad_function function is loaded from the fixtures/cache/lib/puppet/parser/functions/badfunction.rb file
  # The bad_file function is loaded from the fixtures/cache/lib/puppet/parser/functions/badfile.rb file

  let(:good_function)       { 'concat' } # A valid function that works
  let(:bad_function)        { 'bad_function' } # A function that has an error inside the function code
  let(:unloadable_function) { 'bad_file' } # A function that cannot be loaded

  describe '#function_names' do
    it 'should list functions which do not error' do
      expect(subject.function_names).to include(good_function)
    end
    it 'should list functions which error inside the function code' do
      expect(subject.function_names).to include(bad_function)
    end
    it 'should not list functions which error during loading' do
      expect(subject.function_names).to_not include(unloadable_function)
    end
  end

  describe '#function' do
    it 'should get details about functions which do not error' do
      result = subject.function(good_function)

      expect(result).to include(:name)
      expect(result).to include(:type)
    end
    it 'should get details about functions which error inside the function code' do
      result = subject.function(bad_function)

      expect(result).to include(:name)
      expect(result).to include(:type)
    end
    it 'should not get details about functions which error during loading' do
      result = subject.function(unloadable_function)

      expect(result).to be_nil
    end
  end
end
