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

function getDB() {
  return db;
}

module.exports = {
  connectDB,
  getDB,
};
