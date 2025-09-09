import dotenv from "dotenv";
dotenv.config();

import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { getAbsoluteFSPath } from "swagger-ui-dist";

import { AccessError, InputError } from "./error.js";
import {
  getEmailFromAuthorization,
  getStore,
  login,
  logout,
  register,
  setStore,
  connectDB,
} from "./service.js";

await connectDB();

const port = process.env.PORT || 5005;
const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

const catchErrors = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err instanceof InputError) {
      res.status(400).send({ error: err.message });
    } else if (err instanceof AccessError) {
      res.status(403).send({ error: err.message });
    } else {
      console.error(err);
      res.status(500).send({ error: "A system error occurred" });
    }
  }
};

const authed = (fn) => async (req, res) => {
  const email = await getEmailFromAuthorization(req.header("Authorization"));
  await fn(req, res, email);
};

app.post("/admin/auth/login", catchErrors(async (req, res) => {
  const { email, password } = req.body;
  const token = await login(email, password);
  return res.json({ token });
}));

app.post("/admin/auth/register", catchErrors(async (req, res) => {
  const { email, password, name } = req.body;
  const token = await register(email, password, name);
  return res.json({ token });
}));

app.post("/admin/auth/logout", catchErrors(authed(async (req, res, email) => {
  await logout(email);
  return res.json({});
})));

app.get("/store", catchErrors(authed(async (req, res, email) => {
  const store = await getStore(email);
  return res.json({ store });
})));

app.put("/store", catchErrors(authed(async (req, res, email) => {
  await setStore(email, req.body.store);
  return res.json({});
})));

const swaggerPath = getAbsoluteFSPath();
app.use("/docs", express.static(swaggerPath));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(null, {
  swaggerOptions: { url: "/swagger.json" }
}));

app.get("/", (req, res) => res.redirect("/docs"));

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`For API docs, navigate to http://localhost:${port}`);
  });
}

export default app;