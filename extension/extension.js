import { LanguageClient, TransportKind } from "vscode-languageclient/node.js";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const extensionDir = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(extensionDir, "server.js");

let client;

export function activate() {
    const serverOptions = {
        run:   { module: serverPath, transport: TransportKind.ipc },
        debug: { module: serverPath, transport: TransportKind.ipc },
    };

    client = new LanguageClient("topu", "Topu LSP", serverOptions, {
        documentSelector: [{ scheme: "file", language: "topu" }],
    });
    client.start();
}

export function deactivate() {
    return client?.stop();
}
