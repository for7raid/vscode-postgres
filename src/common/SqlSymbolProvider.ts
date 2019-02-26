'use strict';

import * as vscode from 'vscode';
import { EditorState } from './editorState';
import { Database } from './database';
import { SqlQueryManager } from '../queries';

import { FunctionNode } from '../tree/functionNode';


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
                var file = func.schema == 'public' ? `postgres-database:/${root}\\SQL\\F\\${func.name}.sql` : `postgres-database:/${root}\\SQL\\${func.schema}\\F\\${func.name}.sql`;
                return {
                    name: func.name + ".sql",
                    kind: vscode.SymbolKind.File,
                    location: new vscode.Location(vscode.Uri.parse(file), new vscode.Range(0,0,0,0)),
                    containerName: "Database functions"
                }
            })
            resolve(symbols);
        });
    }
    resolveWorkspaceSymbol?(symbol: vscode.SymbolInformation, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation> {
        return new Promise(async (resolve, reject) => {
            let projectConnection = await EditorState.getDefaultConnection();
            let uri = symbol.location.uri;
            let func = new FunctionNode(projectConnection, uri.authority, null, null, uri.scheme)
            vscode.commands.executeCommand("vscode-postgres.editFunction", func);
            resolve();
            //new editFunctionCommand().run(func)
        });
    }
}

