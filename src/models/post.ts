import {Post} from "@prisma/client";
import {databaseManager} from "@/db/index";
import {
  selectUserColumnsWithoutPassword,
  type UserWithoutPassword,
} from "@/models/user";

type PostData = Pick<Post, "content" | "userId">;
export type PostWithUser = Post & {user: UserWithoutPassword};
export type PostWithUserAndType = PostWithUser & {
  type: "Post" | "RetweetedPost";
};

export const selectPostWithUser = {
  id: true,
  content: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: selectUserColumnsWithoutPassword,
  },
} as const;

export const createPost = async (postData: PostData): Promise<Post> => {
  const prisma = databaseManager.getInstance();
  const post = await prisma.post.create({
    data: postData,
  });
  return post;
};

export const updatePost = async (
  postId: number,
  content: string
): Promise<Post> => {
  const prisma = databaseManager.getInstance();
  const post = await prisma.post.update({
    where: {
      id: postId,
    },
    data: {
      content,
    },
  });
  return post;
};

export const deletePost = async (postId: number): Promise<Post> => {
  const prisma = databaseManager.getInstance();
  const post = await prisma.post.delete({
    where: {
      id: postId,
    },
  });
  return post;
};

export const getPost = async (postId: number): Promise<PostWithUser | null> => {
  const prisma = databaseManager.getInstance();
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
      content: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          ...selectUserColumnsWithoutPassword,
        },
      },
    },
  });
  return post;
};

export const getAllPosts = async (): Promise<PostWithUserAndType[]> => {
  const prisma = databaseManager.getInstance();
  const posts = await prisma.post.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      ...selectPostWithUser,
    },
  });

  const retweets = await prisma.retweet.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      createdAt: true,
      post: {
        select: {
          ...selectPostWithUser,
        },
      },
    },
  });

  // order posts and retweets by createdAt
  const sortedPosts: PostWithUserAndType[] = [
    ...posts.map(p => ({...p, typename: "Post" as const})),
    ...retweets.map(r => ({...r, typename: "Retweet" as const})),
  ]
    // Paginationを行わない限りは、このようにfetch後にソートして問題ない
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(postOrRetweet => {
      if (postOrRetweet.typename === "Post") {
        // Posts
        return {...postOrRetweet, type: "Post" as const};
      }
      // Retweeted posts
      return {...postOrRetweet.post, type: "RetweetedPost" as const};
    });
  return sortedPosts;
};
