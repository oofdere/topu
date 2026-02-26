import { Command } from "@cliffy/command";
import { createTopuServices } from "./module.ts";
import { NodeFileSystem } from "langium/node";
import { AstMetaData, Reduction, URI } from "langium";
import { resolve } from "node:path";
import * as AST from "./generated/ast.js";
import { extractNamespace } from "./generator.ts";

const { shared } = createTopuServices({ ...NodeFileSystem });

const cmd = new Command()
    .name("📦 topu")
    .description("atproto lexicon dsl")
    .version("0.1.0")
    .action(function () {
        this.showHelp();
    });

// COMPILE
cmd
    .command(
        "compile <source:file> [outdir:file]",
        "compile a .topu file to lexicon json",
    )
    .action(async (_, source, outdir) => {
        const dir = resolve(outdir ?? "./lexicons");
        await Deno.mkdir(dir, { recursive: true });

        const document = await getAST(source);
        const model = document.parseResult.value as AST.Model;
        const lexicons = extractNamespace(model.namespaces[0]);

        for (const lexicon of lexicons) {
            const path = resolve(dir, `${lexicon.id}.json`);
            await Deno.writeTextFile(path, JSON.stringify(lexicon, null, 2));
            console.log(`wrote ${path}`);
        }
    });

// CHECK
cmd.command("check <source:file>", "check a .topu file for errors")
    .action(async (_, source) => {
        await getAST(source);
    });

await cmd.parse();

async function getAST(path: string) {
    const uri = URI.file(resolve(path));
    const document = await shared.workspace.LangiumDocuments
        .getOrCreateDocument(
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

    return document;
}
