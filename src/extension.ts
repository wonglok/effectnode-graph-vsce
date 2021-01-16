import * as vscode from 'vscode';
import { GraphEditorProvider } from './graphEditor';
// import { ENViewerProvider } from './effectNo';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(GraphEditorProvider.register(context));
	// context.subscriptions.push(ENViewerProvider.register(context));
}
