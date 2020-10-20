import { ICancellable, Constructor, IDestroyable, ICancellation, IRemovable } from "./interfaces";

let _nextOid = 0;
const _oid = typeof Symbol === "function" ?
    Symbol("__implab__oid__") :
    "__implab__oid__";

export function oid(instance: null | undefined): undefined;
export function oid(instance: NonNullable<any>): string;
export function oid(instance: any): string | undefined {
    if (isNull(instance))
        return undefined;

    if (_oid in instance)
        return instance[_oid];
    else
        return (instance[_oid] = "oid_" + (++_nextOid));
}

const cancellationNone: ICancellation = {
    isSupported(): boolean {
        return false;
    },

    throwIfRequested(): void {
    },

    isRequested(): boolean {
        return false;
    },

    register(_cb: (e: any) => void): IDestroyable {
        return destroyed;
    }
};

export function keys<T>(arg: T): (Extract<keyof T, string>)[] {
    return isObject(arg) && arg ? Object.keys(arg) as (Extract<keyof T, string>)[] : [];
}

export function isKeyof<T>(k: string, target: T): k is Extract<keyof T, string> {
    return target && typeof target === "object" && k in target;
}

export function argumentNotNull(arg: any, name: string) {
    if (arg === null || arg === undefined)
        throw new Error("The argument " + name + " can't be null or undefined");
}

export function argumentNotEmptyString(arg: any, name: string) {
    if (typeof (arg) !== "string" || !arg.length)
        throw new Error("The argument '" + name + "' must be a not empty string");
}

export function argumentNotEmptyArray(arg: any, name: string) {
    if (!(arg instanceof Array) || !arg.length)
        throw new Error("The argument '" + name + "' must be a not empty array");
}

export function argumentOfType(arg: any, type: Constructor<{}>, name: string) {
    if (!(arg instanceof type))
        throw new Error("The argument '" + name + "' type doesn't match");
}

export function isNull(val: any): val is null | undefined {
    return (val === null || val === undefined);
}

export type primitive = symbol | string | number | boolean | undefined | null;

export function isPrimitive(val: any): val is primitive {
    return (val === null || val === undefined || typeof (val) === "string" ||
        typeof (val) === "number" || typeof (val) === "boolean");
}

export function isObject<T>(value: T): value is Exclude<T & object, primitive> {
    return !!(value && typeof value === "object");
}

export function isInteger(val: any): val is number {
    return parseInt(val, 10) === val;
}

export function isNumber(val: any): val is number {
    return parseFloat(val) === val;
}

export function isString(val: any): val is string {
    return typeof (val) === "string";
}

export function isPromise<T = any>(val: any): val is PromiseLike<T> {
    return !!(val && typeof val.then === "function");
}

export function isCancellable(val: any): val is ICancellable {
    return !!(val && typeof val.cancel === "function");
}

export function isNullOrEmptyString(val: any): val is ("" | null | undefined) {
    return (val === null || val === undefined ||
        ((typeof (val) === "string" || val instanceof String) && val.length === 0));
}

export function isNotEmptyArray<T = any>(arg: any): arg is T[] {
    return (arg instanceof Array && arg.length > 0);
}

function _isStrictMode(this: any) {
    return !this;
}

function _getNonStrictGlobal(this: any) {
    return this;
}

export function getGlobal() {
    // in es3 we can't use indirect call to eval, since it will
    // be executed in the current call context.
    if (!_isStrictMode()) {
        return _getNonStrictGlobal();
    } else {
        // tslint:disable-next-line:no-eval
        return eval.call(null, "this");
    }
}

export function get(member: string, context?: object) {
    argumentNotEmptyString(member, "member");
    let that = context || getGlobal();
    const parts = member.split(".");
    for (const m of parts) {
        if (!m)
            continue;
        if (isNull(that = that[m]))
            break;
    }
    return that;
}

/**
 * Выполняет метод для каждого элемента массива, останавливается, когда
 * либо достигнут конец массива, либо функция <c>cb</c> вернула
 * значение.
 *
 * @param {Array | Object} obj массив элементов для просмотра
 * @param {Function} cb функция, вызываемая для каждого элемента
 * @param {Object} thisArg значение, которое будет передано в качестве
 *                <c>this</c> в <c>cb</c>.
 * @returns {void}
 */
export function each<T>(obj: T, cb: <X extends Extract<keyof T, string>>(v: NonNullable<T[X]>, k: X) => void): void;
export function each<T>(array: T[], cb: (v: T, i: number) => void): void;
export function each(obj: any, cb: any, thisArg?: any): any;
export function each(obj: any, cb: any, thisArg?: any) {
    argumentNotNull(cb, "cb");
    if (obj instanceof Array) {
        let v: any;
        for (let i = 0; i < obj.length; i++) {
            v = obj[i];
            if (v !== undefined)
                cb.call(thisArg, v, i);
        }
    } else {
        Object.keys(obj).forEach(k => obj[k] !== undefined && cb.call(thisArg, obj[k], k));
    }
}

/** Copies property values from a source object to the destination and returns
 * the destination object.
 *
 * @param dest The destination object into which properties from the source
 *  object will be copied.
 * @param source The source of values which will be copied to the destination
 *  object.
 * @param template An optional parameter specifies which properties should be
 *  copied from the source and how to map them to the destination. If the
 *  template is an array it contains the list of property names to copy from the
 *  source to the destination. In case of object the templates contains the map
 *  where keys are property names in the source and the values are property
 *  names in the destination object. If the template isn't specified then the
 *  own properties of the source are entirely copied to the destination.
 *
 */
export function mixin<T extends object, S extends object>(dest: T, source: S, template?: (keyof S)[]): T & S;
export function mixin<T extends object, S extends object, R extends object = T>(dest: T, source: S, template: { [p in keyof S]?: keyof R; }): T & R;
export function mixin<T extends object, S extends object>(dest: T, source: S, template?: any): any {
    argumentNotNull(dest, "dest");
    const _res: any = dest as any;

    if (isPrimitive(source))
        return _res;

    if (template instanceof Array) {
        template.forEach(p => {
            if (isKeyof(p, source))
                _res[p] = source[p];
        });
    } else if (template) {
        keys(source).forEach(p => {
            if (isKeyof(p, template))
                _res[template[p]] = source[p];
        });
    } else {
        keys(source).forEach(p => _res[p] = source[p]);
    }

    return _res;
}

/** Wraps the specified function to emulate an asynchronous execution.
 * @param{Object} thisArg [Optional] Object which will be passed as 'this' to the function.
 * @param{Function|String} fn [Required] Function wich will be wrapped.
 */
export function async<T, F extends (...args: any[]) => T | PromiseLike<T>>(
    fn: F,
    thisArg?: ThisParameterType<F>
): (...args: Parameters<F>) => PromiseLike<T>;
export function async<T, M extends string, O extends { [m in M]?: (...args: any[]) => T | PromiseLike<T> }>(
    fn: M,
    thisArg: O
): (...args: Parameters<NonNullable<O[M]>>) => PromiseLike<T>;
export function async(_fn: any, thisArg: any): (...args: any[]) => PromiseLike<any> {
    let fn = _fn;

    if (arguments.length === 2 && !(fn instanceof Function))
        fn = thisArg[fn];

    if (fn == null)
        throw new Error("The function must be specified");

    function wrapresult(x: any, e?: any): PromiseLike<any> {
        if (e) {
            return {
                then(cb, eb) {
                    try {
                        return eb ? wrapresult(eb(e)) : this;
                    } catch (e2) {
                        return wrapresult(null, e2);
                    }
                }
            };
        } else {
            if (x && x.then)
                return x;
            return {
                then(cb) {
                    try {
                        return cb ? wrapresult(cb(x)) : this;
                    } catch (e2) {
                        return wrapresult(e2);
                    }
                }
            };
        }
    }

    return (...args) => {
        try {
            return wrapresult(fn.apply(thisArg, args));
        } catch (e) {
            return wrapresult(null, e);
        }
    };
}

export function delegate<T extends object, F extends (this: T, ...args: any[]) => any>(
    target: T,
    method: F
): OmitThisParameter<F>;
export function delegate<M extends string, T extends { [m in M]?: (...args: any[]) => any; }>(
    target: T,
    method: M
): OmitThisParameter<T[M]>;
export function delegate(target: any, _method: any): (...args: any[]) => any {
    let method: any;
    if (!(_method instanceof Function)) {
        argumentNotNull(target, "target");
        method = target[_method];
        if (!(method instanceof Function))
            throw new Error("'method' argument must be a Function or a method name");
    } else {
        method = _method;
    }

    return (...args) => {
        return method.apply(target, args);
    };
}

export function delay(timeMs: number, ct = cancellationNone) {
    ct.throwIfRequested();
    return new Promise((resolve, reject) => {
        const h = ct.register(e => {
            clearTimeout(id);
            reject(e);
            // we don't nedd to unregister h, since ct is already disposed
        });
        const id = setTimeout(() => {
            h.destroy();
            resolve();
        }, timeMs);

    });
}

/** Returns resolved promise, awaiting this method will cause the asynchronous
 * completion of the rest of the code.
 */
export function fork() {
    return Promise.resolve();
}

/** Always throws Error, can be used as a stub for the methods which should be
 * assigned later and are required to be not null.
 */
export function notImplemented(): never {
    throw new Error("Not implemented");
}
/**
 * Iterates over the specified array of items and calls the callback `cb`, if
 * the result of the callback is a promise the next item from the array will be
 * proceeded after the promise is resolved.
 *
 */
export function pmap<T, T2>(
    items: ArrayLike<T> | PromiseLike<ArrayLike<T>>,
    cb: (item: T, i: number) => T2 | PromiseLike<T2>
): T2[] | PromiseLike<T2[]> {
    argumentNotNull(cb, "cb");

    if (isPromise(items)) {
        return items.then(data => pmap(data, cb));
    } else {

        if (isNull(items) || !items.length)
            return [];

        let i = 0;
        const result = new Array<T2>();

        const next = (): any => {
            while (i < items.length) {
                const r = cb(items[i], i);
                const ri = i;
                i++;
                if (isPromise(r)) {
                    return r.then(x => {
                        result[ri] = x;
                        return next();
                    });
                } else {
                    result[ri] = r;
                }
            }
            return result;
        };

        return next();
    }
}

export function pfor<T>(
    items: ArrayLike<T> | PromiseLike<ArrayLike<T>>,
    cb: (item: T, i: number) => any
): void | PromiseLike<void> {
    argumentNotNull(cb, "cb");

    if (isPromise(items)) {
        return items.then(data => pfor(data, cb));
    } else {
        if (isNull(items) || !items.length)
            return;

        let i = 0;

        const next = (): any => {
            while (i < items.length) {
                const r = cb(items[i], i);
                i++;
                if (isPromise(r))
                    return r.then(next);
            }
        };

        return next();
    }
}

export function first<T>(sequence: ArrayLike<T>): T;
export function first<T>(sequence: PromiseLike<ArrayLike<T>>): PromiseLike<T>;
export function first<T>(
    sequence: ArrayLike<T> | PromiseLike<ArrayLike<T>>,
    cb?: (x: T) => void,
    err?: (x: Error) => void
): void;
/**
 * Выбирает первый элемент из последовательности, или обещания, если в
 * качестве параметра используется обещание, оно должно вернуть массив.
 *
 * @param {Function} cb обработчик результата, ему будет передан первый
 *                  элемент последовательности в случае успеха
 * @param {Function} err обработчик исключения, если массив пустой, либо
 *                  не массив
 *
 * @remarks Если не указаны ни cb ни err, тогда функция вернет либо
 *          обещание, либо первый элемент.
 * @async
 */
export function first<T>(
    sequence: ArrayLike<T> | PromiseLike<ArrayLike<T>>,
    cb?: (x: T) => void,
    err?: (x: Error) => void
) {
    if (isPromise(sequence)) {
        return sequence.then(res => first(res, cb as any /* force to pass undefined cb */, err));
    } else if (sequence && "length" in sequence) {
        if (sequence.length === 0) {
            if (err)
                return err(new Error("The sequence is empty"));
            else
                throw new Error("The sequence is empty");
        } else if (cb) {
            return cb(sequence[0]);
        } else {
            return sequence[0];
        }
    } else {
        if (err)
            return err(new Error("The sequence is required"));
        else
            throw new Error("The sequence is required");
    }
}

export function firstWhere<T>(
    sequence: ArrayLike<T>,
    predicate: (x: T) => boolean
): T;
export function firstWhere<T>(
    sequence: PromiseLike<ArrayLike<T>>,
    predicate: (x: T) => boolean
): PromiseLike<T>;
export function firstWhere<T>(
    sequence: ArrayLike<T> | PromiseLike<ArrayLike<T>>,
    predicate: (x: T) => boolean,
    cb: (x: T) => void,
    err?: (x: Error) => void
): void;

export function firstWhere<T>(
    sequence: ArrayLike<T> | PromiseLike<ArrayLike<T>>,
    predicate?: (x: T) => boolean,
    cb?: (x: T) => any,
    err?: (x: Error) => any
) {
    if (isPromise(sequence)) {
        return sequence.then(res => firstWhere(
            res,
            predicate as any /* force to pass undefined predicate */,
            cb as any /* force to pass undefined cb */,
            err)
        );
    } else if (sequence && "length" in sequence) {
        if (sequence.length === 0) {
            if (err)
                err(new Error("The sequence is empty"));
            else
                throw new Error("The sequence is empty");
        } else {
            if (!predicate) {
                return cb ? cb(sequence[0]) && void (0) : sequence[0];
            } else {
                for (let i = 0; i < sequence.length; i++) {
                    const v = sequence[i];
                    if (predicate(v))
                        return cb ? cb(v) : v;
                }
                if (err)
                    err(new Error("The sequence doesn't contain matching items"));
                else
                    throw new Error("The sequence doesn't contain matching items");
            }
        }
    } else {
        if (err)
            err(new Error("The sequence is required"));
        else
            throw new Error("The sequence is required");
    }
}

export function isDestroyable(d: any): d is IDestroyable {
    return !!(d && typeof d.destroy === "function");
}

export function isRemovable(value: any): value is IRemovable {
    return !!(value && typeof value.remove === "function");
}

export function destroy(d: any) {
    if (isDestroyable(d))
        d.destroy();
}

/**
 * Used to mark that the async operation isn't awaited intentionally.
 * @param p The promise which represents the async operation.
 */
export function nowait(p: Promise<any>) {
}

/** represents already destroyed object.
 */
export const destroyed = {
    /** Calling to this method doesn't affect anything, noop.
     */
    destroy() {
    }
};
