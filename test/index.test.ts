import Client from "../src/index";
import express, { NextFunction, Request, Response } from "express";
import request from "supertest";
import { Level } from "../src/types";
import "dotenv/config";

const client1 = new Client({
  client_id: process.env.FIRST_CLIENT_ID || "",
  client_secret: process.env.FIRST_CLIENT_SECRET || "",
});

const client2 = new Client({
  client_id: process.env.SECOND_CLIENT_ID || "",
  client_secret: process.env.SECOND_CLIENT_SECRET || "",
});

it("applies tracingHandler middleware", async () => {
  const app = express();

  app.use(client1.tracingHandler());

  app.get("/", (_, res) => {
    res.send("OK");
  });

  await request(app).get("/").send({}).expect("OK");
});

it("should capture error and pass on to next the middleware", async () => {
  const app = express();

  app.use(client1.tracingHandler());

  app.get("/", () => {
    throw new Error();
  });

  app.use(client1.errorHandler());
  app.use((_: Error, __: Request, res: Response, ___: NextFunction) => {
    res.sendStatus(503);
  });

  await request(app).get("/").send({}).expect(503);
});

it("should set res.locals.error", async () => {
  const app = express();

  app.use(client1.tracingHandler());

  app.get("/", () => {
    throw new Error("unknown error");
  });

  app.use(client1.errorHandler());

  let error: any = null;

  app.use((_: Error, __: Request, res: Response, ___: NextFunction) => {
    error = res.locals.error;

    res.status(500).send({ message: "unknown" });
  });

  await request(app).get("/").send({}).expect(500);

  expect(error.message).toEqual("unknown error");
});

it("should creates a custom log data", async () => {
  const app = express();

  app.post("/", async (req, res) => {
    await client1.log(req, res, { data: "custom log data" }, (data) => {
      expect(data).toBeDefined();
    });

    res.sendStatus(200);
  });

  await request(app).post("/").send({}).expect(200);
});

it("should creates a custom log data using record function", async () => {
  const app = express();

  app.post("/", async (_, res) => {
    await client1.record(
      { data: "custom log data", tags: ["record"], level: Level.DEBUG },
      (data) => {
        expect(typeof data.metadata).toBe("string");
        expect(data.tags).toEqual(["record"]);
        expect(data.level).toBe("DEBUG");
        expect(typeof data.timestamp).toBe("number");
      }
    );

    res.sendStatus(200);
  });

  await request(app).post("/").send({}).expect(200);
});

it("can search a log event", async () => {
  const app = express();

  app.post("/", async (req, res) => {
    await client1.log(req, res, { data: "dummy" }, (data) => {
      expect(data).toBeDefined();
    });

    const result = await client1.search("dummy");

    expect(result.nbhits).toBeGreaterThan(0);
    expect(result.hits[0]?.metadata?.data).toBe("dummy");

    res.sendStatus(200);
  });

  await request(app).post("/").send({}).expect(200);
});

it("cannot search a log from different application_id", async () => {
  const results = await client2.search("dummy");

  expect(results).toEqual(
    expect.objectContaining({
      hits: [],
      nbhits: 0,
    })
  );
});
