import { inject, type Module } from "langium";
import {
    createDefaultModule,
    createDefaultSharedModule,
    type DefaultSharedModuleContext,
    type LangiumServices,
    type LangiumSharedServices,
    type PartialLangiumServices,
} from "langium/lsp";
import {
    TopuGeneratedModule,
    TopuGeneratedSharedModule,
} from "./generated/module.ts";
import { TopuValidationRegistry } from "./validator.ts";
import { TopuScopeProvider } from "./scope.ts";
import { TopuLinker } from "./linker.ts";

export const TopuModule: Module<
    TopuServices,
    PartialLangiumServices & TopuAddedServices
> = {
    validation: {
        ValidationRegistry: (x) => new TopuValidationRegistry(x),
    },
    references: {
        ScopeProvider: (services) => new TopuScopeProvider(services),
        Linker: (services) => new TopuLinker(services),
    },
};

export function createTopuServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices;
    Topu: TopuServices;
} {
    const shared = inject(
        createDefaultSharedModule(context),
        TopuGeneratedSharedModule,
    );
    const Topu = inject(
        createDefaultModule({ shared }),
        TopuModule,
        TopuGeneratedModule,
    );
    shared.ServiceRegistry.register(Topu);
    //registerValidationChecks(Topu);
    if (!context.connection) {
        // We don't run inside a language server
        // Therefore, initialize the configuration provider instantly
        shared.workspace.ConfigurationProvider.initialized({});
    }
    return { shared, Topu };
}

export type TopuAddedServices = {
    validation: {
        ValidationRegistry: TopuValidationRegistry;
    };
    references: {
        ScopeProvider: TopuScopeProvider;
    };
};

export type TopuServices = LangiumServices & TopuAddedServices;
