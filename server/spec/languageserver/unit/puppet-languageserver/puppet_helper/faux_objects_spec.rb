require 'spec_helper'

describe 'PuppetLanguageServer::PuppetHelper::FauxObjects' do

  shared_examples_for 'a base Faux object' do
    [:key, :calling_source, :source, :line, :char, :length, :from_puppet!, :to_json].each do |testcase|
      it "instance should respond to #{testcase}" do
        expect(subject).to respond_to(testcase)
      end
    end

    [:json_create].each do |testcase|
      it "class should respond to #{testcase}" do
        expect(subject.class).to respond_to(testcase)
      end
    end

  end

  describe 'FauxFunction' do
    let(:subject) { PuppetLanguageServer::PuppetHelper::FauxFunction.new }

    let(:puppet_funcname) { :rspec_function }
    let(:puppet_func) {
      {
        :doc             => 'function documentation',
        :arity           => 0,
        :type            => :statement,
        :source_location => {
          :source => 'source',
          :line   => 1,
        }
      }
    }

    it_should_behave_like 'a base Faux object'

    [:doc, :arity, :type].each do |testcase|
      it "instance should respond to #{testcase}" do
        expect(subject).to respond_to(testcase)
      end
    end

    describe '#from_puppet!' do
      it 'should populate from a Puppet function object' do
        subject.from_puppet!(puppet_funcname, puppet_func)

        expect(subject.key).to eq(puppet_funcname)
        expect(subject.source).to_not be_nil
        expect(subject.calling_source).to_not be_nil
        expect(subject.line).to_not be_nil
        expect(subject.doc).to_not be_nil
        expect(subject.arity).to_not be_nil
        expect(subject.type).to_not be_nil
      end
    end

    describe '#to_json' do
      it 'should serialize to json' do
        subject.from_puppet!(puppet_funcname, puppet_func)
        serial = subject.to_json

        expect(serial).to be_a(String)
      end
    end

    describe '#json_create' do
      it 'should deserialize FauxFunction' do
        subject.from_puppet!(puppet_funcname, puppet_func)
        serial = subject.to_json
        deserial = PuppetLanguageServer::PuppetHelper::FauxFunction.json_create(JSON.parse(serial))

        expect(deserial).to be_a(PuppetLanguageServer::PuppetHelper::FauxFunction)
      end

      [:key, :calling_source, :source, :line, :char, :length, :doc, :arity, :type].each do |testcase|
        it "should deserialize a serialized #{testcase} value" do
          subject.from_puppet!(puppet_funcname, puppet_func)
          serial = subject.to_json
          deserial = PuppetLanguageServer::PuppetHelper::FauxFunction.json_create(JSON.parse(serial))

          expect(deserial.send(testcase)).to eq(subject.send(testcase))
        end
      end
    end
  end

  describe 'FauxType' do
    let(:subject) { PuppetLanguageServer::PuppetHelper::FauxType.new }

    let(:puppet_typename) { :rspec_class }
    let(:puppet_type) {
      # Get a real puppet type
      Puppet::Type.type(:user)
    }

    it_should_behave_like 'a base Faux object'

    [:doc, :attributes, :allattrs, :parameters, :properties, :meta_parameters].each do |testcase|
      it "instance should respond to #{testcase}" do
        expect(subject).to respond_to(testcase)
      end
    end

    describe '#from_puppet!' do
      it 'should populate from a Puppet class object' do
        subject.from_puppet!(puppet_typename, puppet_type)

        expect(subject.key).to eq(puppet_typename)
        expect(subject.source).to_not be_nil
        expect(subject.calling_source).to_not be_nil
        expect(subject.line).to_not be_nil
      end
    end

    describe '#to_json' do
      it 'should serialize to json' do
        subject.from_puppet!(puppet_typename, puppet_type)
        serial = subject.to_json

        expect(serial).to be_a(String)
      end
    end

    describe '#json_create' do
      it 'should deserialize FauxType' do
        subject.from_puppet!(puppet_typename, puppet_type)
        serial = subject.to_json
        deserial = PuppetLanguageServer::PuppetHelper::FauxType.json_create(JSON.parse(serial))

        expect(deserial).to be_a(PuppetLanguageServer::PuppetHelper::FauxType)
      end

      [:doc, :attributes, :allattrs, :parameters, :properties, :meta_parameters, :key, :calling_source, :source, :line, :char, :length].each do |testcase|
        it "should deserialize a serialized #{testcase} value" do
          subject.from_puppet!(puppet_typename, puppet_type)
          serial = subject.to_json
          deserial = PuppetLanguageServer::PuppetHelper::FauxType.json_create(JSON.parse(serial))

          expect(deserial.send(testcase)).to eq(subject.send(testcase))
        end
      end
    end
  end

  describe 'FauxPuppetClass' do
    let(:subject) { PuppetLanguageServer::PuppetHelper::FauxPuppetClass.new }

    let(:puppet_classname) { :rspec_class }
    let(:puppet_class) {
      {
        'source' => 'source',
        'line'   => 1,
        'char'   => 1,
      }
    }

    it_should_behave_like 'a base Faux object'

    # No additional methods to test
    # [:doc].each do |testcase|
    #   it "instance should respond to #{testcase}" do
    #     expect(subject).to respond_to(testcase)
    #   end
    # end

    describe '#from_puppet!' do
      it 'should populate from a Puppet class object' do
        subject.from_puppet!(puppet_classname, puppet_class)

        expect(subject.key).to eq(puppet_classname)
        expect(subject.source).to_not be_nil
        expect(subject.calling_source).to_not be_nil
        expect(subject.line).to_not be_nil
        expect(subject.char).to_not be_nil
      end
    end

    describe '#to_json' do
      it 'should serialize to json' do
        subject.from_puppet!(puppet_classname, puppet_class)
        serial = subject.to_json

        expect(serial).to be_a(String)
      end
    end

    describe '#json_create' do
      it 'should deserialize FauxFunction' do
        subject.from_puppet!(puppet_classname, puppet_class)
        serial = subject.to_json
        deserial = PuppetLanguageServer::PuppetHelper::FauxPuppetClass.json_create(JSON.parse(serial))

        expect(deserial).to be_a(PuppetLanguageServer::PuppetHelper::FauxPuppetClass)
      end

      [:key, :calling_source, :source, :line, :char, :length].each do |testcase|
        it "should deserialize a serialized #{testcase} value" do
          subject.from_puppet!(puppet_classname, puppet_class)
          serial = subject.to_json
          deserial = PuppetLanguageServer::PuppetHelper::FauxPuppetClass.json_create(JSON.parse(serial))

          expect(deserial.send(testcase)).to eq(subject.send(testcase))
        end
      end
    end
  end
end
