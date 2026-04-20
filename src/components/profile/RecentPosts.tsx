import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { Post } from "@/lib/types";

interface RecentPostsProps {
  posts: Post[];
  username: string;
}

export function RecentPosts({ posts, username }: RecentPostsProps) {
  if (!posts.length) return null;

  const recent = posts.slice(0, 3);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-text-sub">最新の投稿</h3>
      {recent.map((post) => (
        <Card key={post.id} className="!p-3">
          <p className="text-sm whitespace-pre-wrap">
            {truncate(post.body, 120)}
          </p>
          <div className="flex items-center justify-between mt-2 text-xs text-text-mute">
            <span>{formatRelativeTime(post.created_at)}</span>
            <span className="flex items-center gap-3">
              <span>🌾 {post.likes_count}</span>
              <span>💬 {post.comments_count}</span>
            </span>
          </div>
        </Card>
      ))}
      {posts.length > 3 && (
        <Link
          href={`/u/${username}/posts`}
          className="text-sm text-accent hover:underline block text-center"
        >
          もっと見る →
        </Link>
      )}
    </div>
  );
}
