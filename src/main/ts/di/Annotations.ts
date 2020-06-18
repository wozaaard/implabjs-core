import { Constructor } from "../interfaces";

export interface InjectOptions {
    lazy?: boolean;
}

export function inject<I extends { [name in keyof I]: (v: any) => void } >(dependency: string) {
    return <M extends keyof I>(target: any, memberName: M, descriptor: TypedPropertyDescriptor<I[M]> ) => {

    };
}
