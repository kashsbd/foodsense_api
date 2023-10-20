const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require('dotenv').config();

const mongoUrl = process.env.DB_URL;
const dbName = process.env.DB_NAME;

let db;

async function connectDB() {
  try {
    const client = await MongoClient.connect(mongoUrl)
    //   useUnifiedTopology: true,
    // });
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
server.post("/login", async (req, res) => { });

server.post("/signup", async (req, res) => { });

// foods api
server.get("/users/:userId/foods", async (req, res) => { });

server.post("/users/:userId/foods", async (req, res) => { });

server.put("/users/:userId/foods/:foodId", async (req, res) => { });

server.delete("/users/:userId/foods/:foodId", async (req, res) => { });

server.get("/users/:userId/notes", async (req, res) => { });

server.get("/users/:userId/notes", async (req, res) => {
  try {
    const userId = req.params.userId;
    const notes = await db.collection(dbName).findOne({ _id: new ObjectId(userId) });
    if (notes) {
      res.status(200).send({ success: true, data: notes })
    }
  } catch (error) {
    res.status(500).send({ success: false, error: 'Internal server Error' })
  }
});

server.post("/users/:userId/notes", async (req, res) => {
  try {
    const notes=req.body;
    notes.date = new Date();
    notes._id=new ObjectId();
    const result = await db.collection(dbName).updateOne({ _id: new ObjectId(req.params.userId)}, {$push: { notes: notes } });
    if (result) {
      res.status(200).send({ success: true, data: result });
    }
  } catch (error) {
    res.status(500).send({ success: false, error: 'Internal Server Error' })
  }

});

// profile api
server.post("/users/me", async (req, res) => { });

const port = process.env.PORT;
server.listen(port, () => {
  console.log("Server is listening on port ", port);
});
