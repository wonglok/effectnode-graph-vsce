import * as path from 'path';
import * as vscode from 'vscode';
import { getNonce } from './util';

/**
 * Provider for cat scratch editors.
 *
 * Cat scratch editors are used for `.cscratch` files, which are just json files.
 * To get started, run this extension and open an empty `.cscratch` file in VS Code.
 *
 * This provider demonstrates:
 *
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Synchronizing changes between a text document and a custom editor.
 */
export class GraphEditorProvider implements vscode.CustomTextEditorProvider {

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new GraphEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(GraphEditorProvider.viewType, provider, {
			webviewOptions: {
				retainContextWhenHidden: true,
			}
		});
		return providerRegistration;
	}

	private static readonly viewType = 'effectnode.graph';

	// private static readonly scratchCharacters = ['😸', '😹', '😺', '😻', '😼', '😽', '😾', '🙀', '😿', '🐱'];

	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

	/**
	 * Called when our custom editor is opened.
	 *
	 *
	 */
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {

		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};

		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);

		const provideWebviewData = () => {
			webviewPanel.webview.postMessage({
				type: 'provide',
				doc: this.getDocumentAsJson(document)//document.getText(),
			});
		}

		//
		// Hook up event handlers so that we can synchronize the webview with the text document.
		//
		// The text document acts as our model, so we have to sync change in the document to our
		// editor and sync changes in the editor back to the document.
		//
		// Remember that a single text document can also be shared between multiple custom
		// editors (this happens for example when you split a custom editor)

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				provideWebviewData();
			}
		});
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// const didSaveSubs = vscode.workspace.onDidSaveTextDocument(() => {
		// 	provideWebviewData();
		// })
		// webviewPanel.onDidDispose(() => {
		// 	didSaveSubs.dispose();
		// });

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'reload':
					webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);
					return;
				case 'autosave':
					this.updateTextDocument(document, e.doc);
					return;
				case 'provide':
					provideWebviewData()
			}
		});

		// provideWebviewData();
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview, document: vscode.TextDocument): string {
		// Local path to script and css for the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.file(
			path.join(this.context.extensionPath, 'media', 'gui-out', 'main.js')
		));
		const styleResetUri = webview.asWebviewUri(vscode.Uri.file(
			path.join(this.context.extensionPath, 'media', 'reset.css')
		));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.file(
			path.join(this.context.extensionPath, 'media', 'vscode.css')
		));

		// const styleMainUri = webview.asWebviewUri(vscode.Uri.file(
		// 	path.join(this.context.extensionPath, 'media', 'catScratch.css')
		// ));

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src ${webview.cspSource} blob:; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet" />
				<link href="${styleVSCodeUri}" rel="stylesheet" />

				<title>EffectNode</title>
			</head>
			<body>
				<div id="root"></div>

				<script nonce="${nonce}">
					window.SCRIPTS = [
						{
							name: 'main.js',
							url: "${scriptUri}"
						}
					];
				</script>
				<script nonce="${nonce}" id="mainscript" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	/**
	 * Try to get a current document as json text.
	 */
	private getDocumentAsJson(document: vscode.TextDocument): any {
		const text = document.getText();
		if (text.trim().length === 0) {
			return { _id: `_${(Math.random() * 100000000000).toFixed(0)}` };
		}

		try {
			return JSON.parse(text);
		} catch {
			throw new Error('Could not get document as json. Content is not valid json');
		}
	}

	/**
	 * Write out the json to a given document.
	 */
	private updateTextDocument(document: vscode.TextDocument, json: any) {
		const edit = new vscode.WorkspaceEdit();

		// Just replace the entire document every time for this example extension.
		// A more complete extension should compute minimal edits instead.
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			JSON.stringify(json, null, 2));

		return vscode.workspace.applyEdit(edit);
	}
}
