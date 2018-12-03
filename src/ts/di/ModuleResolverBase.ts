import { argumentNotEmptyString, get } from "../safe";

export abstract class ModuleResolverBase {

    async resolve(typeName: string) {
        argumentNotEmptyString(typeName, "typeName");
        const [moduleName, localName] = typeName.split("#", 2);

        const moduleObject = await this.loadModule(moduleName);
        return localName ? get(localName, moduleObject) : moduleObject;
    }

    beginBatch() {
    }

    completeBatch() {
    }

    abstract loadModule(moduleName: string): PromiseLike<object>;

    abstract createResolver(moduleName: string, opts?: object): PromiseLike<ModuleResolverBase>;
}
