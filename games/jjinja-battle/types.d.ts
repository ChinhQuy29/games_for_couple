// Public surface used by the shared Games for Two server. Kept separate so the server's
// stricter tsconfig checks this contract rather than Jjinja's internals (which have their own tsconfig).
import type { IncomingMessage, Server, ServerResponse } from "node:http";

export declare const BASE_PATH: "/jjinja";
export declare function handleHttp(req: IncomingMessage, res: ServerResponse): Promise<void>;
export declare function attachJjinja(server: Server): void;
