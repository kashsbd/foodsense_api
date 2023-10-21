const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { validateToken } = require("./middleware");

const mongoUrl = process.env.DB_URL;
const dbName = process.env.DB_NAME;

let db;

async function connectDB() {
  try {
    const client = await MongoClient.connect(mongoUrl, {
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
    db = client.db(dbName);
  } catch (err) {
    console.error("Error connecting to MongoDB: " + err);
  }
}

connectDB();

const server = express();
server.use(express.json());
server.use(cors());

// auth api
server.post("/login", async (req, res) => {
  const body = req.body;

  try {
    const hashedPassword = await bcrypt.hash(body?.password, 10);
    const owner = await db
      .collection("owners")
      .findOne({ email: body?.email, password: hashedPassword });

    if (owner) {
      const token = await jwt.sign(
        { userId: owner?._id, email: owner?.email },
        process.env.JWT_SECRET
      );
    } else {
      res.status(401).send({
        success: false,
        error: "Wrong email or password is provided.",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, error: error?.message });
  }
});

server.post("/signup", async (req, res) => {
  const body = req.body;

  try {
    const allOwners = await db
      .collection("owners")
      .find({ email: body?.email })
      .toArray();

    if (allOwners?.length > 0) {
      res
        .status(409)
        .send({ success: false, error: "Please use another email." });
    }

    const hashedPassword = await bcrypt.hash(body?.password, 10);
    await db
      .collection("owners")
      .insertOne({ ...body, password: hashedPassword });

    res.status(201).send({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, error: error?.message });
  }
});

server.use(validateToken);

// foods api
server.get("/users/:userId/foods", async (req, res) => {});

server.post("/users/:userId/foods", async (req, res) => {});

server.put("/users/:userId/foods/:foodId", async (req, res) => {});

server.delete("/users/:userId/foods/:foodId", async (req, res) => {});

server.get("/users/:userId/notes", async (req, res) => {});

// notes api
server.get("/users/:userId/notes", async (req, res) => {});

server.post("/users/:userId/notes", async (req, res) => {});

// profile api
server.post("/users/me", async (req, res) => {});

const port = process.env.PORT;
server.listen(port, () => {
  console.log("Server is listening on port ", port);
});
