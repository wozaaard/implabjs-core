import * as module from "module";
import { TraceSource } from "../log/TraceSource";
import { compile } from "./StringFormat";

const logger = TraceSource.get(module.id);

logger.warn("The module is deprecated, use StringFormat.compile() method directly");

export = compile;
