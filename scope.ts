import {
    AstNodeDescription,
    DefaultScopeProvider,
    MapScope,
    ReferenceInfo,
    Scope,
} from "langium";
import { Builtin } from "./generated/ast.js";

export class TopuScopeProvider extends DefaultScopeProvider {
    // constructor(services: any) {
    //     console.log("topuscopeproviderloaded");
    //     super(services);
    // }
    // override getGlobalScope(
    //     referenceType: string,
    //     _context: ReferenceInfo,
    // ): Scope {
    //     // 1. Log what the linker is actually asking for
    //     console.log(`Linker is looking for: "${referenceType}"`);

    //     // 2. Log the property name it's trying to resolve
    //     console.log(`Reference property: ${_context.property}`);

    //     const globalScope = super.getGlobalScope(referenceType, _context);

    //     // Check if the linker is looking for your 'Builtin' rule
    //     if (referenceType === Builtin.$type) {
    //         const names = [
    //             "String",
    //             "Boolean",
    //             "Integer",
    //             "Blob",
    //             "DateTime",
    //             "StrongRef",
    //         ];

    //         const builtins: AstNodeDescription[] = names.map((name) => ({
    //             name,
    //             type: Builtin.$type, // Matches your grammar rule name
    //             path: `internal:builtin:${name}`,
    //             documentUri: _context.container.$document?.uri!,
    //             // Synthetic nodes have no physical location
    //             nameSegment: undefined,
    //             selectionSegment: undefined,
    //         }));

    //         console.log(`Injecting ${builtins.length} builtins...`);

    //         // We place builtins "in front" of the global scope
    //         return new MapScope(builtins, globalScope);
    //     }

    //     return globalScope;
    // }
    // override getScope(context: ReferenceInfo): Scope {
    //     console.log(context.container.$type);
    //     return super.getScope(context);
    // }
}
