"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/feed/PostCard";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchPostById,
  getUserLikes,
  toggleLike,
  deletePost,
} from "@/lib/data";
import type { Post } from "@/lib/types";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await fetchPostById(postId);
      if (cancelled) return;
      setPost(p);
      setLoading(false);
      if (p && user) {
        const likes = await getUserLikes(user.id, [p.id]);
        if (!cancelled) setIsLiked(likes.has(p.id));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, user]);

  if (loading) {
    return <LoadingScreen step="情緒を読み込み中..." />;
  }
  if (!post) {
    notFound();
  }

  const handleDelete = async (id: string) => {
    if (!confirm("この情緒を消しますか？")) return;
    const result = await deletePost(id);
    if (result.error) {
      alert(`削除に失敗: ${result.error}`);
      return;
    }
    router.back();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full hover:bg-bg-card flex items-center justify-center text-lg -ml-2"
          aria-label="戻る"
        >
          ←
        </button>
        <h1 className="text-lg font-bold">💭 情緒</h1>
      </div>

      <PostCard
        post={post}
        currentUserId={user?.id ?? null}
        isLiked={isLiked}
        onDelete={handleDelete}
        onLikeToggled={async (id, liked) => {
          setIsLiked(liked);
          setPost((prev) =>
            prev
              ? { ...prev, likes_count: prev.likes_count + (liked ? 1 : -1) }
              : prev
          );
          if (user) {
            const result = await toggleLike(id, user.id, !liked);
            if (result.error) {
              // revert on error
              setIsLiked(!liked);
            }
          }
        }}
      />
    </div>
  );
}
