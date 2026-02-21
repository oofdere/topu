import { startLanguageServer } from "langium/lsp";
import { NodeFileSystem } from "langium/node";
import { createTopuServices } from "./module.ts";
import {
    createConnection,
    ProposedFeatures,
} from "vscode-languageserver/node.js";
import { createServer, type Socket } from "node:net";

export function startStdio() {
    const connection = createConnection(ProposedFeatures.all);
    const { shared } = createTopuServices({ connection, ...NodeFileSystem });
    startLanguageServer(shared);
}

startStdio();

export function startSocket(port: number) {
    const server = createServer((socket: Socket) => {
        socket.on("error", console.error);
        const connection = createConnection(
            ProposedFeatures.all,
            socket,
            socket,
        );
        const { shared } = createTopuServices({
            connection,
            ...NodeFileSystem,
        });
        startLanguageServer(shared);
    });
    server.listen(port, () => {
        console.error(`Topu LSP listening on port ${port}`);
    });
}
