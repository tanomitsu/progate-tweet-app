import {databaseManager} from "@/db";
import {ensureAuthUser} from "@/middlewares/authentication";
import {createRetweet, deleteRetweet} from "@/models/retweet";
import express from "express";

export const retweetRouter = express.Router();

retweetRouter.post(
  "/:postId/retweets",
  ensureAuthUser,
  async (req, res, next) => {
    const {postId} = req.params;
    const currentUserId = req.authentication?.currentUserId;
    if (currentUserId === undefined) {
      // `ensureAuthUser` enforces `currentUserId` is not undefined.
      // This must not happen.
      return next(new Error("Invalid error: currentUserId is undefined."));
    }
    await createRetweet({userId: currentUserId, postId: Number(postId)});
    res.redirect(`/posts/${postId}`);
  }
);

retweetRouter.delete(
  "/:postId/retweets",
  ensureAuthUser,
  async (req, res, next) => {
    const {postId} = req.params;
    const currentUserId = req.authentication?.currentUserId;
    if (currentUserId === undefined) {
      // `ensureAuthUser` enforces `currentUserId` is not undefined.
      // This must not happen.
      return next(new Error("Invalid error: currentUserId is undefined."));
    }
    await deleteRetweet({userId: currentUserId, postId: Number(postId)});
    res.redirect(`/posts/${postId}`);
  }
);

export const hasUserRetweetedPost = async (
  userId: number,
  postId: number
): Promise<boolean> => {
  const prisma = databaseManager.getInstance();
  const retweet = await prisma.retweet.findFirst({
    where: {
      userId,
      postId,
    },
  });
  return retweet !== null;
};
