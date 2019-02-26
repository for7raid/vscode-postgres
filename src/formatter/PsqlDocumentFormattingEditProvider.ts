import * as vscode from "vscode";
import * as sqlFormatter from 'sqlFormatter.js';

export default class PsqlDocumentFormattingEditProvider implements vscode.DocumentFormattingEditProvider {
	provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
		let text = document.getText();
		text = sqlFormatter.format(text, { language: "pl/sql" });
		return [vscode.TextEdit.replace(new vscode.Range(0, 0, 9999, 9999), text)];
	}
}