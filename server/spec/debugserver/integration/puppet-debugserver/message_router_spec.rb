require 'spec_debug_helper'
require 'json'

# A stubbed JSON Handler which is used to remember data sent to the client
class StubbedMessageRouter < PuppetDebugServer::MessageRouter
  attr_reader :data_stream

  def initialize(*options)
    super(*options)
    @data_stream = []
  end

  def send_data(data)
    # Strip the Content Header
    stripped_data = data.slice(data.index("\r\n\r\n") + 4 ..-1)
    @data_stream << JSON.parse(stripped_data)
    true
  end
end

# Helper methods that look at the stubbed message for various
# messages in the queue.
def data_from_request_seq_id(obj, request_seq_id)
  obj.data_stream.find { |item| item['request_seq'] == request_seq_id}
end

def data_from_event_name(obj, event_name)
  obj.data_stream.find { |item| item['type'] == 'event' && item['event'] == event_name}
end

def next_seq_id
  @tx_seq_id += 1
end

describe 'PuppetDebugServer::MessageRouter' do
  let(:subject) { StubbedMessageRouter.new({}) }

  before(:each) {
    allow(subject).to receive(:close_connection_after_writing).and_return(true)
    allow(subject).to receive(:close_connection).and_return(true)

    PuppetDebugServer::PuppetDebugSession.stop
    @tx_seq_id = 0
  }

  context 'During initial session setup' do
    it 'should respond with the correct capabilities' do
      subject.parse_data(initialize_request)

      response = data_from_request_seq_id(subject, 1)

      expect(response['body']['supportsConfigurationDoneRequest']).to be true
      expect(response['body']['supportsFunctionBreakpoints']).to be true
      expect(response['body']['supportsRestartRequest']).to be false
      expect(response['body']['supportsStepBack']).to be false
      expect(response['body']['supportsSetVariable']).to be true
      expect(response['body']['supportsStepInTargetsRequest']).to be false
      expect(response['body']['supportedChecksumAlgorithms']).to eq([])
    end

    it 'should respond with an Initialized event' do
      subject.parse_data(initialize_request)

      response = data_from_event_name(subject, 'initialized')
      expect(response).to_not be nil
    end

    it 'should respond with failures for debug session commands' do
      subject.parse_data(initialize_request)
      subject.parse_data(threads_request(2))
      subject.parse_data(stacktrace_request(3))
      subject.parse_data(scopes_request(4))
      subject.parse_data(variables_request(5))
      subject.parse_data(evaluate_request(6))
      subject.parse_data(stepin_request(7))
      subject.parse_data(stepout_request(8))
      subject.parse_data(next_request(9))

      {
        2 => 'threads',
        3 => 'stackTrace',
        4 => 'scopes',
        5 => 'variables',
        6 => 'evaluate',
        7 => 'stepIn',
        8 => 'stepOut',
        9 => 'next',
      }.each do |seq_id, command|
        response = data_from_request_seq_id(subject, seq_id)
        expect(response).to_not be nil
        expect(response['success']).to be false
        expect(response['command']).to eq(command)
      end
    end

    it 'should increment the response sequence ID by one' do
      subject.parse_data(initialize_request)
      subject.parse_data(threads_request(10))
      subject.parse_data(stacktrace_request(20))
      subject.parse_data(scopes_request(30))

      last_seq_id = nil
      [10, 20, 30].each do |req_seq_id|
        response = data_from_request_seq_id(subject, req_seq_id)
        expect(response).to_not be nil
        expect(response['success']).to be false
        unless last_seq_id.nil?
          expect(response['seq']).to eq(last_seq_id + 1)
        end
        last_seq_id = response['seq']
      end
    end
  end

  context 'Receiving a disconnect request' do
    it 'should close the connection' do
      expect(subject).to receive(:close_connection)
      subject.parse_data(initialize_request)
      subject.parse_data(disconnect_request(2))
    end
  end
end
