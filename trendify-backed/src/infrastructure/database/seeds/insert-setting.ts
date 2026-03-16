import mongoose from "mongoose";
import { UserModel } from "@/infrastructure/database/models/user.model";
import { SettingsModel } from "@/infrastructure/database/models/user-setting.model";
import { ECommonVisibility } from "@/domain/user-setting";

const MONGO_URI = "mongodb://localhost:27017/trendify";
const BATCH_SIZE = 10_000;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Mongo connected");

  try {
    // Get total users
    const totalUsers = await UserModel.countDocuments();
    console.log(`Total users: ${totalUsers}`);

    let processed = 0;

    while (processed < totalUsers) {
      // Fetch batch of users
      const users = await UserModel.find().skip(processed).limit(BATCH_SIZE).select("_id");

      if (users.length === 0) break;

      // Create settings for each user
      const settings = users.map((user) => ({
        userId: user._id,
        profileVisibility: ECommonVisibility.PUBLIC,
        allowFollow: true,
        allowTagging: true,
        allowCommentOnProfile: true,
        allowMessage: true,
        showOnlineStatus: true,
        showLastActiveTime: false,
      }));

      // Insert settings batch
      await SettingsModel.insertMany(settings);

      processed += users.length;
      console.log(`Processed ${processed}/${totalUsers}`);
    }

    console.log("Settings seeding completed");
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
