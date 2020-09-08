import { isPrimitive, isNull } from "../safe";

export class Converter {
    static readonly default = new Converter();

    convert(value: any, pattern?: string) {
        if (pattern && pattern.toLocaleLowerCase() === "json") {
            const seen: any[] = [];
            return JSON.stringify(value, (k, v) => {
                if (!isPrimitive(v)) {
                    const id = seen.indexOf(v);
                    if (id >= 0)
                        return "@ref-" + id;
                    else {
                        seen.push(v);
                        return v;
                    }
                } else {
                    return v;
                }
            }, 2);
        } else if (isNull(value)) {
            return "";
        } else if (value instanceof Date) {
            return value.toISOString();
        } else {
            return value.toString();
        }
    }
}
