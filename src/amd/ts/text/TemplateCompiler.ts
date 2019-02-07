import * as format from "./format";
import { TraceSource, DebugLevel } from "../log/TraceSource";
import { ITemplateParser, TokenType } from "./TemplateParser";
import m = require("module");

const trace = TraceSource.get(m.id);

type TemplateFn = (obj: object) => string;

export class TemplateCompiler {

    _data: string[];
    _code: string[];
    _wrapWith = true;

    constructor() {
        this._code = [];
        this._data = [];
    }

    compile(parser: ITemplateParser): TemplateFn {
        this.preamble();
        this.visitTemplate(parser);
        this.postamble();

        const text = this._code.join("\n");

        try {
            // tslint:disable-next-line:function-constructor
            const compiled = new Function("obj, format, $data", text);
            /**
             * Функция форматирования по шаблону
             *
             * @type{Function}
             * @param{Object} obj объект с параметрами для подстановки
             */
            return (obj: object) => compiled(obj || {}, format, this._data);
        } catch (e) {
            trace.traceEvent(DebugLevel, [e, text, this._data]);
            throw e;
        }
    }

    preamble() {
        this._code.push(
            "var $p = [];",
            "var print = function(){",
            "   $p.push(format.apply(null,arguments));",
            "};"
        );

        if (this._wrapWith)
            this._code.push("with(obj){");
    }

    postamble() {
        if (this._wrapWith)
            this._code.push("}");

        this._code.push("return $p.join('');");
    }

    visitTemplate(parser: ITemplateParser) {
        while (parser.next()) {
            switch (parser.token()) {
                case TokenType.OpenBlock:
                    this.visitCode(parser);
                    break;
                case TokenType.OpenInlineBlock:
                    this.visitInline(parser);
                    break;
                default:
                    this.visitTextFragment(parser);
                    break;
            }
        }
    }

    visitInline(parser: ITemplateParser) {
        const code = ["$p.push("];
        while (parser.next()) {
            if (parser.token() === TokenType.CloseBlock)
                break;
            code.push(parser.value());
        }
        code.push(");");
        this._code.push(code.join(""));
    }

    visitCode(parser: ITemplateParser) {
        const code = [];
        while (parser.next()) {
            if (parser.token() === TokenType.CloseBlock)
                break;
            code.push(parser.value());
        }
        this._code.push(code.join(""));
    }

    visitTextFragment(parser: ITemplateParser) {
        const i = this._data.push(parser.value()) - 1;
        this._code.push("$p.push($data[" + i + "]);");
    }
}
