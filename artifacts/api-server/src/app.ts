import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

/* =========================
   LOGGER (compatível Vercel)
========================= */
const httpLogger = (pinoHttp as unknown as Function)({
  logger,
  serializers: {
    req(req: Request) {
      return {
        id: (req as any).id,
        method: req.method,
        url: req.url?.split("?")[0],
      };
    },
    res(res: Response) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

app.use(httpLogger);

/* =========================
   MIDDLEWARES
========================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   ROUTES
========================= */
app.use("/api", router);

export default app;
