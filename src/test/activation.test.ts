'use strict';

import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';
import { ConnectionStatus } from '../interfaces';
import * as myExtension from '../extension';

describe('Should do completion', function() {
  const docUri = getDocUri('empty.pp');
  var doc: vscode.TextDocument;
  var editor: vscode.TextEditor;
  var documentEol: string;
  var platformEol: string;
  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  before(async () => {
    // The extensionId is `publisher.name` from package.json
    const ext = vscode.extensions.getExtension('jpogran.puppet-vscode');
    await ext.activate();
    try {
      doc = await vscode.workspace.openTextDocument(docUri);
      editor = await vscode.window.showTextDocument(doc);

      await sleep(2000); // Wait for server activation
      while (myExtension.status() !== ConnectionStatus.RunningLoaded) {
        await sleep(2000); // Wait for server activation
      }
    } catch (e) {
      console.error(e);
    }
  });

  it('Completes simple snippets Puppet in txt file', async () => {
    var position = new vscode.Position(0, 0);

    var expectedCompletionList = {
      items: [
        // base snippets completion
        // { label: 'case', kind: vscode.CompletionItemKind.Snippet },
        // { label: 'if', kind: vscode.CompletionItemKind.Snippet },
        // { label: 'unless', kind: vscode.CompletionItemKind.Snippet },
        // puppet language server completion
        { label: 'alert', kind: vscode.CompletionItemKind.Function },
        { label: 'application', kind: vscode.CompletionItemKind.Keyword },
        { label: 'augeas', kind: vscode.CompletionItemKind.Module },
        { label: 'break', kind: vscode.CompletionItemKind.Function },
        { label: 'class', kind: vscode.CompletionItemKind.Keyword },
        { label: 'computer', kind: vscode.CompletionItemKind.Module },
        { label: 'contain', kind: vscode.CompletionItemKind.Function },
        { label: 'create_resources', kind: vscode.CompletionItemKind.Function },
        { label: 'crit', kind: vscode.CompletionItemKind.Function },
        { label: 'cron', kind: vscode.CompletionItemKind.Module },
        { label: 'debug', kind: vscode.CompletionItemKind.Function },
        { label: 'define', kind: vscode.CompletionItemKind.Keyword },
        { label: 'emerg', kind: vscode.CompletionItemKind.Function },
        { label: 'err', kind: vscode.CompletionItemKind.Function },
        { label: 'exec', kind: vscode.CompletionItemKind.Module },
        { label: 'fail', kind: vscode.CompletionItemKind.Function },
        { label: 'file', kind: vscode.CompletionItemKind.Module },
        { label: 'filebucket', kind: vscode.CompletionItemKind.Module },
        { label: 'group', kind: vscode.CompletionItemKind.Module },
        { label: 'host', kind: vscode.CompletionItemKind.Module },
        { label: 'iis_application', kind: vscode.CompletionItemKind.Module },
        { label: 'iis_application_pool', kind: vscode.CompletionItemKind.Module },
        { label: 'iis_feature', kind: vscode.CompletionItemKind.Module },
        { label: 'iis_site', kind: vscode.CompletionItemKind.Module },
        { label: 'iis_virtual_directory', kind: vscode.CompletionItemKind.Module },
        { label: 'include', kind: vscode.CompletionItemKind.Function },
        { label: 'info', kind: vscode.CompletionItemKind.Function },
        { label: 'interface', kind: vscode.CompletionItemKind.Module },
        { label: 'k5login', kind: vscode.CompletionItemKind.Module },
        { label: 'macauthorization', kind: vscode.CompletionItemKind.Module },
        { label: 'mailalias', kind: vscode.CompletionItemKind.Module },
        { label: 'maillist', kind: vscode.CompletionItemKind.Module },
        { label: 'match', kind: vscode.CompletionItemKind.Function },
        { label: 'mcx', kind: vscode.CompletionItemKind.Module },
        { label: 'mount', kind: vscode.CompletionItemKind.Module },
        { label: 'nagios_command', kind: vscode.CompletionItemKind.Module },
        { label: 'nagios_contact', kind: vscode.CompletionItemKind.Module },
        { label: 'nagios_contactgroup', kind: vscode.CompletionItemKind.Module },
        { label: 'nagios_host', kind: vscode.CompletionItemKind.Module },
        { label: 'nagios_hostdependency', kind: vscode.CompletionItemKind.Module },
        { label: 'nagios_hostescalation', kind: vscode.CompletionItemKind.Module },
        { label: 'nagios_hostextinfo', kind: vscode.CompletionItemKind.Module },
        { label: 'nagios_hostgroup', kind: vscode.CompletionItemKind.Module },
        { label: 'nagios_service', kind: vscode.CompletionItemKind.Module },
        { label: 'nagios_servicedependency', kind: vscode.CompletionItemKind.Module },
        { label: 'nagios_serviceescalation', kind: vscode.CompletionItemKind.Module },
        { label: 'nagios_serviceextinfo', kind: vscode.CompletionItemKind.Module },
        { label: 'nagios_servicegroup', kind: vscode.CompletionItemKind.Module },
        { label: 'nagios_timeperiod', kind: vscode.CompletionItemKind.Module },
        { label: 'next', kind: vscode.CompletionItemKind.Function },
        { label: 'notice', kind: vscode.CompletionItemKind.Function },
        { label: 'notify', kind: vscode.CompletionItemKind.Module },
        { label: 'package', kind: vscode.CompletionItemKind.Module },
        { label: 'realize', kind: vscode.CompletionItemKind.Function },
        { label: 'reboot', kind: vscode.CompletionItemKind.Module },
        { label: 'require', kind: vscode.CompletionItemKind.Function },
        { label: 'resources', kind: vscode.CompletionItemKind.Module },
        { label: 'return', kind: vscode.CompletionItemKind.Function },
        { label: 'router', kind: vscode.CompletionItemKind.Module },
        { label: 'schedule', kind: vscode.CompletionItemKind.Module },
        { label: 'scheduled_task', kind: vscode.CompletionItemKind.Module },
        { label: 'selboolean', kind: vscode.CompletionItemKind.Module },
        { label: 'selmodule', kind: vscode.CompletionItemKind.Module },
        { label: 'service', kind: vscode.CompletionItemKind.Module },
        { label: 'site', kind: vscode.CompletionItemKind.Keyword },
        { label: 'ssh_authorized_key', kind: vscode.CompletionItemKind.Module },
        { label: 'sshkey', kind: vscode.CompletionItemKind.Module },
        { label: 'stage', kind: vscode.CompletionItemKind.Module },
        { label: 'tag', kind: vscode.CompletionItemKind.Function },
        { label: 'tidy', kind: vscode.CompletionItemKind.Module },
        { label: 'user', kind: vscode.CompletionItemKind.Module },
        { label: 'vlan', kind: vscode.CompletionItemKind.Module },
        { label: 'warning', kind: vscode.CompletionItemKind.Function },
        { label: 'yumrepo', kind: vscode.CompletionItemKind.Module },
        { label: 'zfs', kind: vscode.CompletionItemKind.Module },
        { label: 'zone', kind: vscode.CompletionItemKind.Module },
        { label: 'zpool', kind: vscode.CompletionItemKind.Module },
        { label: 'case', kind: vscode.CompletionItemKind.Snippet },
        { label: 'if', kind: vscode.CompletionItemKind.Snippet },
        { label: 'unless', kind: vscode.CompletionItemKind.Snippet }
      ]
    };

    // Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
    const actualCompletionList = (await vscode.commands.executeCommand(
      'vscode.executeCompletionItemProvider',
      docUri,
      position
    )) as vscode.CompletionList;

    assert.equal(actualCompletionList.items.length, expectedCompletionList.items.length);
    // actualCompletionList.items.forEach(i => {
    //   console.log(`{ label: '${i.label}', kind: ${vscode.CompletionItemKind[i.kind]} }`);
    // });
    expectedCompletionList.items.forEach((expectedItem, i) => {
      const actualItem = actualCompletionList.items[i];
      assert.equal(actualItem.label, expectedItem.label);
      assert.equal(actualItem.kind, expectedItem.kind);
    });
  });
});
