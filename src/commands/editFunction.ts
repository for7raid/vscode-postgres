import BaseCommand from "../common/baseCommand";
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { PostgreSQLTreeDataProvider } from "../tree/treeProvider";
import { FunctionNode } from "../tree/functionNode";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";
import { SqlQueryManager } from "../queries";
import { IConnection } from "vscode-languageserver";
import { Constants } from "../common/constants";

export class editFunctionCommand extends BaseCommand {
  async run(treeNode: FunctionNode) {
    const connection = await Database.createConnection(treeNode.connection);
    let query = SqlQueryManager.getVersionQueries(connection.pg_version);
    const res = await connection.query(query.GetFunctionSoruce, [treeNode.func]);
    const sql = res.rows[0].pg_get_functiondef;

    let projectConnection = await EditorState.getDefaultConnection();
    if (treeNode.connection.label == Constants.ProejctConnectionLabel || (treeNode.connection.host == projectConnection.host && treeNode.connection.database == projectConnection.database)) {
      var root = vscode.workspace.rootPath;
      var file = treeNode.schema == 'public' ? `${root}\\SQL\\F\\${treeNode.func}.sql` : `${root}\\SQL\\${treeNode.schema}\\F\\${treeNode.func}.sql`;
      var directory = path.dirname(file);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
      }
      fs.writeFileSync(file, sql, { encoding: "utf8", flag: "w" });

      const textDocument = await vscode.workspace.openTextDocument(file);
      await vscode.window.showTextDocument(textDocument);

    }
    else {
      const textDocument = await vscode.workspace.openTextDocument({ content: sql, language: 'postgres' });
      await vscode.window.showTextDocument(textDocument);

    }
    EditorState.connection = treeNode.connection;
  }
}
