import { fakerVI } from "@faker-js/faker";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { UserModel } from "../models/user.model";

//npx ts-node src/infrastructure/database/seeds/insert-user.ts

const MONGO_URI = "mongodb://localhost:27017/trendify";

const TOTAL = 1_000_000;
const BATCH_SIZE = 10_000;
const DEFAULT_PASSWORD = "phong@12345";
const HASHED_PASSWORD = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Mongo connected");

  let inserted = 0;

  while (inserted < TOTAL) {
    const users = [];

    for (let i = 0; i < BATCH_SIZE && inserted < TOTAL; i++) {
      users.push({
        email: `user_${inserted}@yopmail.com`,
        password: HASHED_PASSWORD,
        username: `user_${inserted}`,

        firstName: fakerVI.person.firstName(),
        lastName: fakerVI.person.lastName(),
        about: fakerVI.lorem.sentence(),
        gender: "male",
        accountType: "personal",

        profilePicture: `https://i.pravatar.cc/150?img=${i % 70}`,
      });

      inserted++;
    }

    await UserModel.insertMany(users);

    console.log(`Inserted ${inserted}/${TOTAL}`);
  }

  await mongoose.disconnect();
  console.log("Done");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
