require("dotenv").config();
const { Client } = require("pg");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs").promises;

// Sử dụng chung JWT_SECRET từ Auth Service [cite: 482]
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "26a886a02b5bbf23259669743931f8790d4c5645ed7734d5b5c328000d51cdede374e2bdf5121e1813570fb671f95d6a1ed16cf138351f1a1da227f7a3d68be3";

const runSeed = async () => {
  try {
    console.log("--- Seed Script started ---");

    const tokens = [];
    for (let i = 1; i <= 100; i++) {
      const token = jwt.sign(
        { userId: `user${i}`, email: `user${i}@test.com` },
        JWT_SECRET,
      );
      tokens.push({ userId: `user${i}`, token });
    }
    await fs.writeFile("users_test_data.json", JSON.stringify(tokens, null, 2));
    console.log("--- Seed Script finished successfully ---");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
runSeed();
