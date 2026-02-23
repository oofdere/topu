import {
    ValidationAcceptor,
    type ValidationChecks,
    ValidationRegistry,
} from "langium";
import type { Builtin, TopuAstType, Type } from "./generated/ast.ts";
import { isBoolean, isSlice } from "./generated/ast.ts";
import type { TopuServices } from "./module.ts";

const isNumber = (x: unknown) => typeof x === "number";

const isString = (x: unknown) => typeof x === "string";

const paramLookup: Record<Builtin, Record<string, (item: unknown) => boolean>> =
    {
        Boolean: {
            default: isBoolean,
            const: isBoolean,
        },
        Integer: {
            range: isSlice,
            // enum
            default: isNumber,
            const: isNumber,
        },
        String: {
            format: isString,
            length: isSlice,
            graphemes: isSlice,
            // knownValues
            // enum
            default: isString,
            const: isString,
        },
        // Bytes: {
        //     length: isSlice,
        // },
        Blob: {
            accept: isString, // eventually this needs to become an array of strings
            size: isSlice,
        },
        //CidLink: {},
        //StrongRef: {},
        Did: {},
        Uri: {},
        DateTime: {},
    };

export class TopuValidationRegistry extends ValidationRegistry {
    constructor(services: TopuServices) {
        super(services);
        const checks: ValidationChecks<TopuAstType> = {
            Type: this.checkType,
        };
        this.register(checks, this);
    }

    checkType(node: Type, accept: ValidationAcceptor) {
        const params = paramLookup[node.type];
        if (node.props) {
            if (params) {
                const paramNames = new Map();
                for (const param of node.props.params) {
                    // check if param key exists
                    if (!params[param.key]) {
                        accept(
                            "error",
                            "Type does not have param " + param.key,
                            { node: param },
                        );
                        continue;
                    }

                    // check if param key duplicated
                    if (paramNames.has(param.key)) {
                        console.log(param.key, paramNames);
                        accept("error", "Type cannot have duplicate params", {
                            node: param,
                        });
                        continue;
                    }
                    paramNames.set(param.key, undefined);

                    // check if param value is valid
                    console.log(params);
                    if (!params[param.key](param.value)) {
                        accept(
                            "error",
                            "Type param " + param.key + " is invalid",
                            {
                                node: param,
                            },
                        );
                        continue;
                    }
                }
            } else {
                accept("error", "Unknown type", { node });
            }
        }
    }
}
