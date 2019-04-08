import * as vscode from 'vscode';
import { EditorState } from './editorState';
import { Database } from './database';
import { SqlQueryManager } from '../queries';

export default class FunctionDefinitionProvider implements vscode.DefinitionProvider {
	provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition> {
		return new Promise(async (resolve, reject) => {
			const find = document.getText(document.getWordRangeAtPosition(position, /[a-zA-z._0-9]+/));
			let projectConnection = await EditorState.getDefaultConnection();
			const connection = await Database.createConnection(projectConnection);
			let query = SqlQueryManager.getVersionQueries(connection.pg_version);
			const res = await connection.query(query.FindFunction, ['%' + find]);

			var root = vscode.workspace.rootPath;

			if (res.rowCount == 0) return reject();

			var symbols = res.rows.map<vscode.Location>(func => {
				var file = func.schema == 'public' ? `postgres-function:/${root}\\SQL\\F\\${func.name}.sql` : `postgres-function:/${root}\\SQL\\${func.schema}\\F\\${func.name}.sql`;
				return new vscode.Location(vscode.Uri.parse(file), new vscode.Range(0, 0, 0, 0));
			})

			await connection.end();
			
			resolve(symbols);
		});

	}


}