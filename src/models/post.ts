import {Post} from "@prisma/client";
import {databaseManager} from "@/db/index";
import {
  selectUserColumnsWithoutPassword,
  type UserWithoutPassword,
} from "@/models/user";

type PostData = Pick<Post, "content" | "userId">;
export type PostWithUser = Post & {user: UserWithoutPassword};
export type PostWithUserAndType = PostWithUser & {
  retweetedBy: UserWithoutPassword | undefined;
};

export const selectPostColumnsWithUser = {
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

/**
 * getAllPosts
 * @param {number | undefined} userId - 特定のユーザーのタイムラインを取得する場合は指定する。
 * @returns - 投稿一覧
 */
export const getAllPosts = async (
  userId?: number
): Promise<PostWithUserAndType[]> => {
  const prisma = databaseManager.getInstance();
  const posts = await prisma.post.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      ...selectPostColumnsWithUser,
    },
  });

  const retweets = await prisma.retweet.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      createdAt: true,
      post: {
        select: {
          ...selectPostColumnsWithUser,
        },
      },
      user: {
        select: {
          ...selectUserColumnsWithoutPassword,
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
        return {...postOrRetweet, retweetedBy: undefined};
      }
      // Retweeted posts
      return {...postOrRetweet.post, retweetedBy: postOrRetweet.user};
    });
  return sortedPosts;
};
