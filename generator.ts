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

function extractNamespace(ns: AST.Namespace) {
    const nsid = ns.name.segments.join(".");

    const records = ns.records.map((r) => {
        return {
            lexicon: 1,
            id: nsid + "." + r.name,
            description: r.doc,
            defs: extractDeclarations(r.body),
        };
    });

    return records;
}

function extractDeclarations(
    { atoms, objects, properties, refs }: AST.Declarations,
) {
    const props: Record<string, unknown> = {};
    for (const property of properties) {
        props[property.key] = extractUnion(property.value);
    }

    for (const r of refs) {
        const ref = r.ref.$refText;
        console.log(r);
        props[ref] = {
            type: "refrefgiojerig",
            ref: `#${ref}`,
        };
    }

    return { main: { type: "record", key: "tid", record: props } };
}

function extractUnion(u: AST.Union) {
    const singleMember = u.types.length === 1;

    if (!singleMember || u.forcedUnion) {
        return {
            type: "union",
            closed: !!u.closedUnion,
            refs: u.types.map((x) => extractUnionItem(x)),
        };
    } else {
        return extractUnionItem(u.types[0]);
    }
}

function extractUnionItem(t: AST.UnionItem, doc?: string) {
    // todo add docs to AST and accomodate them here
    const type = match(t)
        .with({ $type: "Atom" }, () => "atom")
        .with({ $type: "Type" }, (x) => extractType(x))
        .with({ $type: "Declarations" }, (x) => console.log("decl", x))
        .with(
            { $type: "GlobalRef" },
            ({ nsid, view }) => ({
                type: "ref",
                ref: nsid.segments.join(".") + (view ? `#${view}` : ""),
            }),
        )
        .with({ $type: "LocalRef" }, ({ ref }) => ({
            type: "ref",
            ref: `#${ref.ref!.name}`,
        }))
        .exhaustive();

    if ("array" in t && t.array) {
        return {
            type: "array",
            items: type,
            minLength: t.array.slice?.min,
            maxLength: t.array.slice?.max,
        };
    } else {
        return type;
    }
}

function extractType(t: AST.Type) {
    const params: Record<string, unknown> = {};
    if (t.props?.params) {
        for (const p of t.props?.params) {
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

    return match(t.type)
        .with("String", () => ({ type: "string", ...params }))
        .with("Integer", () => ({ type: "integer", ...params }))
        .with("Boolean", () => ({ type: "boolean" }))
        .with("Blob", () => ({ type: "blob", ...params }))
        .with("DateTime", () => ({ type: "string", format: "datetime" }))
        .with("Did", () => ({ type: "string", format: "did" }))
        .with("Uri", () => ({ type: "string", format: "uri" }))
        .exhaustive();
}

const output = JSON.parse(
    JSON.stringify(extractNamespace(model.namespaces[0])),
);
console.log(Deno.inspect(output, { depth: Infinity, colors: true }));
