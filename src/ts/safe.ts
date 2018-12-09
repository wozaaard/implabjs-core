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

export function argumentNotNull(arg, name) {
    if (arg === null || arg === undefined)
        throw new Error("The argument " + name + " can't be null or undefined");
}

export function argumentNotEmptyString(arg, name) {
    if (typeof (arg) !== "string" || !arg.length)
        throw new Error("The argument '" + name + "' must be a not empty string");
}

export function argumentNotEmptyArray(arg, name) {
    if (!(arg instanceof Array) || !arg.length)
        throw new Error("The argument '" + name + "' must be a not empty array");
}

export function argumentOfType(arg, type, name) {
    if (!(arg instanceof type))
        throw new Error("The argument '" + name + "' type doesn't match");
}

export function isNull(arg) {
    return (arg === null || arg === undefined);
}

export function isPrimitive(arg) {
    return (arg === null || arg === undefined || typeof (arg) === "string" ||
        typeof (arg) === "number" || typeof (arg) === "boolean");
}

export function isInteger(arg) {
    return parseInt(arg, 10) === arg;
}

export function isNumber(arg) {
    return parseFloat(arg) === arg;
}

export function isString(val) {
    return typeof (val) === "string" || val instanceof String;
}

export function isPromise(val): val is PromiseLike<any> {
    return "then" in val && val.then instanceof Function;
}

export function isNullOrEmptyString(str) {
    if (str === null || str === undefined ||
        ((typeof (str) === "string" || str instanceof String) && str.length === 0))
        return true;
}

export function isNotEmptyArray(arg): arg is Array<any> {
    return (arg instanceof Array && arg.length > 0);
}

export function getGlobal() {
    return this;
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
export function mixin<T, S>(dest: T, source: S, template?: string[] | object): T & S {
    argumentNotNull(dest, "to");
    const _res = dest as T & S;

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

/**
 * Для каждого элемента массива вызывает указанную функцию и сохраняет
 * возвращенное значение в массиве результатов.
 *
 * @remarks cb может выполняться асинхронно, при этом одновременно будет
 *          только одна операция.
 *
 * @async
 */
export function pmap(items, cb) {
    argumentNotNull(cb, "cb");

    if (isPromise(items))
        return items.then(data => pmap(data, cb));

    if (isNull(items) || !items.length)
        return items;

    let i = 0;
    const result = [];

    function next() {
        let r;
        let ri;

        function chain(x) {
            result[ri] = x;
            return next();
        }

        while (i < items.length) {
            r = cb(items[i], i);
            ri = i;
            i++;
            if (isPromise(r)) {
                return r.then(chain);
            } else {
                result[ri] = r;
            }
        }
        return result;
    }

    return next();
}

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
export function first(sequence, cb: (x) => any, err: (x) => any) {
    if (sequence) {
        if (isPromise(sequence)) {
            return sequence.then(res => first(res, cb, err));
        } else if (sequence && "length" in sequence) {
            if (sequence.length === 0) {
                if (err)
                    return err(new Error("The sequence is empty"));
                else
                    throw new Error("The sequence is empty");
            }
            return cb ? cb(sequence[0]) : sequence[0];
        }
    }

    if (err)
        return err(new Error("The sequence is required"));
    else
        throw new Error("The sequence is required");
}

export function destroy(d) {
    if (d && "destroy" in d)
        d.destroy();
}
