import { Db } from "mongodb";

export async function run(db: Db) {
  await db
    .collection("follows")
    .createIndex(
      { followerId: 1, followingId: 1 },
      { unique: true, name: "uniq_follower_following" }
    );

  await db
    .collection("follows")
    .createIndex({ followingId: 1, _id: -1 }, { name: "idx_following_cursor" });

  await db
    .collection("follows")
    .createIndex({ followerId: 1, _id: -1 }, { name: "idx_follower_cursor" });

  await db
    .collection("followrequests")
    .createIndex({ fromUserId: 1, toUserId: 1 }, { unique: true, name: "uniq_from_to_request" });

  await db
    .collection("followrequests")
    .createIndex({ fromUserId: 1 }, { name: "idx_request_from" });

  await db.collection("followrequests").createIndex({ toUserId: 1 }, { name: "idx_request_to" });

  console.log("Follows indexes created");
}
