require 'spec_helper'
require 'open3'
require 'socket'

SERVER_TCP_PORT = 8081
SERVER_HOST = '127.0.0.1'

def start_tcp_server(start_options = ['--no-preload','--timeout=5'])
  cmd = "ruby puppet-languageserver #{start_options.join(' ')} --port=#{SERVER_TCP_PORT} --ip=0.0.0.0"
  
  stdin, stdout, stderr, wait_thr = Open3.popen3(cmd)
  # Wait for the Language Server to indicate it started
  line = nil
  begin
    line = stdout.readline
  end until line =~ /LANGUAGE SERVER RUNNING/
  stdout.close
  stdin.close
  stderr.close
  wait_thr
end

def start_stdio_server(start_options = ['--no-preload','--timeout=5'])
  cmd = "ruby puppet-languageserver #{start_options.join(' ')} --stdio"

  stdin, stdout, stderr, wait_thr = Open3.popen3(cmd)
  stderr.close
  return stdin, stdout, wait_thr
end

def send_message(sender,message)
  str = "Content-Length: #{message.length}\r\n\r\n" + message
  sender.write(str)
  sender.flush
end

def get_response(reader)
  sleep(1)
  reader.readpartial(2048)
end

describe 'puppet-languageserver' do
  describe 'TCP Server' do
    before(:each) do
      @server_thr = start_tcp_server
      @client = TCPSocket.open(SERVER_HOST, SERVER_TCP_PORT)
    end

    after(:each) do
      @client.close unless @client.nil?

      begin
        Process.kill("KILL", @server_thr[:pid])
        Process.wait(@server_thr[:pid])
      rescue
        # The server process may not exist and checking in a cross platform way in ruby is difficult
        # Instead just swallow any errors
      end
    end

    it 'responds to initialize request' do
      send_message(@client, '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"processId":1580,"rootPath":"c:\\\\Source\\\\puppet-vscode-files","rootUri":"file:///c%3A/Source/puppet-vscode-files","capabilities":{"workspace":{"applyEdit":true,"workspaceEdit":{"documentChanges":true},"didChangeConfiguration":{"dynamicRegistration":false},"didChangeWatchedFiles":{"dynamicRegistration":false},"symbol":{"dynamicRegistration":true},"executeCommand":{"dynamicRegistration":true}},"textDocument":{"synchronization":{"dynamicRegistration":true,"willSave":true,"willSaveWaitUntil":true,"didSave":true},"completion":{"dynamicRegistration":true,"completionItem":{"snippetSupport":true}},"hover":{"dynamicRegistration":true},"signatureHelp":{"dynamicRegistration":true},"references":{"dynamicRegistration":true},"documentHighlight":{"dynamicRegistration":true},"documentSymbol":{"dynamicRegistration":true},"formatting":{"dynamicRegistration":true},"rangeFormatting":{"dynamicRegistration":true},"onTypeFormatting":{"dynamicRegistration":true},"definition":{"dynamicRegistration":true},"codeAction":{"dynamicRegistration":true},"codeLens":{"dynamicRegistration":true},"documentLink":{"dynamicRegistration":true},"rename":{"dynamicRegistration":true}}},"trace":"off"}}')
      response = get_response(@client)

      expect(response).to match /{"jsonrpc":"2.0","id":0,"result":{"capabilities":/
    end

    it 'responds to puppet/getVersion request' do
      send_message(@client, '{"jsonrpc":"2.0","id":0,"method":"puppet/getVersion"}')
      response = get_response(@client)

      # Expect the response to have the required parameters
      expect(response).to match /"puppetVersion":/
      expect(response).to match /"facterVersion":/
      expect(response).to match /"functionsLoaded":/
      expect(response).to match /"typesLoaded":/
      expect(response).to match /"factsLoaded":/
    end
  end

  describe 'STDIO Server' do
    before(:each) do
      @stdin, @stdout, @server_thr = start_stdio_server
    end

    after(:each) do
      @stdin.close unless @stdin.nil?
      @stdout.close unless @stdout.nil?

      unless @server_thr.nil?
        begin
          Process.kill("KILL", @server_thr[:pid])
          Process.wait(@server_thr[:pid])
        rescue
          # The server process may not exist and checking in a cross platform way in ruby is difficult
          # Instead just swallow any errors
        end
      end
    end

    it 'responds to initialize request' do
      send_message(@stdin, '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"processId":1580,"rootPath":"c:\\\\Source\\\\puppet-vscode-files","rootUri":"file:///c%3A/Source/puppet-vscode-files","capabilities":{"workspace":{"applyEdit":true,"workspaceEdit":{"documentChanges":true},"didChangeConfiguration":{"dynamicRegistration":false},"didChangeWatchedFiles":{"dynamicRegistration":false},"symbol":{"dynamicRegistration":true},"executeCommand":{"dynamicRegistration":true}},"textDocument":{"synchronization":{"dynamicRegistration":true,"willSave":true,"willSaveWaitUntil":true,"didSave":true},"completion":{"dynamicRegistration":true,"completionItem":{"snippetSupport":true}},"hover":{"dynamicRegistration":true},"signatureHelp":{"dynamicRegistration":true},"references":{"dynamicRegistration":true},"documentHighlight":{"dynamicRegistration":true},"documentSymbol":{"dynamicRegistration":true},"formatting":{"dynamicRegistration":true},"rangeFormatting":{"dynamicRegistration":true},"onTypeFormatting":{"dynamicRegistration":true},"definition":{"dynamicRegistration":true},"codeAction":{"dynamicRegistration":true},"codeLens":{"dynamicRegistration":true},"documentLink":{"dynamicRegistration":true},"rename":{"dynamicRegistration":true}}},"trace":"off"}}')
      response = get_response(@stdout)

      expect(response).to match /{"jsonrpc":"2.0","id":0,"result":{"capabilities":/
    end

    it 'responds to puppet/getVersion request' do
      send_message(@stdin, '{"jsonrpc":"2.0","id":0,"method":"puppet/getVersion"}')
      response = get_response(@stdout)

      # Expect the response to have the required parameters
      expect(response).to match /"puppetVersion":/
      expect(response).to match /"facterVersion":/
      expect(response).to match /"functionsLoaded":/
      expect(response).to match /"typesLoaded":/
      expect(response).to match /"factsLoaded":/
    end
  end
end
