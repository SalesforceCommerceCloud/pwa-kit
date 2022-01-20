import "source-map-support/register";
import * as trpc from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { z } from "zod";
import express from "express";
import { createServer, proxy } from "aws-serverless-express";
import type { Express } from "express";
import type { Server } from "http";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";

const appRouter = trpc
    .router()
    .query("getUserById", {
        input: z.object({ id: z.string() }),
        async resolve(req) {
            return {
                id: req.input.id,
                firstName: "Michael",
                lastName: "Scott",
                workplace: "Dunder Mifflin Inc.",
            };
        },
    })
    .mutation("createUser", {
        input: z.object({
            firstName: z.string(),
            lastName: z.string(),
            workplace: z.string(),
        }),
        async resolve(req) {
            return {
                firstName: req.input.firstName,
                lastName: req.input.lastName,
                workplace: req.input.workplace,
            };
        },
    });

export type AppRouter = typeof appRouter;

const app: Express = express();
app.set("json spaces", 4);

app.get("/", (_req: express.Request, res: express.Response) => {
    return res.json({ hello: "world" });
});

app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: () => ({}),
    })
);

const server: Server = createServer(app);
export function get(event: APIGatewayProxyEvent, context: Context) {
    proxy(server, event, context);
}

if (process.env.NODE_ENV === "development") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Running Express server @ http://127.0.0.1:${PORT}`);
    });
}
