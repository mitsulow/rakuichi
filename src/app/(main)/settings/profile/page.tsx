"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { CATEGORIES, PREFECTURES } from "@/lib/constants";
import { mockProfiles } from "@/lib/mock-data";

export default function ProfileSettingsPage() {
  // Simulate current user = u1
  const profile = mockProfiles[0];

  const [formData, setFormData] = useState({
    display_name: profile.display_name,
    bio: profile.bio || "",
    story: profile.story || "",
    status_line: profile.status_line || "",
    prefecture: profile.prefecture || "",
    city: profile.city || "",
    rice_work: profile.rice_work || "",
    life_work: profile.life_work || "",
    life_work_years: profile.life_work_years?.toString() || "",
    life_work_level: profile.life_work_level || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("プロフィールを保存しました（Supabase接続後に有効）");
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">プロフィール編集</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar */}
        <Card>
          <div className="flex items-center gap-4">
            <Avatar
              src={profile.avatar_url}
              alt={profile.display_name}
              size="lg"
            />
            <Button variant="secondary" size="sm" type="button">
              画像を変更
            </Button>
          </div>
        </Card>

        {/* Basic info */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-sub">基本情報</h3>

            <div>
              <label className="text-xs text-text-mute block mb-1">
                表示名
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => updateField("display_name", e.target.value)}
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-text-mute block mb-1">
                自己紹介（短め）
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                rows={2}
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm resize-none focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-text-mute block mb-1">
                今やってること（ステータス）
              </label>
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
                <label className="text-xs text-text-mute block mb-1">
                  都道府県
                </label>
                <select
                  value={formData.prefecture}
                  onChange={(e) => updateField("prefecture", e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="">選択</option>
                  {PREFECTURES.map((pref) => (
                    <option key={pref} value={pref}>
                      {pref}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-mute block mb-1">
                  市区町村
                </label>
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
              <label className="text-xs text-text-mute block mb-1">
                ライスワーク（生活のための仕事）
              </label>
              <input
                type="text"
                value={formData.rice_work}
                onChange={(e) => updateField("rice_work", e.target.value)}
                placeholder="例：会社員、パート"
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-text-mute block mb-1">
                ライフワーク（本当にやりたいこと）
              </label>
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
                <label className="text-xs text-text-mute block mb-1">
                  年数
                </label>
                <input
                  type="number"
                  value={formData.life_work_years}
                  onChange={(e) =>
                    updateField("life_work_years", e.target.value)
                  }
                  min="0"
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-text-mute block mb-1">
                  レベル
                </label>
                <select
                  value={formData.life_work_level}
                  onChange={(e) =>
                    updateField("life_work_level", e.target.value)
                  }
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="">選択</option>
                  <option value="修行中">修行中</option>
                  <option value="歩み中">歩み中</option>
                  <option value="一人前">一人前</option>
                </select>
              </div>
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

        <Button variant="primary" size="lg" className="w-full" type="submit">
          保存する
        </Button>
      </form>
    </div>
  );
}
