'use strict';

import * as vscode from 'vscode';
import { EditorState } from './editorState';
import { Database } from './database';
import { SqlQueryManager } from '../queries';

export class SqlSymbolProvider implements vscode.WorkspaceSymbolProvider {
    provideWorkspaceSymbols(find: string, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[]> {
        if (!find || find.length < 3) return null;

        return new Promise(async (resolve, reject) => {

            let projectConnection = await EditorState.getDefaultConnection();
            const connection = await Database.createConnection(projectConnection);
            let query = SqlQueryManager.getVersionQueries(connection.pg_version);
            const res = await connection.query(query.FindFunction, [find + '%']);

            var root = vscode.workspace.rootPath;
            

            var symbols = res.rows.map<vscode.SymbolInformation>(func => {
                var file = func.schema == 'public' ? `postgres-function:/${root}\\SQL\\F\\${func.name}.sql` : `postgres-function:/${root}\\SQL\\${func.schema}\\F\\${func.name}.sql`;
                return {
                    name: func.name + ".sql",
                    kind: vscode.SymbolKind.File,
                    location: new vscode.Location(vscode.Uri.parse(file), new vscode.Range(0,0,0,0)),
                    containerName: "Database functions"
                }
            })

            await connection.end();

            resolve(symbols);
        });
    }
    resolveWorkspaceSymbol?(symbol: vscode.SymbolInformation, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation> {
       throw new Error();
    }
}

