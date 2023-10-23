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
    const client = await MongoClient.connect(mongoUrl);
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
    const owner = await db
      .collection(COLLECTION_OWNER)
      .findOne({ email: body?.email });

    if (owner) {
      const validPassword = await bcrypt.compare(
        body?.password,
        owner?.password
      );

      if (validPassword) {
        const token = jwt.sign(
          { userId: owner?._id, email: owner?.email },
          process.env.JWT_SECRET
        );
        return res.status(200).send({ success: true, data: token });
      } else {
        return res.status(401).send({
          success: false,
          error: "Wrong email or password is provided.",
        });
      }
    } else {
      return res.status(401).send({
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
      .collection(COLLECTION_OWNER)
      .find({ email: body?.email })
      .toArray();

    if (allOwners?.length > 0) {
      return res
        .status(409)
        .send({ success: false, error: "Please use another email." });
    }
    const hashedPassword = await bcrypt.hash(body?.password, 10);
    await db
      .collection(COLLECTION_OWNER)
      .insertOne({ ...body, password: hashedPassword });

    return res.status(201).send({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, error: error?.message });
  }
});

server.use(validateToken);

//Get all foods
server.get("/users/foods", async (req, res) => {
  const { userId } = req.loggedInUser;
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
    return res
      .status(500)
      .send({ success: false, error: "Cannot get data from database" });
  }
});

//Add new Food
server.post("/users/foods", async (req, res) => {
  const { userId } = req.loggedInUser;
  const newFood = req.body;
  try {
    await db
      .collection(COLLECTION_OWNER)
      .updateOne(
        { _id: new ObjectId(userId) },
        { $push: { foods: { _id: new ObjectId(), ...newFood } } }
      );
    res.status(201).send({ success: true, data: newFood });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, error: error?.message });
  }
});

// Edit food
server.put("/users/foods/:foodId", async (req, res) => {
  const { userId } = req.loggedInUser;
  const foodId = req.params.foodId;
  const editedFood = req.body;
  try {
    await db.collection(COLLECTION_OWNER).updateOne(
      { _id: new ObjectId(userId), "foods._id": new ObjectId(foodId) },
      {
        $set: {
          "foods.$.name": editedFood.name,
          "foods.$.origin": editedFood.origin,
          "foods.$.price": editedFood.price,
          "foods.$.date": editedFood.date,
          "foods.$.image": editedFood.image,
        },
      }
    );
    res.status(201).send({ success: true, data: editedFood });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, error: error?.message });
  }
});

server.delete("/users/foods/:foodId", async (req, res) => {
  const { userId } = req.loggedInUser;
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
    console.log(error);
    return res.status(500).send({ success: false, error: error?.message });
  }
});

server.post("/users/notes", async (req, res) => {
  try {
    const { userId } = req.loggedInUser;
    const notes = req.body;
    notes.date = new Date();
    notes._id = new ObjectId();
    const result = await db
      .collection(COLLECTION_OWNER)
      .updateOne({ _id: new ObjectId(userId) }, { $push: { notes: notes } });
    if (result) {
      res.status(200).send({ success: true, data: result.notes });
    }
  } catch (error) {
    res.status(500).send({ success: false, error: "Internal Server Error" });
  }
});

server.get("/users/notes", async (req, res) => {
  try {
    const { userId } = req.loggedInUser;
    const result = await db
      .collection(COLLECTION_OWNER)
      .findOne({ _id: new ObjectId(userId) });
    if (result) {
      res.status(200).send({ success: true, data: result.notes });
    }
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

// profile api
server.get("/users/me", async (req, res) => {
  const { userId } = req.loggedInUser;

  try {
    const owner = await db
      .collection(COLLECTION_OWNER)
      .findOne({ _id: new ObjectId(userId) });

    if (owner) {
      return res.status(200).send({
        success: true,
        data: {
          email: owner?.email,
          phno: owner?.phno,
          fullname: owner?.fullname,
          address: owner?.address,
        },
      });
    } else {
      return res
        .status(404)
        .send({ success: false, error: "Owner not found." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, error: error?.message });
  }
});

const port = process.env.PORT;
server.listen(port, () => {
  console.log("Server is listening on port ", port);
});
