import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { FunctionNode } from "../tree/functionNode";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";
import { SqlQueryManager } from "../queries";

import { Constants } from "../common/constants";

export class editFunctionCommand extends BaseCommand {
  async run(treeNode: FunctionNode) {

    let projectConnection = await EditorState.getDefaultConnection();
    if (treeNode.connection.label == Constants.ProejctConnectionLabel || (projectConnection !== null && treeNode.connection.host == projectConnection.host && treeNode.connection.database == projectConnection.database)) {
      var root = vscode.workspace.rootPath;
      var file = 'postgres-database:/' + (treeNode.schema == 'public' ? `${root}\\SQL\\F\\${treeNode.func}.sql` : `${root}\\SQL\\${treeNode.schema}\\F\\${treeNode.func}.sql`);
      const textDocument = await vscode.workspace.openTextDocument(vscode.Uri.parse(file));
    }
    else {
      const connection = await Database.createConnection(treeNode.connection);
      let query = SqlQueryManager.getVersionQueries(connection.pg_version);
      const res = await connection.query(query.GetFunctionSoruce, [treeNode.func]);
      const sql = res.rows[0].pg_get_functiondef;
      const textDocument = await vscode.workspace.openTextDocument({ content: sql, language: 'postgres' });
      await vscode.window.showTextDocument(textDocument);

    }
    EditorState.connection = treeNode.connection;
  }
}
