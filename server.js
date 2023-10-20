const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

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
server.post("/login", async (req, res) => {});

server.post("/signup", async (req, res) => {});

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
