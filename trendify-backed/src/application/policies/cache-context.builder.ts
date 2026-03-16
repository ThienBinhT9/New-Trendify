import { EPostAccessLevel } from "@/domain/post";
import { GetFollowersDTO, GetFollowingDTO } from "../dtos/follow.dto";
import { GetUserPostsDTO } from "../dtos/post.dto";

export class CacheContextBuilder {
  static readonly LIMITS = {
    RESET_PASSWORD: 5,
    SIGN_UP: 5,
  } as const;

  static readonly TTL = {
    LIST_FOLLOWING: 30,
    LIST_FOLLOWERS: 30,
    USER_PROFILE: 10 * 60,
    USER_SETTINGS: 30 * 60,
    DETAIL_POST: 30,
    USER_POSTS: 60,
    PASSWORD_RESET_TOKEN: 600,
    LIKE_COUNT: 3600,
    VIEW_COUNT: 300, // 5 minutes - sync interval
    UNIQUE_VIEWERS: 3600, // 1 hour - dedupe window
  } as const;

  //====================== AUTH ======================
  static signUp(email?: string) {
    return {
      rlKey: `rl:signup:email:${email}`,
      limit: 5,
      rlTtl: 5 * 60,

      sessionKey: (sessionId: string) => `signup:session:${sessionId}`,
      sessionTtl: 3 * 60 * 60,
    };
  }

  static refreshToken(sessionId: string) {
    return {
      rlKey: `rl:refresh:sessionId:${sessionId}`,
      limit: 5,
      rlTtl: 1 * 60,
    };
  }

  static forgotPassword(identifier: string) {
    return {
      rlKey: `rl:pwd_forgot:email:${identifier}`,
      rlTtl: 15 * 60, // 15 minutes
      limit: 3, // 3 attempts per email

      ipKey: `rl:pwd_forgot:ip:${identifier}`,
      ipTtl: 15 * 60,
      ipLimit: 10, // 10 attempts per IP
    };
  }

  static resetPassword(tokenHash: string) {
    return {
      rlKey: `rl:pwd_reset:token:${tokenHash}`,
      limit: 5,
      rlTtl: 15 * 60,

      tokenKey: `pwd_reset:token:${tokenHash}`,
      tokenTtl: 15 * 60,
    };
  }

  //====================== FOLLOW ======================
  static follow(userId: string, cursor?: string) {
    return {
      followerKey: `v1:follow:followers:user:${userId}:cursor:${cursor ?? "first"}`,
      followerPrefix: `v1:follow:followers:user:${userId}`,
      followerTtl: 2 * 60,

      followingKey: `v1:follow:following:user:${userId}:cursor:${cursor ?? "first"}`,
      followingPrefix: `v1:follow:following:user:${userId}`,
      followingTtl: 2 * 60,
    };
  }

  //====================== USERS ======================
  static userProfile(userId: string) {
    return {
      baseKey: `v1:user:${userId}:base`,
      baseTtl: 60 * 60,

      statsKey: `v1:user:${userId}:stats`,
      statsTtl: 5 * 60,
      statsFields: {
        followers: "followers",
        following: "following",
        posts: "posts",
      },

      settingKey: `v1:user:${userId}:settings`,
      settingTtl: 30 * 60,
    };
  }

  //====================== POSTS ======================
  static post(postId: string) {
    return {
      key: `v1:post:${postId}`,
      ttl: this.TTL.DETAIL_POST,
    };
  }

  static userPosts({
    authorId,
    cursor,
    accessLevel,
  }: {
    authorId: string;
    cursor?: string;
    accessLevel?: string;
  }) {
    return {
      key: `v1:posts:user:${authorId}:access:${accessLevel}:cursor:${cursor ?? "first"}`,
      prefix: `v1:posts:user:${authorId}`,
      ttl: this.TTL.USER_POSTS,
    };
  }

  static likePost(postId: string) {
    return {
      key: `post:${postId}:likes`,
      ttl: this.TTL.LIKE_COUNT,
    };
  }

  static viewCount(postId: string) {
    return {
      key: `post:${postId}:views`,
      ttl: this.TTL.VIEW_COUNT,
    };
  }

  static uniqueViewers(postId: string) {
    return {
      key: `post:${postId}:unique_viewers`,
      ttl: this.TTL.UNIQUE_VIEWERS,
    };
  }
}
