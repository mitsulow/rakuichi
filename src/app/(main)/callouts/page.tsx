"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchCallouts, createCallout } from "@/lib/data";
import { useToast } from "@/components/ui/Toast";
import { formatRelativeTime } from "@/lib/utils";
import type { Callout } from "@/lib/types";

export default function CalloutsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [callouts, setCallouts] = useState<Callout[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchCallouts({ status: "open", limit: 50 });
      if (!cancelled) {
        setCallouts(list as Callout[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreated = (c: Callout) => {
    setCallouts((prev) => [c, ...prev]);
    setComposerOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Hero */}
      <div
        className="text-center py-3 px-4 rounded-2xl border-2"
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
          🤚 この指とまれ
        </h1>
        <p className="text-[11px] text-text-sub mt-1 leading-snug">
          やりたいことを掲げて、仲間を集める ・ 誰かの指にとまる
        </p>
      </div>

      {/* Composer toggle / form */}
      {user ? (
        composerOpen ? (
          <CalloutComposer
            userId={user.id}
            defaultPrefecture={profile?.prefecture ?? null}
            onCancel={() => setComposerOpen(false)}
            onCreated={handleCreated}
          />
        ) : (
          <button
            onClick={() => setComposerOpen(true)}
            className="w-full bg-accent text-white rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition shadow-sm"
          >
            ＋ 新しい呼びかけを投げる
          </button>
        )
      ) : (
        <Link
          href="/login"
          className="block text-center bg-accent/10 border-2 border-dashed border-accent/40 rounded-xl py-2.5 text-sm text-accent font-medium no-underline"
        >
          🤚 呼びかけるには → ログイン
        </Link>
      )}

      {/* Callouts list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-bg animate-pulse" />
          ))}
        </div>
      ) : callouts.length === 0 ? (
        <div
          className="text-center py-8 px-6 rounded-2xl border-2 border-dashed"
          style={{
            borderColor: "#c94d3a40",
            background:
              "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)",
          }}
        >
          <img
            src="/icons/empty-callouts.png"
            alt=""
            className="w-32 h-32 mx-auto mb-3"
          />
          <p className="text-sm font-bold" style={{ color: "#c94d3a" }}>
            まだ呼びかけはありません
          </p>
          <p className="text-xs text-text-sub mt-1">
            最初の指をあげて、仲間を集めよう
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {callouts.map((c) => (
            <CalloutCard
              key={c.id}
              callout={c}
              onClick={() => router.push(`/callouts/${c.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CalloutCard({
  callout,
  onClick,
}: {
  callout: Callout;
  onClick: () => void;
}) {
  const author = callout.author;
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-card hover:shadow-md transition-shadow overflow-hidden relative"
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: "#c94d3a" }}
      />
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          {author && (
            <Avatar
              src={author.avatar_url}
              alt={author.display_name}
              size="sm"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold leading-snug line-clamp-2">
              {callout.title}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-text-mute mt-0.5">
              {author && <span>{author.display_name}</span>}
              {callout.prefecture && (
                <>
                  <span className="text-text-mute/40">／</span>
                  <span>📍 {callout.prefecture}</span>
                </>
              )}
              <span className="text-text-mute/40">／</span>
              <span>{formatRelativeTime(callout.created_at)}</span>
            </div>
          </div>
        </div>
        {callout.body && (
          <p className="text-xs text-text-sub leading-relaxed mt-2 line-clamp-2">
            {callout.body}
          </p>
        )}
        {callout.needed_skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {callout.needed_skills.slice(0, 5).map((s) => (
              <span
                key={s}
                className="text-[10px] bg-accent/10 text-accent rounded-full px-1.5 py-0.5 font-medium"
              >
                🛠 {s}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border">
          <span className="text-[11px] text-text-sub">
            🤚 {callout.participant_count ?? 0}人が指をあげている
          </span>
          <span className="text-[11px] text-accent font-bold">
            詳細 →
          </span>
        </div>
      </div>
    </button>
  );
}

function CalloutComposer({
  userId,
  defaultPrefecture,
  onCancel,
  onCreated,
}: {
  userId: string;
  defaultPrefecture: string | null;
  onCancel: () => void;
  onCreated: (c: Callout) => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [prefecture, setPrefecture] = useState(defaultPrefecture ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    const skills = skillsInput
      .split(/[、,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const result = await createCallout(userId, {
      title,
      body: body || null,
      needed_skills: skills,
      prefecture: prefecture || null,
    });
    setSaving(false);
    if (result.error) {
      toast.show(`投稿に失敗: ${result.error}`, "error");
      return;
    }
    if (result.data) {
      toast.show("呼びかけを投げました", "success");
      onCreated(result.data as Callout);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border-2 border-accent/40 bg-card p-3 space-y-2"
      style={{
        background: "linear-gradient(135deg, #fffaf0 0%, #fdf6e9 100%)",
      }}
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="例: 一緒に味噌を仕込む人〜！"
        className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm font-medium focus:border-accent focus:outline-none"
        maxLength={120}
        required
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="どこで・いつ・どんな感じで・誰に来てほしい？"
        className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm resize-none focus:border-accent focus:outline-none"
        maxLength={1000}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={prefecture}
          onChange={(e) => setPrefecture(e.target.value)}
          placeholder="都道府県（任意）"
          className="bg-bg border border-border rounded-xl px-3 py-2 text-xs focus:border-accent focus:outline-none"
        />
        <input
          type="text"
          value={skillsInput}
          onChange={(e) => setSkillsInput(e.target.value)}
          placeholder="ほしいスキル（任意・カンマ区切り）"
          className="bg-bg border border-border rounded-xl px-3 py-2 text-xs focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="flex-1"
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!title.trim() || saving}
          className="flex-1"
        >
          {saving ? "投稿中..." : "🤚 指を立てる"}
        </Button>
      </div>
    </form>
  );
}
