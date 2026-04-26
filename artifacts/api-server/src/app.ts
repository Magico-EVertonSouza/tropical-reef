import express, { type Express } from "express";
import cors from "cors";
import * as pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

/* =========================
   LOGGER (Vercel safe)
========================= */
const httpLogger = pinoHttp.default({
  logger,
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url?.split("?")[0],
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

app.use(httpLogger);

/* =========================
   MIDDLEWARES BASE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   ROUTES
========================= */
app.use("/api", router);

/* =========================
   EXPORT APP
========================= */
export default app;
