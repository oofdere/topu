import { createTopuServices } from "./module.ts";
import { NodeFileSystem } from "langium/node";
import { AstMetaData, Reduction, URI } from "langium";
import { resolve } from "node:path";
import { match } from "ts-pattern";
import * as AST from "./generated/ast.js";
import { toCamelCase } from "@std/text";

const { shared } = createTopuServices({ ...NodeFileSystem });

const filePath = resolve(Deno.args[0]);
const uri = URI.file(filePath);

const document = await shared.workspace.LangiumDocuments.getOrCreateDocument(
    uri,
);
await shared.workspace.DocumentBuilder.build([document]);

const parseErrors = document.parseResult.parserErrors;
const linkErrors = (document.diagnostics ?? []).filter(
    (d) => d.code === "linking-error",
);

if (parseErrors.length > 0 || linkErrors.length > 0) {
    if (parseErrors.length) console.error("Parse errors:", parseErrors);
    if (linkErrors.length) console.error("Link errors:", linkErrors);
    Deno.exit(1);
}

const model = document.parseResult.value as AST.Model;

const skipCircular = (key: string, value: unknown) =>
    key.startsWith("$") ? undefined : value;

//console.log(JSON.stringify(model, skipCircular, 2));

function extractNamespace(
    { name, records, objects, functions }: AST.Namespace,
) {
    const nsid = name.segments.join(".");

    const lexicons = [
        ...records.map((r) => extractRecord(r, nsid)),
        ...objects.map((o) => extractObject(o, nsid)),
        ...functions.map((f) => extractFunction(f, nsid)),
    ];

    return lexicons;
}

function extractRecord(x: AST.Record, nsid: string) {
    const { main, defs } = extractDeclarations(x.body);

    return {
        id: `${nsid}.${x.name}`,
        defs: {
            main: {
                type: "record",
                description: x.doc,
                properties: main,
            },
            ...defs,
        },
    };
}

function extractObject(x: AST.Obj, nsid: string) {
    return {
        id: `${nsid}.${x.name}`,
        defs: {
            main: {
                type: "object",
            },
        },
    };
}

function extractFunction(x: AST.Fn, nsid: string) {
    return {
        id: `${nsid}.${x.name}`,
        defs: {
            main: {
                type: "function",
            },
        },
    };
}

function extractDeclarations(
    { atoms, objects, properties, refs, ...x }: AST.Declarations,
    nsid?: string,
) {
    return {
        main: Object.fromEntries([
            ...properties.map((x) => [x.key, extractProperty(x)]),
            ...refs.map((x) => [x.ref.$refText, extractLocalRef(x)]),
        ]),
        defs: Object.fromEntries([
            ...objects.map((x) => extractObjectDeclaration(x)),
            ...atoms.map((x) => extractAtomDeclaration(x)),
        ]),
    };
}

function extractLocalRef({ ref, ...x }: AST.LocalRef) {
    return {
        type: "ref" as const,
        ref: `#${ref.$refText}`,
    };
}

function extractProperty(
    { doc, key, value, ...x }: AST.Property,
): Record<string, unknown> {
    return { description: doc, ...extractUnion(value) };
}

function extractUnion(
    { closedUnion, forcedUnion, types, array, ...x }: AST.Union,
) {
    if (types.length === 1 && !closedUnion && !forcedUnion) {
        return extractUnionItem(types[0]);
    }

    return {
        type: "union",
        closed: closedUnion,
        refs: types.map((x) => extractUnionItem(x)),
    };
}

function extractUnionItem(x: AST.UnionItem) {
    return match(x)
        .with({ $type: "Atom" }, (x) => extractAtom(x))
        .with({ $type: "Type" }, (x) => extractType(x))
        .with({ $type: "Declarations" }, (x) => extractDeclarations(x))
        .with({ $type: "GlobalRef" }, (x) => extractGlobalRef(x))
        .with({ $type: "LocalRef" }, (x) => extractLocalRef(x))
        .exhaustive();
}

function extractAtom(x: AST.Atom) {
    return {
        type: "ref",
        ref: `#${x.atom.$refText}`,
    };
}

function extractType({ type, array, props, ...x }: AST.Type) {
    const params: Record<string, unknown> = {};
    if (props?.params) {
        for (const p of props?.params) {
            match(p.value)
                .with({ $type: "Slice" }, ({ min, max }) => {
                    params[toCamelCase("min " + p.key)] = min;
                    params[toCamelCase("max " + p.key)] = max;
                })
                .with(
                    { $type: "Boolean" },
                    () => params[p.key] = p.value === "true",
                )
                .otherwise(() => params[p.key] = p.value);
        }
    }

    return match(type)
        .with("String", () => ({ type: "string", ...params }))
        .with("Integer", () => ({ type: "integer", ...params }))
        .with("Boolean", () => ({ type: "boolean" }))
        .with("Blob", () => ({ type: "blob", ...params }))
        .with("DateTime", () => ({ type: "string", format: "datetime" }))
        .with("Did", () => ({ type: "string", format: "did" }))
        .with("Uri", () => ({ type: "string", format: "uri" }))
        .exhaustive();
}

function extractGlobalRef({ nsid, array, ...x }: AST.GlobalRef) {
    return {
        type: "ref",
        ref: `${nsid.segments.join(".")}${x.view ? `#${x.view}` : ""}`,
    };
}

function extractObjectDeclaration(x: AST.Obj) {
    return [x.name, { todo: true }];
}

function extractAtomDeclaration(x: AST.AtomDecl) {
    return [x.name, { todo: true }];
}

const output = JSON.parse(
    JSON.stringify(extractNamespace(model.namespaces[0])),
);
console.log(
    Deno.inspect(output, { depth: Infinity, colors: true, compact: false }),
);

// function extractDeclarations(
//     { atoms, objects, properties, refs }: AST.Declarations,
// ) {
//     const props: Record<string, unknown> = {};
//     for (const property of properties) {
//         props[property.key] = extractUnion(property.value);
//     }

//     for (const r of refs) {
//
//     }

//     const obj: Record<string, unknown> = {};
//     for (const o of objects) {
//         console.log("extracting" + o.name);
//         obj[o.name] = extractObj(o);
//         console.log(obj);
//     }

//     return {
//         required: properties.filter((x) => !x.optional).map((x) => x.key),
//         main: props,
//         ...obj,
//     };
// }

// function extractObj(o: AST.Obj) {
//     for (const prop of o.properties) {
//     }
//     return {
//         type: "object",
//         description: undefined,
//         required: o.properties.filter((x) => !x.optional).map((x) => x.key),
//         nullable: undefined,
//     };
// }

// function extractUnion(u: AST.Union) {
//     const singleMember = u.types.length === 1;

//     if (!singleMember || u.forcedUnion) {
//         return {
//             type: "union",
//             closed: !!u.closedUnion,
//             refs: u.types.map((x) => extractUnionItem(x)),
//         };
//     } else {
//         return extractUnionItem(u.types[0]);
//     }
// }

// function extractUnionItem(t: AST.UnionItem, doc?: string) {
//     // todo add docs to AST and accomodate them here
//     const type = match(t)
//         .with({ $type: "Atom" }, () => "atom")
//         .with({ $type: "Type" }, (x) => extractType(x))
//         .with({ $type: "Declarations" }, (x) => console.log("decl", x))
//         .with(
//             { $type: "GlobalRef" },
//             ({ nsid, view }) => ({
//                 type: "ref",
//                 ref: nsid.segments.join(".") + (view ? `#${view}` : ""),
//             }),
//         )
//         .with({ $type: "LocalRef" }, ({ ref }) => ({
//             type: "ref",
//             ref: `#${ref.ref!.name}`,
//         }))
//         .exhaustive();

//     if ("array" in t && t.array) {
//         return {
//             type: "array",
//             items: type,
//             minLength: t.array.slice?.min,
//             maxLength: t.array.slice?.max,
//         };
//     } else {
//         return type;
//     }
// }

// function extractType(t: AST.Type) {

// }
