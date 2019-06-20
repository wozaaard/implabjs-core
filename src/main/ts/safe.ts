import { ICancellable, Constructor } from "./interfaces";
import { Cancellation } from "./Cancellation";

let _nextOid = 0;
const _oid = typeof Symbol === "function" ?
    Symbol("__implab__oid__") :
    "__implab__oid__";

export function oid(instance: object): string {
    if (isNull(instance))
        return null;

    if (_oid in instance)
        return instance[_oid];
    else
        return (instance[_oid] = "oid_" + (++_nextOid));
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

export function isNull(val: any) {
    return (val === null || val === undefined);
}

export function isPrimitive(val: any): val is string | number | boolean | undefined | null {
    return (val === null || val === undefined || typeof (val) === "string" ||
        typeof (val) === "number" || typeof (val) === "boolean");
}

export function isInteger(val: any): val is number {
    return parseInt(val, 10) === val;
}

export function isNumber(val: any): val is number {
    return parseFloat(val) === val;
}

export function isString(val: any): val is string {
    return typeof (val) === "string" || val instanceof String;
}

export function isPromise(val: any): val is PromiseLike<any> {
    return val && typeof val.then === "function";
}

export function isCancellable(val: any): val is ICancellable {
    return val && typeof val.cancel === "function";
}

export function isNullOrEmptyString(val: any): val is string | null | undefined {
    if (val === null || val === undefined ||
        ((typeof (val) === "string" || val instanceof String) && val.length === 0))
        return true;
}

export function isNotEmptyArray(arg: any): arg is Array<any> {
    return (arg instanceof Array && arg.length > 0);
}

function _isStrictMode() {
    return !this;
}

function _getNonStrictGlobal() {
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
 * @returns Результат вызова функции <c>cb</c>, либо <c>undefined</c>
 *          если достигнут конец массива.
 */
export function each(obj, cb, thisArg?) {
    argumentNotNull(cb, "cb");
    if (obj instanceof Array) {
        for (let i = 0; i < obj.length; i++) {
            const x = cb.call(thisArg, obj[i], i);
            if (x !== undefined)
                return x;
        }
    } else {
        const keys = Object.keys(obj);
        for (const k of keys) {
            const x = cb.call(thisArg, obj[k], k);
            if (x !== undefined)
                return x;
        }
    }
}

/** Copies property values from a source object to the destination and returns
 * the destination onject.
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
export function mixin<T extends object, S extends object>(dest: T, source: S, template?: string[] | object): T & S {
    argumentNotNull(dest, "to");
    const _res = dest as T & S;

    if (isPrimitive(source))
        return _res;

    if (template instanceof Array) {
        for (const p of template) {
            if (p in source)
                _res[p] = source[p];
        }
    } else if (template) {
        const keys = Object.keys(source);
        for (const p of keys) {
            if (p in template)
                _res[template[p]] = source[p];
        }
    } else {
        const keys = Object.keys(source);
        for (const p of keys)
            _res[p] = source[p];
    }

    return _res;
}

/** Wraps the specified function to emulate an asynchronous execution.
 * @param{Object} thisArg [Optional] Object which will be passed as 'this' to the function.
 * @param{Function|String} fn [Required] Function wich will be wrapped.
 */
export function async(_fn: (...args: any[]) => any, thisArg): (...args: any[]) => PromiseLike<any> {
    let fn = _fn;

    if (arguments.length === 2 && !(fn instanceof Function))
        fn = thisArg[fn];

    if (fn == null)
        throw new Error("The function must be specified");

    function wrapresult(x, e?): PromiseLike<any> {
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

type _AnyFn = (...args) => any;

export function delegate<T, K extends keyof T>(target: T, _method: (K | _AnyFn)) {
    let method;
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

export function delay(timeMs: number, ct = Cancellation.none) {
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

        const next = () => {
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

        const next = () => {
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
    cb: (x: T) => void,
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
        return sequence.then(res => first(res, cb, err));
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
        return sequence.then(res => firstWhere(res, predicate, cb, err));
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

export function destroy(d: any) {
    if (d && "destroy" in d)
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
