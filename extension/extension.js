import { LanguageClient, TransportKind } from "vscode-languageclient/node.js";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lspPath = resolve(projectRoot, "lsp.ts");

let client;

export function activate() {
    client = new LanguageClient("topu", "Topu LSP", {
        run:   { command: "deno", args: ["run", "--allow-all", lspPath], transport: TransportKind.stdio, options: { cwd: projectRoot } },
        debug: { command: "deno", args: ["run", "--allow-all", lspPath], transport: TransportKind.stdio, options: { cwd: projectRoot } },
    }, {
        documentSelector: [{ scheme: "file", language: "topu" }],
    });
    client.start();
}

export function deactivate() {
    return client?.stop();
}
