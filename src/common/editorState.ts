import * as vscode from 'vscode';
import { IConnection } from './IConnection';
import PostgreSQLLanguageClient from '../language/client';
import { Global } from './global';
import { Constants } from './constants';
import { Database } from './database';
import * as path from 'path';
import * as fs from 'fs';
import * as querystring from 'querystring';
import { Connection } from 'pg';
import { PostgreSQLTreeDataProvider } from '../tree/treeProvider';

export class EditorState {

  private metadata: Map<string, IConnection> = new Map<string, IConnection>();
  private static _instance: EditorState = null;
  private statusBarDatabase: vscode.StatusBarItem;
  private statusBarServer: vscode.StatusBarItem;

  constructor(private readonly languageClient: PostgreSQLLanguageClient) {
    vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor, this);
    vscode.workspace.onDidCloseTextDocument(this.onDidCloseTextDocument, this);
    vscode.workspace.onDidOpenTextDocument(this.onDidOpenTextDocument, this);
  }

  static getInstance(languageClient?: PostgreSQLLanguageClient) {
    if (!EditorState._instance && languageClient) EditorState._instance = new EditorState(languageClient);
    return EditorState._instance;
  }

  public static get connection(): IConnection {
    let window = vscode.window;
    let te = window ? window.activeTextEditor : null;
    let doc = te ? te.document : null;
    let uri = doc ? doc.uri : null;

    if (!uri) return null;
    return EditorState.getInstance().metadata.get(uri.toString());
  }

  public static set connection(newConn: IConnection) {
    let window = vscode.window;
    let te = window ? window.activeTextEditor : null;
    let doc = te ? te.document : null;
    let uri = doc ? doc.uri : null;

    if (!uri) return;
    EditorState.getInstance().metadata.set(uri.toString(), newConn);
    EditorState.getInstance().onDidChangeActiveTextEditor(te);
  }

  public static async setNonActiveConnection(doc: vscode.TextDocument, newConn: IConnection) {
    if (!doc && !doc.uri) return;
    if (!newConn) {
      newConn = await EditorState.getDefaultConnection();
    }
    EditorState.getInstance().metadata.set(doc.uri.toString(), newConn);
    if (vscode.window && vscode.window.activeTextEditor) {
      EditorState.getInstance().onDidChangeActiveTextEditor(vscode.window.activeTextEditor);
    }
  }

  public static async getDefaultConnection(): Promise<IConnection> {
    const defaultConnection = Constants.ProejctConnectionLabel;
    const tree = PostgreSQLTreeDataProvider.getInstance();
    
    var root = vscode.workspace.rootPath;
    var configFile = path.join(root, 'wwwroot', 'appsettings.Development.json');
    var text = fs.readFileSync(configFile, 'utf8');
    var connectionStrings = JSON.parse(text).ConnectionStrings;
    var def = connectionStrings.Default;
    var conStr = connectionStrings.Values[def];
    var conObj = querystring.parse(conStr, ';');

    let connections = Global.context.globalState.get<{ [key: string]: IConnection }>(Constants.GlobalStateKey);
    if (!connections) connections = {};

    let connection: IConnection = null;
    const label = defaultConnection;
    const host = conObj.Server;
    const user = conObj['User Id'];
    const nPort = conObj.Port;
    const certPath = '';
    const database = conObj.Database;
    connection = { label, host, user, port: nPort, certPath, database };
    connection.password = conObj.Password;
    connections[defaultConnection] = connection;
    await Global.keytar.setPassword(Constants.ExtensionId, defaultConnection, conObj.Password);
    
    await tree.context.globalState.update(Constants.GlobalStateKey, connections);
    tree.refresh();

    return connection;
  }

  onDidChangeActiveTextEditor(e: vscode.TextEditor) {
    let conn: IConnection = e && e.document && e.document.uri ? this.metadata.get(e.document.uri.toString()) : null;
    this.languageClient.setConnection(conn);
    if (conn) {
      // set the status buttons
      this.setStatusButtons(conn);
    } else {
      // clear the status buttons
      this.removeStatusButtons();
    }
  }

  setStatusButtons(conn: IConnection) {
    if (!this.statusBarServer) {
      this.statusBarServer = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
      this.statusBarServer.tooltip = 'Change Active Server';
    }
    
    this.statusBarServer.text = `$(server) ${conn.label || conn.host}`;
    this.statusBarServer.command = 'vscode-postgres.selectConnection';
    this.statusBarServer.show();

    // if (!conn.database) {
    //   if (this.statusBarDatabase) {

    //   }
    //     // this.statusBarDatabase.hide();
    //   return;
    // }

    if (!this.statusBarDatabase) {
      this.statusBarDatabase = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
      this.statusBarDatabase.tooltip = 'Change Active Database';
    }

    if (!conn.database) {
      this.statusBarDatabase.text = `$(database)`;
    } else {
      this.statusBarDatabase.text = `$(database) ${conn.database}`;
    }
    this.statusBarDatabase.command = 'vscode-postgres.selectDatabase';
    this.statusBarDatabase.show();
  }

  removeStatusButtons() {
    if (this.statusBarDatabase) this.statusBarDatabase.hide();

    if (!this.statusBarServer) {
      this.statusBarServer = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
      this.statusBarServer.tooltip = 'Change Active Server';
    }
    
    this.statusBarServer.text = `$(server) Select Postgres Server`;
    this.statusBarServer.command = 'vscode-postgres.selectConnection';
    this.statusBarServer.show();
  }

  onDidCloseTextDocument(e: vscode.TextDocument) {
    this.metadata.delete(e.uri.toString());
  }

  onDidOpenTextDocument(e: vscode.TextDocument) {
    this.metadata.set(e.uri.toString(), null);
  }

}