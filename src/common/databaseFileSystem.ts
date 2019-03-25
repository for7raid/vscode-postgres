'use strict';

import * as vscode from 'vscode';
import { workspace } from 'vscode';
import * as path from 'path';
import { Global } from './global';
import { Constants } from './constants';
import { PostgreSQLTreeDataProvider } from '../tree/treeProvider';
import { EditorState } from './editorState';
import { SqlQueryManager } from '../queries';
import { Database } from './database';
import * as fs from 'fs';

// writeFile (uri, buffer.from(), {create: true, overwrite: true})
export class DatabaseFile implements vscode.FileStat {
  type: vscode.FileType;
  ctime: number;
  mtime: number;
  size: number;
  name: string;
  data: Uint8Array;
  scheme: string;

  constructor(name: string) {
    this.type = vscode.FileType.File;
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
    this.name = name;
  }
}

export class DatabaseFS implements vscode.FileSystemProvider {

  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  private _bufferedEvents: vscode.FileChangeEvent[] = [];
  private _fireSoonHandle: NodeJS.Timer;
  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

  private _fireSoon(...events: vscode.FileChangeEvent[]): void {
    clearTimeout(this._fireSoonHandle);
    this._bufferedEvents.push(...events);
    this._fireSoonHandle = setTimeout(() => {
      this._emitter.fire(this._bufferedEvents);
      this._bufferedEvents.length = 0;
    }, 5);
  }

  watch(resource: vscode.Uri, opts): vscode.Disposable {
    // ignore
    return new vscode.Disposable(() => { });
  }

  stat(uri: vscode.Uri): vscode.FileStat {
    return this._lookup(uri, false);
  }

  readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
    // no reading of directories - managed via connection explorer
    return [];
  }

  createDirectory(uri: vscode.Uri): void {
    //throw vscode.FileSystemError.NoPermissions('Unable to create database function directories');
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    var statFile = await this._lookup(uri, false);
    const projectConnection = await EditorState.getDefaultConnection();
    const connection = await Database.createConnection(projectConnection);
    const query = SqlQueryManager.getVersionQueries(connection.pg_version);
    const res = await connection.query(query.GetFunctionSoruce, [statFile.scheme, statFile.name]);
    const sql = res.rows[0].pg_get_functiondef;
    await connection.end();
    if (!sql || sql.length === 0)
      throw vscode.FileSystemError.FileNotFound(uri);

    return Buffer.from(sql);
  }

  async writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): Promise<void> {
    const file = uri.fsPath;
    const directory = path.dirname(file);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }
    fs.writeFileSync(file, content.toString(), { encoding: "utf8", flag: "w" });

    //this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
  }

  delete(uri: vscode.Uri): void {
    throw vscode.FileSystemError.NoPermissions('Unable to delete database function entries');
  }

  rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): void {
    throw vscode.FileSystemError.NoPermissions('Unable to rename database function entries');
  }

  private _lookup(uri: vscode.Uri, silent: boolean): DatabaseFile {
    var root = vscode.workspace.rootPath;
    var file = uri.fsPath.replace(root, '').replace('.sql', '').split('\\');
    let statFile: DatabaseFile = new DatabaseFile(file[file.length - 1]);
    statFile.scheme = file.length == 5 ? file[2] : 'public';
    return statFile;
  }
}