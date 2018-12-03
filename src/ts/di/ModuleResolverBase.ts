import { argumentNotEmptyString, get } from "../safe";

export abstract class ModuleResolverBase {


    async resolve(typeName: string) {
        argumentNotEmptyString(typeName, "typeName");
        let [moduleName, localName] = typeName.split("#", 2);

        let moduleObject = await this.loadModule(moduleName);
        return localName ? get(localName, moduleObject) : moduleObject;
    }

    abstract loadModule(moduleName: string): PromiseLike<Object>

    abstract createResolver(moduleName: string): PromiseLike<ModuleResolverBase>
}