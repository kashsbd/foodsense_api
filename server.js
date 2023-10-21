require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { validateToken } = require("./middleware");

const mongoUrl = process.env.DB_URL;
const dbName = process.env.DB_NAME;
const COLLECTION_OWNER = "owner";

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

//insert Owner
server.post("/users", async (req, res) => {
  const newOwner = req.body;
  try {
    await db.collection(COLLECTION_OWNER).insertOne(newOwner);
    res.status(201).send({ success: true, data: newOwner });
  } catch (error) {
    res.status(500).send({ success: false, error: "Server Error" });
  }
});
//Get all foods

server.get("/users/:userId/foods", async (req, res) => {
  const userId = req.params.userId;
  try {
    const data = await db
      .collection(COLLECTION_OWNER)
      .findOne({ _id: new ObjectId(userId) });
    if (data) {
      res.status(200).send({ success: true, data: data.foods });
    } else {
      res.status(404).send({ success: false, error: "Owner not found" });
    }
  } catch (error) {
    res
      .status(500)
      .send({ success: false, error: "Cannot get data from database" });
  }
});

//Add new Food
server.post("/users/:userId/foods", async (req, res) => {
  const userId = req.params.userId;
  const newFood = req.body;
  try {
    await db
      .collection(COLLECTION_OWNER)
      .updateOne(
        { _id: new ObjectId(userId) },
        { $push: { foods: { _id: new ObjectId(), ...newFood } } }
      );
    res.status(201).send({ success: true, data: newFood });
  } catch (error) {}
});

// Edit food
server.put("/users/:userId/foods/:foodId", async (req, res) => {
  const userId = req.params.userId;
  const foodId = req.params.foodId;
  const editedFood = req.body;
  try {
    await db
      .collection(COLLECTION_OWNER)
      .updateOne(
        { _id: new ObjectId(userId), "foods._id": new ObjectId(foodId) },
        { $set: { "foods.$": editedFood } }
      );
    res.status(201).send({ success: true, data: editedFood });
  } catch (error) {
    res.status(500).send({ success: false, error: "Server Error" });
  }
});

server.delete("/users/:userId/foods/:foodId", async (req, res) => {
  const userId = req.params.userId;
  const foodId = req.params.foodId;
  try {
    const result = await db
      .collection(COLLECTION_OWNER)
      .updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { foods: { _id: new ObjectId(foodId) } } }
      );
    res.status(204).send({ success: true, data: result });
  } catch (error) {
    res.status(500).send({ success: false, error: "Server error" });
  }
});

// server.get("/users/:userId/notes", async (req, res) => {});

// notes api
server.get("/users/:userId/notes", async (req, res) => {});

server.post("/users/:userId/notes", async (req, res) => {});

// profile api
server.post("/users/me", async (req, res) => {});

const port = process.env.PORT;
server.listen(port, () => {
  console.log("Server is listening on port ", port);
});
