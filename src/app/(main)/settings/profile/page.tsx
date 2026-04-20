"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchProfile, updateProfile } from "@/lib/data";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { MigrationBar } from "@/components/profile/MigrationBar";
import { PREFECTURES } from "@/lib/constants";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    story: "",
    status_line: "",
    prefecture: "",
    city: "",
    rice_work: "",
    life_work: "",
    life_work_years: "",
    life_work_level: "",
    migration_percent: 0,
  });

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setUserId(session.user.id);
      setAvatarUrl(session.user.user_metadata?.avatar_url ?? null);

      const profile = await fetchProfile(session.user.id);
      if (profile) {
        setFormData({
          display_name: profile.display_name || "",
          bio: profile.bio || "",
          story: profile.story || "",
          status_line: profile.status_line || "",
          prefecture: profile.prefecture || "",
          city: profile.city || "",
          rice_work: profile.rice_work || "",
          life_work: profile.life_work || "",
          life_work_years: profile.life_work_years?.toString() || "",
          life_work_level: profile.life_work_level || "",
          migration_percent: profile.migration_percent ?? 0,
        });
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
      }

      setLoading(false);
    }
    init();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || saving) return;

    setSaving(true);
    setSaved(false);

    const { error } = await updateProfile(userId, {
      display_name: formData.display_name,
      bio: formData.bio || undefined,
      story: formData.story || undefined,
      status_line: formData.status_line || undefined,
      prefecture: formData.prefecture || undefined,
      city: formData.city || undefined,
      rice_work: formData.rice_work || undefined,
      life_work: formData.life_work || undefined,
      life_work_years: formData.life_work_years ? parseInt(formData.life_work_years) : null,
      life_work_level: formData.life_work_level || undefined,
      migration_percent: formData.migration_percent,
    });

    setSaving(false);

    if (error) {
      alert(`保存に失敗しました: ${error}`);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-text-mute text-sm">読み込み中...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full hover:bg-bg-card flex items-center justify-center text-lg -ml-1"
          aria-label="戻る"
        >
          ←
        </button>
        <h1 className="text-lg font-bold">プロフィール編集</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar */}
        <Card>
          <div className="flex items-center gap-4">
            <Avatar
              src={avatarUrl}
              alt={formData.display_name}
              size="lg"
            />
            <div className="text-xs text-text-mute">
              アバターはGoogleアカウントの画像が使用されます
            </div>
          </div>
        </Card>

        {/* Basic info */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-sub">基本情報</h3>

            <div>
              <label className="text-xs text-text-mute block mb-1">表示名</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => updateField("display_name", e.target.value)}
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-text-mute block mb-1">自己紹介（短め）</label>
              <textarea
                value={formData.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                rows={2}
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm resize-none focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-text-mute block mb-1">今やってること（ステータス）</label>
              <input
                type="text"
                value={formData.status_line}
                onChange={(e) => updateField("status_line", e.target.value)}
                placeholder="例：5月の予約あと3枠"
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Location */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-sub">住んでいる場所</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-mute block mb-1">都道府県</label>
                <select
                  value={formData.prefecture}
                  onChange={(e) => updateField("prefecture", e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="">選択</option>
                  {PREFECTURES.map((pref) => (
                    <option key={pref} value={pref}>{pref}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-mute block mb-1">市区町村</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Work */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-sub">ワーク</h3>
            <div>
              <label className="text-xs text-text-mute block mb-1">ライスワーク（生活のための仕事）</label>
              <input
                type="text"
                value={formData.rice_work}
                onChange={(e) => updateField("rice_work", e.target.value)}
                placeholder="例：会社員、パート"
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-text-mute block mb-1">ライフワーク（本当にやりたいこと）</label>
              <input
                type="text"
                value={formData.life_work}
                onChange={(e) => updateField("life_work", e.target.value)}
                placeholder="例：陶芸家、ヨガインストラクター"
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-mute block mb-1">年数</label>
                <input
                  type="number"
                  value={formData.life_work_years}
                  onChange={(e) => updateField("life_work_years", e.target.value)}
                  min="0"
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-text-mute block mb-1">レベル</label>
                <select
                  value={formData.life_work_level}
                  onChange={(e) => updateField("life_work_level", e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="">選択</option>
                  <option value="修行中">修行中</option>
                  <option value="歩み中">歩み中</option>
                  <option value="一人前">一人前</option>
                </select>
              </div>
            </div>

            {/* Migration slider */}
            <div className="pt-2 border-t border-border">
              <label className="text-xs text-text-mute block mb-2">
                🌾 ライフワーク移行度
                <span className="block text-[10px] text-text-mute mt-0.5">
                  今の収入のうち、ライフワークが何割？（目安でOK）
                </span>
              </label>
              <MigrationBar
                percent={formData.migration_percent}
                riceWork={formData.rice_work || null}
                lifeWork={formData.life_work || null}
                editable
                onChange={(p) => setFormData((prev) => ({ ...prev, migration_percent: p }))}
              />
            </div>
          </div>
        </Card>

        {/* Story */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-sub">ストーリー</h3>
            <textarea
              value={formData.story}
              onChange={(e) => updateField("story", e.target.value)}
              rows={4}
              placeholder="なぜその仕事をしているのか、あなたの物語を…"
              className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm resize-none focus:border-accent focus:outline-none"
            />
          </div>
        </Card>

        <Button variant="primary" size="lg" className="w-full" type="submit" disabled={saving}>
          {saving ? "保存中..." : saved ? "✓ 保存しました" : "保存する"}
        </Button>
      </form>
    </div>
  );
}
