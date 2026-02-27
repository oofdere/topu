// this file is AI-generated

import { AstNode, CstUtils, GenericAstNode } from "langium";
import { AstNodeHoverProvider } from "langium/lsp";
import type { Hover, HoverParams } from "vscode-languageserver";
import type { LangiumDocument } from "langium";
import * as AST from "./generated/ast.js";
import {
    extractDeclarations,
    extractFunction,
    extractObject,
    extractProperty,
    extractRecord,
    extractType,
} from "./generator.ts";

function getNsid(node: AstNode): string {
    let current = node.$container;
    while (current) {
        if (AST.isNamespace(current)) {
            return current.name.segments.join(".");
        }
        current = current.$container;
    }
    return "…";
}

function jsonBlock(json: unknown): string {
    return "```json\n" + JSON.stringify(json, null, 2) + "\n```";
}

function getJson(node: AstNode): string | undefined {
    const nsid = getNsid(node);

    if (AST.isRecord(node)) return jsonBlock(extractRecord(node, nsid));
    if (AST.isFn(node)) return jsonBlock(extractFunction(node, nsid));
    if (AST.isObj(node)) return jsonBlock(extractObject(node, nsid));
    if (AST.isDeclarations(node)) return jsonBlock(extractDeclarations(node));
    if (AST.isType(node)) return jsonBlock(extractType(node));
    if (AST.isProperty(node)) {
        return jsonBlock({ [node.key]: extractProperty(node) });
    }

    return undefined;
}

// Why: NameID is a data type rule (returns string), so its CST leaf's
// astNode is the *parent* (Record, Obj, Fn, Property). We detect name
// tokens by checking if the leaf text matches that parent's `name` or `key`.
function isNameToken(node: AstNode, text: string): boolean {
    const generic = node as GenericAstNode;
    return generic["name"] === text || generic["key"] === text;
}

export class TopuHoverProvider extends AstNodeHoverProvider {
    override getHoverContent(
        document: LangiumDocument,
        params: HoverParams,
    ): Promise<Hover | undefined> {
        const root = document.parseResult?.value?.$cstNode;
        if (!root) return Promise.resolve(undefined);

        const offset = document.textDocument.offsetAt(params.position);
        const leaf = CstUtils.findLeafNodeAtOffset(root, offset);
        if (!leaf) return Promise.resolve(undefined);

        if (!isNameToken(leaf.astNode, leaf.text)) {
            return Promise.resolve(undefined);
        }

        const content = getJson(leaf.astNode);
        if (!content) return Promise.resolve(undefined);

        return Promise.resolve({
            contents: { kind: "markdown", value: content },
        });
    }

    protected getAstNodeHoverContent(_node: AstNode): string | undefined {
        return undefined;
    }
}
