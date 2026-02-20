import { AstNode, AstNodeDescription, DefaultLinker } from "langium";
import { Builtin } from "./generated/ast.js";

export class TopuLinker extends DefaultLinker {
    override loadAstNode(
        nodeDescription: AstNodeDescription,
    ): AstNode | undefined {
        if (nodeDescription.path.startsWith("internal:")) {
            return {
                $type: Builtin.$type,
                name: nodeDescription.name,
            } satisfies Builtin as Builtin;
        }
        return super.loadAstNode(nodeDescription);
    }
}
