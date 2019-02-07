import { ModuleResolver } from "./Configuration";

export declare function makeResolver(moduleName?: string, contextRequire?: any): Promise<ModuleResolver>;