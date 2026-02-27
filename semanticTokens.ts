import { AstNode, isCompositeCstNode, isLeafCstNode } from "langium";
import {
    AbstractSemanticTokenProvider,
    SemanticTokenAcceptor,
} from "langium/lsp";
import * as AST from "./generated/ast.js";
import {
    SemanticTokenModifiers,
    SemanticTokenTypes,
} from "vscode-languageserver";

export class TopuSemanticTokenProvider extends AbstractSemanticTokenProvider {
    protected override highlightElement(
        node: AstNode,
        acceptor: SemanticTokenAcceptor,
    ): void {
        if (AST.isDecorator(node)) {
            acceptor({
                node,
                keyword: "#[",
                type: SemanticTokenTypes.decorator,
            });
            acceptor({
                node,
                keyword: "]",
                type: SemanticTokenTypes.decorator,
            });
        }

        if (AST.isNamespace(node)) {
            acceptor({
                node,
                keyword: "@",
                type: SemanticTokenTypes.namespace,
            });
        }

        if (AST.isNsid(node)) {
            const range = node.$cstNode?.range;
            if (range) {
                acceptor({
                    node,
                    range,
                    type: SemanticTokenTypes.namespace,
                });
            }
        }

        if (AST.isRecord(node)) {
            acceptor({
                node,
                keyword: "record",
                type: SemanticTokenTypes.keyword,
            });
            acceptor({
                node,
                property: "name",
                type: SemanticTokenTypes.type,
                modifier: SemanticTokenModifiers.declaration,
            });
            this.highlightDoc(node, acceptor);
        }

        if (AST.isObj(node)) {
            acceptor({
                node,
                property: "name",
                type: SemanticTokenTypes.type,
                modifier: SemanticTokenModifiers.declaration,
            });
            this.highlightDoc(node, acceptor);
        }

        if (AST.isFn(node)) {
            acceptor({
                node,
                property: "type",
                type: SemanticTokenTypes.keyword,
            });
            acceptor({
                node,
                property: "name",
                type: SemanticTokenTypes.function,
                modifier: SemanticTokenModifiers.declaration,
            });
            if (node.encoding) {
                acceptor({
                    node,
                    property: "encoding",
                    type: SemanticTokenTypes.macro,
                });
            }
            this.highlightStrings(node, acceptor);
            if (node.throws.length > 0) {
                acceptor({
                    node,
                    keyword: "throws",
                    type: SemanticTokenTypes.keyword,
                });
            }
            this.highlightDoc(node, acceptor);
        }

        if (AST.isProperty(node)) {
            acceptor({
                node,
                property: "key",
                type: SemanticTokenTypes.property,
            });
            if (node.optional) {
                acceptor({
                    node,
                    keyword: "?",
                    type: SemanticTokenTypes.operator,
                });
            }
            this.highlightDoc(node, acceptor);
        }

        if (AST.isType(node)) {
            acceptor({
                node,
                property: "type",
                type: SemanticTokenTypes.type,
                modifier: SemanticTokenModifiers.defaultLibrary,
            });
        }

        if (AST.isLocalRef(node)) {
            acceptor({
                node,
                keyword: "#",
                type: SemanticTokenTypes.variable,
            });
            acceptor({
                node,
                property: "ref",
                type: SemanticTokenTypes.variable,
            });
        }

        if (AST.isGlobalRef(node)) {
            acceptor({
                node,
                property: "nsid",
                type: SemanticTokenTypes.class,
            });
            if (node.view) {
                acceptor({
                    node,
                    keyword: "#",
                    type: SemanticTokenTypes.variable,
                });
                acceptor({
                    node,
                    property: "view",
                    type: SemanticTokenTypes.variable,
                });
            }
        }

        if (AST.isAtomDecl(node)) {
            acceptor({
                node,
                keyword: "atom",
                type: SemanticTokenTypes.keyword,
            });
            acceptor({
                node,
                property: "name",
                type: SemanticTokenTypes.enumMember,
                modifier: SemanticTokenModifiers.declaration,
            });
        }

        if (AST.isAtom(node)) {
            acceptor({
                node,
                keyword: ":",
                type: SemanticTokenTypes.enumMember,
            });
            acceptor({
                node,
                property: "atom",
                type: SemanticTokenTypes.enumMember,
            });
        }

        if (AST.isParam(node)) {
            acceptor({
                node,
                property: "key",
                type: SemanticTokenTypes.parameter,
            });
            acceptor({
                node,
                keyword: "=",
                type: SemanticTokenTypes.operator,
            });
            // Highlight string/number values (Boolean and Slice handled by their own nodes)
            if (typeof node.value === "string") {
                acceptor({
                    node,
                    property: "value",
                    type: SemanticTokenTypes.string,
                });
            } else if (typeof node.value === "number") {
                acceptor({
                    node,
                    property: "value",
                    type: SemanticTokenTypes.number,
                });
            }
        }

        if (AST.isSlice(node)) {
            if (node.min !== undefined) {
                acceptor({
                    node,
                    property: "min",
                    type: SemanticTokenTypes.number,
                });
            }
            if (node.max !== undefined) {
                acceptor({
                    node,
                    property: "max",
                    type: SemanticTokenTypes.number,
                });
            }
            acceptor({
                node,
                keyword: "..",
                type: SemanticTokenTypes.operator,
            });
        }

        if (AST.isUnion(node)) {
            if (node.types.length > 1 || node.forcedUnion) {
                acceptor({
                    node,
                    keyword: "|",
                    type: SemanticTokenTypes.operator,
                });
            }
            if (node.closedUnion) {
                acceptor({
                    node,
                    keyword: "||",
                    type: SemanticTokenTypes.operator,
                });
            }
        }

        if (AST.isBoolean(node)) {
            // Why range instead of keyword: "True"/"False" are parsed as
            // alternatives, so we highlight the whole node's CST range.
            const range = node.$cstNode?.range;
            if (range) {
                acceptor({
                    node,
                    range,
                    type: SemanticTokenTypes.enumMember,
                });
            }
        }
    }

    private highlightDoc(
        node: { doc?: string } & AstNode,
        acceptor: SemanticTokenAcceptor,
    ) {
        if (node.doc) {
            acceptor({
                node,
                property: "doc",
                type: SemanticTokenTypes.comment,
                modifier: SemanticTokenModifiers.documentation,
            });
        }
    }

    // Why CST: array-of-string properties (like `throws`) have no per-element
    // AST property to target, so we find the STRING terminal nodes in the CST.
    private highlightStrings(
        node: AstNode,
        acceptor: SemanticTokenAcceptor,
    ) {
        const cst = node.$cstNode;
        if (!cst || !isCompositeCstNode(cst)) return;
        for (const child of cst.content) {
            if (isLeafCstNode(child) && child.tokenType.name === "STRING") {
                acceptor({
                    node,
                    range: child.range,
                    type: SemanticTokenTypes.string,
                });
            }
        }
    }
}
