const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Client } = require("pg");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/chat_test";
const PG_CONFIG = {
  host: process.env.PG_HOST || "localhost",
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || "user_service",
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "password",
};

const TOTAL_USERS = 100;
const TOTAL_ROOMS = 3;
const PASSWORD = "TestPass123!";
const SALT_ROUNDS = 10;

const roomSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ["direct", "group"] },
  members: [String],
  createdAt: { type: Date, default: Date.now },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
});
const Room = mongoose.model("Room", roomSchema);

async function createTestUsers() {
  console.log("👥 Creating 100 test users in PostgreSQL...");
  const client = new Client(PG_CONFIG);
  try {
    await client.connect();
    await client.query(
      `CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`,
    );
    await client.query(
      `DELETE FROM users WHERE email LIKE 'testuser%@chatapp.com';`,
    );
    const hashedPassword = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
    for (let i = 1; i <= TOTAL_USERS; i++) {
      await client.query(
        `INSERT INTO users (email, password_hash) VALUES ($1, $2)`,
        [`testuser${i}@chatapp.com`, hashedPassword],
      );
    }
    console.log(`✅ Created ${TOTAL_USERS} test users`);
  } finally {
    await client.end();
  }
}

async function createTestRooms() {
  console.log("🏠 Creating test chat rooms in MongoDB...");
  try {
    await mongoose.connect(MONGODB_URI);
    await Room.deleteMany({ name: /^Test Room/ });
    const rooms = [];
    for (let i = 1; i <= TOTAL_ROOMS; i++) {
      const members = Array.from(
        { length: 30 },
        (_, j) => `user_${Math.floor(Math.random() * 100) + 1}`,
      );
      rooms.push({ name: `Test Room ${i}`, type: "group", members: members });
    }
    await Room.insertMany(rooms);
    console.log(`✅ Created ${TOTAL_ROOMS} test rooms`);
  } finally {
    await mongoose.disconnect();
  }
}

async function main() {
  try {
    await createTestUsers();
    await createTestRooms();
    console.log("🎉 Test data preparation completed!");
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
}
main();
