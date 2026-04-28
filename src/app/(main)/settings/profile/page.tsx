"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  fetchProfile,
  updateProfile,
  fetchExternalLinks,
  replaceExternalLinks,
} from "@/lib/data";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { SnsIcon, detectPlatform, getPlatformLabel } from "@/components/ui/SnsIcon";
import { SkillInput } from "@/components/ui/SkillInput";
import { MigrationBar } from "@/components/profile/MigrationBar";
import { PREFECTURES } from "@/lib/constants";

function ProfileSettingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "1";

  const [userId, setUserId] = useState<string | null>(null);
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState("初期化中...");
  const [loadError, setLoadError] = useState<string | null>(null);
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
    avatar_url: null as string | null,
    cover_url: null as string | null,
    show_on_map: true,
    skills: [] as string[],
    wants_to_do: [] as string[],
    line_qr_url: null as string | null,
    email_share_consent: false,
  });
  const [snsLinks, setSnsLinks] = useState<Array<{ platform: string; url: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoadingStep("セッションを確認中...");
        const supabase = createClient();
        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([
          sessionPromise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("session timeout")), 8000)
          ),
        ]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

        if (cancelled) return;

        if (!session) {
          router.replace("/login");
          return;
        }

        setUserId(session.user.id);
        setGoogleAvatarUrl(session.user.user_metadata?.avatar_url ?? null);

        setLoadingStep("プロフィールを取得中...");
        const profilePromise = fetchProfile(session.user.id);
        const linksPromise = fetchExternalLinks(session.user.id);

        const profile = await Promise.race([
          profilePromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);
        if (cancelled) return;

        setLoadingStep("リンクを取得中...");
        const links = await Promise.race([
          linksPromise,
          new Promise<[]>((resolve) => setTimeout(() => resolve([]), 8000)),
        ]);
        if (cancelled) return;

        setSnsLinks(
          (links as Array<{ platform: string; url: string }>).map((l) => ({
            platform: l.platform,
            url: l.url,
          }))
        );
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
            avatar_url:
              profile.avatar_url ?? session.user.user_metadata?.avatar_url ?? null,
            cover_url: profile.cover_url ?? null,
            show_on_map: profile.show_on_map ?? true,
            skills: Array.isArray(profile.skills) ? profile.skills : [],
            wants_to_do: Array.isArray(
              (profile as { wants_to_do?: string[] }).wants_to_do
            )
              ? (profile as { wants_to_do: string[] }).wants_to_do
              : [],
            line_qr_url:
              (profile as { line_qr_url?: string | null }).line_qr_url ??
              null,
            email_share_consent:
              (profile as { email_share_consent?: boolean | null })
                .email_share_consent === true,
          });
        }

        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setLoadError(msg);
        setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
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
      life_work_years: formData.life_work_years
        ? parseInt(formData.life_work_years)
        : null,
      life_work_level: formData.life_work_level || undefined,
      migration_percent: formData.migration_percent,
      avatar_url: formData.avatar_url,
      cover_url: formData.cover_url,
      show_on_map: formData.show_on_map,
      skills: formData.skills,
      wants_to_do: formData.wants_to_do,
      line_qr_url: formData.line_qr_url,
      email_share_consent: formData.email_share_consent,
    });

    // Save SNS links
    const { error: snsErr } = await replaceExternalLinks(userId, snsLinks);

    setSaving(false);

    if (error) {
      alert(`プロフィールの保存に失敗しました: ${error}\n\nSupabase SQL Editor で 006_bulletproof_fix.sql を実行してください。`);
      return;
    }
    if (snsErr) {
      alert(`SNSリンクの保存に失敗しました: ${snsErr}`);
      return;
    }

    setSaved(true);

    if (isOnboarding) {
      // Mark onboarding done in sessionStorage so gate doesn't loop
      if (userId) {
        try {
          localStorage.setItem(`rakuichi:onboarded:${userId}`, "yes");
        } catch {}
      }
      setTimeout(() => router.push("/feed?welcome=1"), 800);
    } else {
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const setField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-text-mute">{loadingStep}</p>
        <button
          type="button"
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="text-xs text-accent underline mt-4"
        >
          もう一度ログインしなおす
        </button>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-4xl">⚠️</p>
        <p className="text-sm font-medium">読み込みに失敗しました</p>
        <p className="text-xs text-text-mute break-all px-4">{loadError}</p>
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="block mx-auto text-sm text-accent underline"
          >
            もう一度試す
          </button>
          <button
            type="button"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              sessionStorage.clear();
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="block mx-auto text-xs text-text-mute underline"
          >
            セッションをクリアしてログインしなおす
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {!isOnboarding && (
          <button
            type="button"
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full hover:bg-bg-card flex items-center justify-center text-lg -ml-1"
            aria-label="戻る"
          >
            ←
          </button>
        )}
        <h1 className="text-lg font-bold">
          {isOnboarding ? "🏮 ようこそ、楽市楽座へ" : "プロフィール編集"}
        </h1>
      </div>

      {isOnboarding && (
        <div
          className="rounded-2xl border-2 px-4 py-3 flex items-center gap-3"
          style={{
            borderColor: "#c94d3a40",
            background:
              "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 50%, #fdf6e9 100%)",
          }}
        >
          <img
            src="/icons/onboarding-welcome.png"
            alt=""
            className="w-20 h-20 flex-shrink-0 rounded-xl"
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold leading-tight"
              style={{ color: "#c94d3a" }}
            >
              🏮 まずは名刺を整えよう
            </p>
            <p className="text-[11px] text-text-sub mt-1 leading-relaxed">
              これが「あなたの存在」になります。
              <br />
              ライフワーク・都道府県だけでもOK。
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar */}
        <Card>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-text-sub">🪞 アバター</h3>
            <div className="flex items-start gap-4">
              <Avatar
                src={formData.avatar_url}
                alt={formData.display_name}
                size="lg"
              />
              <div className="flex-1 space-y-2">
                <ImageUpload
                  bucket="avatars"
                  userId={userId!}
                  value={formData.avatar_url}
                  onChange={(url) => setField("avatar_url", url)}
                  placeholder="顔写真など"
                  aspect="square"
                />
                {googleAvatarUrl && formData.avatar_url !== googleAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setField("avatar_url", googleAvatarUrl)}
                    className="text-xs text-accent underline"
                  >
                    Googleの画像に戻す
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Cover image - store banner */}
        <Card>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-text-sub">
              🎨 カバー画像（宣伝用）
            </h3>
            <p className="text-xs text-text-mute">
              商品・作品・サービスのイメージが伝わる1枚を。マイページの一番上に大きく表示されます。
            </p>
            <ImageUpload
              bucket="covers"
              userId={userId!}
              value={formData.cover_url}
              onChange={(url) => setField("cover_url", url)}
              placeholder="カバー画像を追加"
              aspect="wide"
            />
          </div>
        </Card>

        {/* Work (moved up for onboarding priority) */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-sub">💪 ワーク</h3>
            <div>
              <label className="text-xs text-text-mute block mb-1">
                ライフワーク（本当にやりたいこと）
              </label>
              <input
                type="text"
                value={formData.life_work}
                onChange={(e) => updateField("life_work", e.target.value)}
                placeholder="例：陶芸家、ヨガインストラクター"
                className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-text-mute block mb-1">
                ライスワーク（生活のための仕事）
              </label>
              <input
                type="text"
                value={formData.rice_work}
                onChange={(e) => updateField("rice_work", e.target.value)}
                placeholder="例：会社員、パート（なければ空欄でOK）"
                className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-mute block mb-1">
                  移行年数
                  <span className="block text-[9px] text-text-mute mt-0.5">
                    ライスワーク→ライフワークに踏み出してから何年？
                  </span>
                </label>
                <input
                  type="number"
                  value={formData.life_work_years}
                  onChange={(e) => updateField("life_work_years", e.target.value)}
                  min="0"
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-text-mute block mb-1">レベル</label>
                <select
                  value={formData.life_work_level}
                  onChange={(e) => updateField("life_work_level", e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="">選択</option>
                  <option value="修行中">修行中</option>
                  <option value="歩み中">歩み中</option>
                  <option value="一人前">一人前</option>
                </select>
              </div>
            </div>

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
                onChange={(p) => setField("migration_percent", p)}
              />
            </div>
          </div>
        </Card>

        {/* Basic info */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-sub">📝 基本情報</h3>

            <div>
              <label className="text-xs text-text-mute block mb-1">表示名</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => updateField("display_name", e.target.value)}
                className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
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
                className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
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
                className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-text block mb-1">
                🌱 やりたいこと（DDP）
                <span className="block text-[10px] text-text-mute font-normal mt-0.5">
                  まだできなくてもOK。ライフワークの「たまご」を1個ずつ
                  並べよう。書くほど、自分の方向が見えてくる。
                </span>
              </label>
              <SkillInput
                value={formData.wants_to_do}
                onChange={(list) => setField("wants_to_do", list)}
                placeholder="1個目のやりたいことを入れて Enter"
                variant="indigo"
                celebrate
                celebrateNoun="やりたいこと"
                suggestions={[
                  "自然栽培",
                  "農業",
                  "山に住む",
                  "海外移住",
                  "自然食レストラン",
                  "ゲストハウス",
                  "カフェ開く",
                  "本を出す",
                  "ブログ書く",
                  "YouTube",
                  "ライブ配信",
                  "個展開く",
                  "音楽家",
                  "歌手",
                  "DJ",
                  "三味線",
                  "和太鼓",
                  "ギター",
                  "ダンス",
                  "ヨガ講師",
                  "瞑想",
                  "整体師",
                  "鍼灸師",
                  "助産師",
                  "保育",
                  "子育て",
                  "占い師",
                  "ホロスコープ",
                  "釣り",
                  "猟",
                  "山菜採り",
                  "漁師",
                  "養鶏",
                  "養蜂",
                  "発酵",
                  "薬草",
                  "アロマ",
                  "ハーブ",
                  "陶芸",
                  "木工",
                  "DIY",
                  "建築",
                  "茶道",
                  "華道",
                  "書道",
                  "イラスト",
                  "写真",
                  "動画編集",
                  "デザイン",
                  "プログラミング",
                  "翻訳",
                  "独立",
                  "フリーランス",
                ]}
              />
            </div>

            <div className="pt-3 border-t border-dashed border-border">
              <label className="text-sm font-bold text-text block mb-1">
                🛠 やれること（SKILL）
                <span className="block text-[10px] text-text-mute font-normal mt-0.5">
                  「こんなことでもいいの？」レベルでOK。
                  パソコン・運転・人付き合い・英検…なんでも。
                  誰かが「○○できる人いない？」と探した時に見つかります。
                </span>
              </label>
              <SkillInput
                value={formData.skills}
                onChange={(skills) => setField("skills", skills)}
                placeholder="1個目のやれることを入れて Enter"
                celebrate
                celebrateNoun="やれること"
                suggestions={[
                  "パソコン",
                  "エクセル",
                  "ワード",
                  "パワポ",
                  "メール",
                  "事務作業",
                  "経理",
                  "電卓",
                  "そろばん",
                  "英語",
                  "英検",
                  "翻訳",
                  "通訳",
                  "運転",
                  "バイク",
                  "人付き合い",
                  "話を聞く",
                  "カウンセリング",
                  "営業",
                  "接客",
                  "電話対応",
                  "プレゼン",
                  "司会",
                  "ライティング",
                  "ブログ",
                  "SEO",
                  "SNS運用",
                  "イラスト",
                  "デザイン",
                  "写真",
                  "動画編集",
                  "音楽制作",
                  "プログラミング",
                  "HTML",
                  "Excel関数",
                  "料理",
                  "お弁当作り",
                  "パン作り",
                  "発酵食品",
                  "整体",
                  "マッサージ",
                  "ヨガ",
                  "気功",
                  "鍼灸",
                  "助産",
                  "看護",
                  "介護",
                  "保育",
                  "子育て",
                  "縫物",
                  "編み物",
                  "DIY",
                  "木工",
                  "陶芸",
                  "農業",
                  "釣り",
                  "野草",
                  "ピアノ",
                  "ギター",
                  "歌",
                  "踊り",
                  "占い",
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Location + map visibility */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-sub">📍 住んでいる場所</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-mute block mb-1">
                  都道府県
                </label>
                <select
                  value={formData.prefecture}
                  onChange={(e) => updateField("prefecture", e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
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
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-bg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.show_on_map}
                onChange={(e) => setField("show_on_map", e.target.checked)}
                className="mt-0.5 w-4 h-4"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  🗺 マップにマイページを表示する
                </div>
                <div className="text-xs text-text-mute mt-0.5">
                  あなたの都道府県のマップ上に、あなたの楽座が表示されます。
                  オフにすると非表示になります。
                </div>
              </div>
            </label>
          </div>
        </Card>

        {/* LINE 連絡 — QR がいちばん簡単 */}
        <Card>
          <div className="space-y-3">
            <h3
              className="text-sm font-bold flex items-center gap-1.5"
              style={{ color: "#06C755" }}
            >
              <SnsIcon platform="line" size={18} />
              LINEで連絡できるようにする
            </h3>
            <p className="text-xs text-text-mute leading-relaxed">
              他のむらびとが「💬連絡」を押した時、LINEに直接
              つなげるようになります。
            </p>

            <div className="rounded-xl border-2 border-dashed border-border bg-bg/40 p-3 space-y-3">
              <div className="text-xs font-bold text-text-sub">
                📱 一番カンタン: LINEのQRコードをそのままアップ
              </div>
              <ol className="text-[11px] text-text-sub space-y-1 list-decimal pl-5">
                <li>LINEアプリ → 「ホーム」 → 自分の名前 → 「QRコード」</li>
                <li>そのQR画面の <strong>スクショ</strong> を撮る</li>
                <li>下のボタンからアップロード（写真フォルダから選ぶだけ）</li>
              </ol>
              <ImageUpload
                bucket="avatars"
                userId={userId!}
                value={formData.line_qr_url}
                onChange={(url) => setField("line_qr_url", url)}
                placeholder="📷 LINEのQR画像を選ぶ"
                aspect="square"
              />
              {formData.line_qr_url && (
                <p className="text-[11px] font-bold" style={{ color: "#06C755" }}>
                  ✓ LINE のQRが登録できました
                </p>
              )}
            </div>

            <details className="text-xs text-text-mute">
              <summary className="cursor-pointer py-1 font-medium">
                URLでも登録できます（パソコン慣れてる人向け）
              </summary>
              {!snsLinks.some((l) => l.platform === "line") && (
                <button
                  type="button"
                  onClick={() =>
                    setSnsLinks((prev) => [
                      ...prev,
                      { platform: "line", url: "" },
                    ])
                  }
                  className="mt-2 w-full flex items-center gap-2 p-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition shadow-sm"
                  style={{ background: "#06C755" }}
                >
                  <SnsIcon platform="line" size={18} />
                  <span>＋ LINE のリンクを追加</span>
                </button>
              )}
            </details>
          </div>
        </Card>

        {/* Email share consent */}
        <Card>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-text-sub">
              ✉ メールでの連絡
            </h3>
            <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-bg/40 transition">
              <input
                type="checkbox"
                checked={formData.email_share_consent}
                onChange={(e) =>
                  setField("email_share_consent", e.target.checked)
                }
                className="mt-1"
              />
              <div className="flex-1 text-xs">
                <div className="font-medium text-text">
                  メールでの連絡を受け取る
                </div>
                <div className="text-text-mute mt-0.5">
                  チェックを入れると、他のむらびとがあなたの名刺の「連絡」
                  からメール（Google認証で取れている宛先）であなたに連絡
                  できるようになります。
                </div>
              </div>
            </label>
          </div>
        </Card>

        {/* SNS Links */}
        <Card>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-text-sub">🔗 その他のSNSリンク</h3>
            <p className="text-xs text-text-mute">
              Instagram・X・note・YouTube など、貼っておきたい外部リンクを追加
            </p>

            <div className="space-y-2">
              {snsLinks.map((link, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 border border-border rounded-xl bg-bg"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(0,0,0,0.04)" }}
                  >
                    <SnsIcon platform={link.platform} size={20} />
                  </div>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => {
                      const url = e.target.value;
                      setSnsLinks((prev) => {
                        const next = [...prev];
                        next[i] = { url, platform: url ? detectPlatform(url) : link.platform };
                        return next;
                      });
                    }}
                    placeholder="https://..."
                    className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSnsLinks((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="text-text-mute hover:text-red-500 w-8 h-8 flex items-center justify-center"
                    aria-label="削除"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setSnsLinks((prev) => [...prev, { platform: "website", url: "" }])
              }
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 text-sm text-text-mute hover:text-accent transition-colors"
            >
              ＋ リンクを追加
            </button>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-text-mute">対応:</span>
              {[
                "instagram",
                "x",
                "facebook",
                "youtube",
                "tiktok",
                "note",
                "ameblo",
                "line",
                "threads",
                "website",
              ].map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-0.5 text-[10px] text-text-mute"
                  title={getPlatformLabel(p)}
                >
                  <SnsIcon platform={p} size={14} />
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Story */}
        <Card>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-text-sub">📖 ストーリー</h3>
            <textarea
              value={formData.story}
              onChange={(e) => updateField("story", e.target.value)}
              rows={4}
              placeholder="なぜその仕事をしているのか、あなたの物語を…"
              className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:border-accent focus:outline-none"
            />
          </div>
        </Card>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          type="submit"
          disabled={saving}
        >
          {saving
            ? "保存中..."
            : saved
            ? "✓ 保存しました"
            : isOnboarding
            ? "🪧 マイページを開く"
            : "保存する"}
        </Button>

        {isOnboarding && (
          <button
            type="button"
            onClick={() => router.push("/feed")}
            className="w-full text-xs text-text-mute underline py-2"
          >
            あとで設定する
          </button>
        )}
      </form>
    </div>
  );
}

export default function ProfileSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-text-mute text-sm">
          読み込み中...
        </div>
      }
    >
      <ProfileSettingsInner />
    </Suspense>
  );
}
