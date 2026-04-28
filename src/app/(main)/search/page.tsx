"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import {
  searchProfilesByText,
  searchShopsByText,
  searchCalloutsByText,
  fetchPostsPaged,
  POSTS_PAGE_SIZE,
} from "@/lib/data";
import { formatRelativeTime } from "@/lib/utils";
import { PostCard } from "@/components/feed/PostCard";
import type { Profile, Shop, Callout, Post } from "@/lib/types";

type Tab = "people" | "shops" | "posts" | "callouts";

interface ShopWithOwner extends Shop {
  owner?: Profile | null;
}

function SearchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const initialQ = params.get("q") ?? "";
  const initialTab = (params.get("tab") as Tab) || "people";
  const [input, setInput] = useState(initialQ);
  const [term, setTerm] = useState(initialQ);
  const [tab, setTab] = useState<Tab>(initialTab);

  const [people, setPeople] = useState<Profile[]>([]);
  const [shops, setShops] = useState<ShopWithOwner[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [callouts, setCallouts] = useState<Callout[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setPeople([]);
      setShops([]);
      setPosts([]);
      setCallouts([]);
      return;
    }
    setLoading(true);
    const [pe, sh, po, ca] = await Promise.all([
      searchProfilesByText(q),
      searchShopsByText(q),
      fetchPostsPaged(0, POSTS_PAGE_SIZE, null, false, q).then(
        (r) => r.posts
      ),
      searchCalloutsByText(q),
    ]);
    setPeople(pe as Profile[]);
    setShops(sh as ShopWithOwner[]);
    setPosts(po as Post[]);
    setCallouts(ca as Callout[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initialQ) {
      setTerm(initialQ);
      search(initialQ);
    }
  }, [initialQ, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    setTerm(q);
    if (q) {
      router.replace(`/search?q=${encodeURIComponent(q)}&tab=${tab}`);
      search(q);
    }
  };

  const counts = {
    people: people.length,
    shops: shops.length,
    posts: posts.length,
    callouts: callouts.length,
  };

  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl border-2 px-4 py-3"
        style={{
          borderColor: "#c94d3a40",
          background:
            "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 50%, #fdf6e9 100%)",
        }}
      >
        <h1
          className="text-xl font-bold tracking-wide leading-tight"
          style={{ color: "#c94d3a" }}
        >
          🔍 検 索
        </h1>
        <p className="text-[11px] text-text-sub mt-1 leading-snug">
          むらびと ・ 楽座 ・ 情緒 ・ 呼びかけ をキーワードで横断
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute text-sm pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="キーワードで検索（例: 自然栽培、沖縄、整体...）"
          className="w-full bg-card border border-border rounded-xl pl-9 pr-9 py-3 text-sm focus:border-accent focus:outline-none"
        />
        {input && (
          <button
            type="button"
            onClick={() => {
              setInput("");
              setTerm("");
              setPeople([]);
              setShops([]);
              setPosts([]);
              setCallouts([]);
              router.replace("/search");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-text-mute hover:bg-bg flex items-center justify-center text-xs"
            aria-label="クリア"
          >
            ✕
          </button>
        )}
      </form>

      {term && (
        <>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
            {(
              [
                { id: "people", label: "むらびと", emoji: "👥" },
                { id: "shops", label: "楽座", emoji: "🏮" },
                { id: "posts", label: "情緒", emoji: "💭" },
                { id: "callouts", label: "呼びかけ", emoji: "🤚" },
              ] as { id: Tab; label: string; emoji: string }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? "bg-accent text-white border-accent"
                    : "bg-card border-border hover:border-accent/40"
                }`}
              >
                {t.emoji} {t.label}{" "}
                <span
                  className={
                    tab === t.id ? "text-white/70" : "text-text-mute"
                  }
                >
                  {counts[t.id]}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-bg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {tab === "people" && <PeopleResults people={people} />}
              {tab === "shops" && <ShopResults shops={shops} />}
              {tab === "posts" && <PostResults posts={posts} />}
              {tab === "callouts" && (
                <CalloutResults callouts={callouts} />
              )}
            </div>
          )}
        </>
      )}

      {!term && (
        <div className="text-center py-12 text-text-mute">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm">キーワードを入れて検索してみよう</p>
          <p className="text-[11px] mt-1">
            「自然栽培」「整体」「沖縄」「子育て」など
          </p>
        </div>
      )}
    </div>
  );
}

function PeopleResults({ people }: { people: Profile[] }) {
  if (people.length === 0) return <Empty kind="むらびと" />;
  return (
    <>
      {people.map((p) => (
        <Link
          key={p.id}
          href={`/u/${p.username}`}
          className="no-underline block"
        >
          <div className="rounded-xl border border-border hover:shadow-md transition-shadow p-3 flex items-start gap-3 bg-card">
            <Avatar src={p.avatar_url} alt={p.display_name} size="md" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold">{p.display_name}</div>
              {p.life_work && (
                <div className="text-xs text-text-sub truncate mt-0.5">
                  🌱 {p.life_work}
                </div>
              )}
              {p.prefecture && (
                <div className="text-[11px] text-text-mute mt-0.5">
                  📍 {p.prefecture}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </>
  );
}

function ShopResults({ shops }: { shops: ShopWithOwner[] }) {
  if (shops.length === 0) return <Empty kind="楽座" />;
  return (
    <div className="grid grid-cols-2 gap-2">
      {shops.map((s) => (
        <Link key={s.id} href={`/shop/${s.id}`} className="no-underline">
          <div className="rounded-xl border border-border hover:shadow-md transition-shadow overflow-hidden h-full bg-card">
            <div className="aspect-square bg-bg overflow-hidden">
              {s.image_urls && s.image_urls.length > 0 ? (
                <img
                  src={s.image_urls[0]}
                  alt={s.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #c94d3a 0%, #d4a043 100%)",
                  }}
                >
                  🏮
                </div>
              )}
            </div>
            <div className="p-2">
              <div className="text-xs font-bold line-clamp-2 leading-tight">
                {s.name}
              </div>
              <div className="text-xs text-accent mt-1 font-bold">
                {s.is_trial
                  ? "0円〜"
                  : s.price_jpy != null
                  ? `¥${s.price_jpy.toLocaleString()}`
                  : s.price_text ?? ""}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function PostResults({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return <Empty kind="情緒" />;
  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}

function CalloutResults({ callouts }: { callouts: Callout[] }) {
  if (callouts.length === 0) return <Empty kind="呼びかけ" />;
  return (
    <>
      {callouts.map((c) => (
        <Link
          key={c.id}
          href={`/callouts/${c.id}`}
          className="no-underline block"
        >
          <div className="rounded-xl border border-border hover:shadow-md transition-shadow p-3 bg-card">
            <h3 className="text-sm font-bold leading-snug">{c.title}</h3>
            {c.body && (
              <p className="text-xs text-text-sub mt-1 line-clamp-2">
                {c.body}
              </p>
            )}
            <div className="flex items-center gap-1.5 text-[10px] text-text-mute mt-1.5">
              {c.author && <span>{c.author.display_name}</span>}
              {c.prefecture && (
                <>
                  <span className="text-text-mute/40">／</span>
                  <span>📍 {c.prefecture}</span>
                </>
              )}
              <span className="ml-auto">
                {formatRelativeTime(c.created_at)}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </>
  );
}

function Empty({ kind }: { kind: string }) {
  return (
    <div className="text-center py-8 text-text-mute">
      <p className="text-2xl mb-1">🤷</p>
      <p className="text-xs">該当する{kind}は見つかりませんでした</p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-text-mute">読み込み中...</div>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
