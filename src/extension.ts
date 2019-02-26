'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import PostgreSQLLanguageClient from './language/client';
import { PostgreSQLTreeDataProvider } from './tree/treeProvider';
import { Global } from './common/global';
import { EditorState } from './common/editorState';
import { ConfigFS } from './common/configFileSystem';
import { ResultsManager } from './resultsview/resultsManager';
import { SqlSymbolProvider } from './common/SqlSymbolProvider';
import { DatabaseFS } from './common/databaseFileSystem';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-postgres" is now active!');
  let languageClient: PostgreSQLLanguageClient = new PostgreSQLLanguageClient(context);
  let treeProvider: PostgreSQLTreeDataProvider = PostgreSQLTreeDataProvider.getInstance(context);
  Global.context = context;
  EditorState.getInstance(languageClient);

  try {
    let commandPath = context.asAbsolutePath(path.join('out', 'commands'));
    let files = fs.readdirSync(commandPath);
    for (const file of files) {
      if (path.extname(file) === '.map') continue;
      let baseName = path.basename(file, '.js');
      let className = baseName + 'Command';

      let commandClass = require(`./commands/${baseName}`);
      new commandClass[className](context);
    }
  }
  catch (err) {
    console.error('Command loading error:', err);
  }

  Global.ResultManager = new ResultsManager();
  context.subscriptions.push(Global.ResultManager);

  vscode.workspace.onDidOpenTextDocument(async (e: vscode.TextDocument) => {
    await EditorState.setNonActiveConnection(e, null);
  });

  context.subscriptions.push(vscode.workspace.registerFileSystemProvider('postgres-config', new ConfigFS(), {isCaseSensitive: true}));
  context.subscriptions.push(vscode.workspace.registerFileSystemProvider('postgres-database', new DatabaseFS(), {isCaseSensitive: false}));
  context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new SqlSymbolProvider()));

}

// this method is called when your extension is deactivated
export function deactivate() {
}