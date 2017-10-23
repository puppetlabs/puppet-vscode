require 'spec_helper'

describe 'message_router' do
  let(:subject_options) { nil }
  let(:subject) { PuppetLanguageServer::MessageRouter.new(subject_options) }

  describe '#receive_request' do
    let(:documents) {{
      'file1.rb' => "file1_line1\nfile1_line2\nfile1_line3\nfile1_line4\n"
    }}
    let(:request_connection) { MockJSONRPCHandler.new() }
    let(:request_rpc_method) { nil }
    let(:request_params) { { 'crashparam1' => 'crashvalue1'} }
    let(:request_id) { 0 }
    let(:request) { PuppetLanguageServer::JSONRPCHandler::Request.new(
      request_connection,request_id,request_rpc_method,request_params) }

    before(:each) do
      allow(PuppetLanguageServer).to receive(:log_message)

      # Populate the document cache
      PuppetLanguageServer::DocumentStore.clear
      documents.each { |uri, content| PuppetLanguageServer::DocumentStore.set_document(uri, content) }
    end

    context 'given a request that raises an error' do
      let(:request_rpc_method) { 'puppet/getVersion' }
      before(:each) do
        @default_crash_file = PuppetLanguageServer::CrashDump.default_crash_file
        File.delete(@default_crash_file) if File.exists?(@default_crash_file)

        expect(Puppet).to receive(:version).at_least(:once).and_raise('MockError')
      end

      it 'should create a default crash dump file' do
        begin
          subject.receive_request(request)
        rescue
        end

        expect(File.exists?(@default_crash_file)).to be(true)
      end

      context 'the content of the crash dump file' do
        before(:each) do
          # Force a crash dump to occur
          begin
            subject.receive_request(request)
          rescue
          end
          @crash_content = File.open(@default_crash_file, 'rb') { |file| file.read }
        end

        it 'should contain the error text' do
          expect(@crash_content).to match(/Error: MockError/)
        end

        it 'should contain a backtrace' do
          expect(@crash_content).to match(/Backtrace/)
          expect(@crash_content).to match(/message_router.rb/)
        end

        it 'should contain the request method' do
          expect(@crash_content).to match(/request/)
          expect(@crash_content).to match(request_rpc_method)
        end

        it 'should contain the current document cache' do
          documents.each do |uri,content|
            expect(@crash_content).to match(uri)
            expect(@crash_content).to match(content)
          end
        end

        it 'should contain the request parameters' do
          expect(@crash_content).to match(/params/)
          request_params.each do |k,v|
            expect(@crash_content).to match(k)
            expect(@crash_content).to match(v)
          end
        end
      end
    end
  end

  describe '#receive_notification' do
    let(:documents) {{
      'file1.rb' => "file1_line1\nfile1_line2\nfile1_line3\nfile1_line4\n"
    }}
    let(:notification_method) { nil }
    let(:notification_params) { { 'crashparam2' => 'crashvalue2'} }

    before(:each) do
      allow(PuppetLanguageServer).to receive(:log_message)

      # Populate the document cache
      PuppetLanguageServer::DocumentStore.clear
      documents.each { |uri, content| PuppetLanguageServer::DocumentStore.set_document(uri, content) }
    end

    context 'given a request that raises an error' do
      let(:notification_method) { 'exit' }
      before(:each) do
        @default_crash_file = PuppetLanguageServer::CrashDump.default_crash_file
        File.delete(@default_crash_file) if File.exists?(@default_crash_file)

        expect(subject).to receive(:close_connection).and_raise('MockError')
      end

      it 'should create a default crash dump file' do
        begin
          subject.receive_notification(notification_method, notification_params)
        rescue
        end

        expect(File.exists?(@default_crash_file)).to be(true)
      end

      context 'the content of the crash dump file' do
        before(:each) do
          # Force a crash dump to occur
          begin
            subject.receive_notification(notification_method, notification_params)
          rescue
          end
          @crash_content = File.open(@default_crash_file, 'rb') { |file| file.read }
        end

        it 'should contain the error text' do
          expect(@crash_content).to match(/Error: MockError/)
        end

        it 'should contain a backtrace' do
          expect(@crash_content).to match(/Backtrace/)
          expect(@crash_content).to match(/message_router.rb/)
        end

        it 'should contain the notification name' do
          expect(@crash_content).to match(/notification/)
          expect(@crash_content).to match(notification_method)
        end

        it 'should contain the current document cache' do
          documents.each do |uri,content|
            expect(@crash_content).to match(uri)
            expect(@crash_content).to match(content)
          end
        end

        it 'should contain the request parameters' do
          expect(@crash_content).to match(/params/)
          notification_params.each do |k,v|
            expect(@crash_content).to match(k)
            expect(@crash_content).to match(v)
          end
        end
      end
    end
  end
end
