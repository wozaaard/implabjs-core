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
    return parseInt(arg) == arg;
}

export function isNumber(arg) {
    return parseFloat(arg) == arg;
}

export function isString(val) {
    return typeof (val) == "string" || val instanceof String;
}

export function isNullOrEmptyString(str) {
    if (str === null || str === undefined ||
        ((typeof (str) == "string" || str instanceof String) && str.length === 0))
        return true;
}

export function isNotEmptyArray(arg): arg is Array<any> {
    return (arg instanceof Array && arg.length > 0);
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
    var i, x;
    if (obj instanceof Array) {
        for (i = 0; i < obj.length; i++) {
            x = cb.call(thisArg, obj[i], i);
            if (x !== undefined)
                return x;
        }
    } else {
        var keys = Object.keys(obj);
        for (i = 0; i < keys.length; i++) {
            var k = keys[i];
            x = cb.call(thisArg, obj[k], k);
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
export function mixin<T,S>(dest: T, source: S, template?: string[] | object) : T & S {
    argumentNotNull(dest, "to");
    let _res = <T & S>dest;

    if (template instanceof Array) {
        for(let i = 0; i < template.length; i++) {
            let p = template[i];
            if (p in source)
                _res[p] = source[p];
        }
    } else if (template) {
        let keys = Object.keys(source);
        for(let i = 0; i < keys.length; i++) {
            let p = keys[i];
            if (p in template)
                _res[template[p]] = source[p];
        }
    } else {
        let keys = Object.keys(source);
        for(let i = 0; i < keys.length; i++) {
            let p = keys[i];
            _res[p] = source[p];
        }
    }

    return _res;
}

/** Wraps the specified function to emulate an asynchronous execution.
 * @param{Object} thisArg [Optional] Object which will be passed as 'this' to the function.
 * @param{Function|String} fn [Required] Function wich will be wrapped.
 */
export function async(_fn: (...args: any[]) => any, thisArg): (...args: any[]) => PromiseLike<any> {
    let fn = _fn;

    if (arguments.length == 2 && !(fn instanceof Function))
        fn = thisArg[fn];

    if (fn == null)
        throw new Error("The function must be specified");

    function wrapresult(x, e?): PromiseLike<any> {
        if (e) {
            return {
                then: function (cb, eb) {
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
                then: function (cb) {
                    try {
                        return cb ? wrapresult(cb(x)) : this;
                    } catch (e2) {
                        return wrapresult(e2);
                    }
                }
            };
        }
    }

    return function () {
        try {
            return wrapresult(fn.apply(thisArg, arguments));
        } catch (e) {
            return wrapresult(null, e);
        }
    };
}

export function delegate<T, K extends keyof T>(target: T, _method: (K | Function)) {
    let method;

    if (!(_method instanceof Function)) {
        argumentNotNull(target, "target");
        method = target[_method];
        if (!(method instanceof Function))
            throw new Error("'method' argument must be a Function or a method name");
    } else {
        method = _method;
    }

    return function () {
        return method.apply(target, arguments);
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

    if (items && items.then instanceof Function)
        return items.then(function (data) {
            return pmap(data, cb);
        });

    if (isNull(items) || !items.length)
        return items;

    var i = 0,
        result = [];

    function next() {
        var r, ri;

        function chain(x) {
            result[ri] = x;
            return next();
        }

        while (i < items.length) {
            r = cb(items[i], i);
            ri = i;
            i++;
            if (r && r.then) {
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
export function first(sequence: any, cb: Function, err: Function) {
    if (sequence) {
        if (sequence.then instanceof Function) {
            return sequence.then(function (res) {
                return first(res, cb, err);
            }, err);
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

export function destroy(d: any) {
    if (d && 'destroy' in d)
        d.destroy();
}