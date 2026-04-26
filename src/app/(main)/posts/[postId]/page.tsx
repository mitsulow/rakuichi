"use client";

import { use, useState, useEffect } from "react";
import { useRouter, notFound } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { PostCard } from "@/components/feed/PostCard";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { fetchPostById, getUserLikes, deletePost } from "@/lib/data";
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
      if (p && user) {
        const likes = await getUserLikes(user.id, [p.id]);
        if (!cancelled) setIsLiked(likes.has(p.id));
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, user]);

  if (loading) return <LoadingScreen step="情緒を読み込み中..." />;
  if (!post) notFound();

  const handleDelete = async (id: string) => {
    if (!confirm("この情緒を消しますか？")) return;
    const result = await deletePost(id);
    if (result.error) {
      alert(`削除に失敗: ${result.error}`);
      return;
    }
    router.push("/posts");
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => router.back()}
        className="text-sm text-text-sub hover:text-accent"
      >
        ← 一覧に戻る
      </button>

      <PostCard
        post={post}
        currentUserId={user?.id ?? null}
        isLiked={isLiked}
        onDelete={handleDelete}
        onLikeToggled={(_, liked) => {
          setIsLiked(liked);
          setPost((prev) =>
            prev
              ? { ...prev, likes_count: prev.likes_count + (liked ? 1 : -1) }
              : prev
          );
        }}
      />
    </div>
  );
}
