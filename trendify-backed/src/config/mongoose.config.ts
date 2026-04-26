import dotenv from "dotenv";
import mongoose, { ConnectOptions } from "mongoose";

import { EnvConfig } from "@/shared/types";

dotenv.config();

const development: EnvConfig = {
  app: { port: process.env.DEV_APP_PORT || 8000 },
  db: {
    host: process.env.DEV_DB_HOST || "localhost",
    port: process.env.DEV_DB_PORT || "27017",
    name: process.env.DEV_DB_NAME || "trendify",
  },
};

const production: EnvConfig = {
  app: { port: process.env.PRODUCTION_APP_PORT || "trendify" },
  db: {
    host: process.env.PRODUCTION_DB_HOST || "trendify",
    port: process.env.PRODUCTION_DB_PORT || "27017",
    name: process.env.PRODUCTION_DB_NAME || "trendify",
  },
};

const env = process.env.NODE_ENV || "development";
const config = env === "production" ? production : development;

const mongooseConfig = {
  uri: `mongodb://${config.db.host}:${config.db.port}/${config.db.name}`,
  options: {
    autoIndex: false,
    maxPoolSize: 500,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  } as ConnectOptions,
};

class ConnectMongoose {
  private static instance: ConnectMongoose;

  private constructor() {
    this.connect();
    this.registerEvents();
  }

  private connect() {
    mongoose
      .connect(mongooseConfig.uri, mongooseConfig.options)
      .then(() => {
        console.log(`✅ Mongoose Connected`);
      })
      .catch((error) => {
        console.log("❌ Mongoose Disconnected", error);
      });
  }

  private registerEvents() {
    mongoose.connection.on("connected", () => {
      //   console.log("Mongoose connection established successfully.");
    });

    mongoose.connection.on("error", () => {
      //   console.log("connection error");
    });

    mongoose.connection.on("disconnected", () => {
      //   console.log("connection disconnected");
    });

    process.on("SIGINT", async () => {
      await mongoose.disconnect();
      console.log("Mongoose disconnected on app termination");
      process.exit(0);
    });
  }

  public static getInstance() {
    if (!ConnectMongoose.instance) {
      ConnectMongoose.instance = new ConnectMongoose();
    }

    return ConnectMongoose.instance;
  }
}

export default ConnectMongoose.getInstance;
