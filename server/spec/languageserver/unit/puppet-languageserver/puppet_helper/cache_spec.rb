require 'spec_helper'

describe 'PuppetLanguageServer::PuppetHelper::Cache' do
  let(:new_filename) { 'new_filename' }
  let(:new_section) { :type }

  let(:filename_existing) { 'abc123' }
  let(:section_existing) { :function }
  let(:object_existing1) { {:func1 => 'func1', :func2 => 'func2' } }
  let(:object_existing2) { {:func3 => 'func3', :func4 => 'func4' } }

  let(:subject) {
    obj = PuppetLanguageServer::PuppetHelper::Cache.new()
    obj.set(filename_existing, section_existing, object_existing1)
    obj.set('second_file', section_existing, object_existing2)
    obj
  }

  describe '#exist?' do
    it 'should return true for a file that exists in the cache' do
      expect(subject.exist?('abc123')).to be true
    end

    it 'should return true for a file that exists in the cache (case insensitive)' do
      expect(subject.exist?('aBc123')).to be true
    end

    it 'should return false for a file that exists in the cache' do
      expect(subject.exist?('does_not_exist')).to be false
    end

    it 'should return true for a file and section that exists in the cache' do
      expect(subject.exist?('abc123', :function)).to be true
    end

    it 'should return true for a file and section that exists in the cache (case insensitive)' do
      expect(subject.exist?('abC123', :function)).to be true
    end

    it 'should return false for a file that exists, but not the section, in the cache' do
      expect(subject.exist?('abc123', :doesnotexist)).to be false
    end
  end

  describe '#set' do
    before(:each) do
      # Arrange
      expect(subject.exist?(filename_existing)).to be true
      expect(subject.exist?(filename_existing, section_existing)).to be true
      expect(subject.exist?(new_filename)).to be false
    end

    it 'should add new filenames' do
      # Act
      expect(subject.set(new_filename, new_section, {})).to be true
      # Assert
      expect(subject.exist?(new_filename)).to be true
      expect(subject.exist?(new_filename, new_section)).to be true
    end

    it 'should add new sections to existing filenames' do
      # Arrange
      expect(subject.exist?(filename_existing, new_section)).to be false
      # Act
      expect(subject.set(filename_existing, new_section, {})).to be true
      # Assert
      expect(subject.exist?(filename_existing)).to be true
      expect(subject.exist?(filename_existing, section_existing)).to be true
      expect(subject.exist?(filename_existing, new_section)).to be true
    end

    it 'should overwrite sections in existing filenames' do
      # Arrange
      old_object = subject.get(filename_existing, section_existing)
      new_object = { :something => 'new'}
      # Act
      expect(subject.set(filename_existing, section_existing, new_object)).to be true
      # Assert
      expect(subject.get(filename_existing, section_existing)).to eq(new_object)
    end
  end

  describe '#get' do
    before(:each) do
      # Arrange
      expect(subject.exist?(filename_existing)).to be true
      expect(subject.exist?(filename_existing, section_existing)).to be true
    end

    it 'should get existing items from the cache' do
      expect(subject.get(filename_existing, section_existing)).to eq(object_existing1)
    end

    it 'should return nil for objects that do not exist' do
      expect(subject.get('does_not_exist', section_existing)).to be_nil
      expect(subject.get('does_not_exist', :doesnotexist)).to be_nil
    end
  end

  describe '#object_by_name' do
    it 'should get existing items from the cache' do
      expect(subject.object_by_name(section_existing, :func1)).to eq('func1')
    end

    it 'should return nil for objects that do not exist' do
      expect(subject.object_by_name(:doesnotexist, :func1)).to be_nil
      expect(subject.object_by_name(section_existing, :doesnotexist)).to be_nil
    end
  end


  describe '#object_names_by_section' do
    it 'should get existing items from the cache' do
      expect(subject.object_names_by_section(section_existing)).to eq([:func1, :func2, :func3, :func4])
    end

    it 'should return empty array for objects that do not exist' do
      expect(subject.object_names_by_section(:doesnotexist)).to eq([])
    end
  end

  describe '#objects_by_section' do
    it 'should get existing items from the cache' do
      result = []
      subject.objects_by_section(section_existing) { |_name, obj| result << obj }
      expect(result).to eq(['func1', 'func2', 'func3', 'func4'])
    end

    it 'should not yield for that do not exist' do
      result = []
      subject.objects_by_section(:doesnotexist) { |_name, obj| result << obj }
      expect(result).to eq([])
    end
  end
end
