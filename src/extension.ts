import {window, workspace, Range, Position, ExtensionContext} from 'vscode';
import * as iconv from 'iconv-lite';
import * as fs from 'fs';

export function activate(context: ExtensionContext) {
    let disposable = workspace.onDidOpenTextDocument(doc => {
        let text = doc.getText();
        if (text.indexOf('�') !== -1) {
            let conf = workspace.getConfiguration('files');
            let done = false;
            let absolutePath = doc.uri.fsPath;
            let chunks: NodeBuffer[] = [];
            const reader = fs.createReadStream(absolutePath).pipe(iconv.decodeStream('gbk'));
            reader.on('data', (buf) => {
                chunks.push(buf);
            });
            reader.on('error', (error) => {
                if (!done) {
                    done = true;
                    window.showErrorMessage('failed to change file coding');
                }
            });
            reader.on('end', () => {
                if (!done) {
                    done = true;
                    let content = chunks.join('');
                    setTimeout(function() {
                        let editor = window.activeTextEditor;
                        let start = new Position(0, 0);
                        let end = new Position(doc.lineCount, 100);
                        let range = new Range(start, end);

                        editor.edit(editBuilder => {
                            editBuilder.replace(range, content);
                            window.showInformationMessage('successfully changed file coding to ' + conf.get('encoding'));
                        });
                    }, 500);
                }
            });
        }
    });
    context.subscriptions.push(disposable);
}