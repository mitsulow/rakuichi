"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useToast } from "@/components/ui/Toast";
import { createKomeField } from "@/lib/data";
import { PREFECTURES } from "@/lib/constants";
import type { KomeField } from "@/lib/types";

interface Props {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  onCreated: (field: KomeField) => void;
}

export function AddKomeFieldModal({
  isOpen,
  userId,
  onClose,
  onCreated,
}: Props) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");
  const [seasonInfo, setSeasonInfo] = useState("");
  const [maxHelpers, setMaxHelpers] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setPrefecture("");
    setCity("");
    setSeasonInfo("");
    setMaxHelpers("");
    setImageUrls([]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prefecture || saving) return;
    setSaving(true);
    const result = await createKomeField(userId, {
      name,
      description: description || null,
      prefecture,
      city: city || null,
      max_helpers: maxHelpers ? parseInt(maxHelpers) : null,
      season_info: seasonInfo || null,
      image_urls: imageUrls,
    });
    setSaving(false);
    if (result.error) {
      toast.show(`登録に失敗: ${result.error}`, "error");
      return;
    }
    if (result.data) {
      toast.show("🌾 田んぼを登録しました", "success");
      onCreated(result.data as KomeField);
      reset();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🌾 田んぼを米部に登録">
      <form onSubmit={submit} className="space-y-3">
        <p className="text-[11px] text-text-mute">
          手伝いに来てくれるむらびとに、田んぼの場所と
          だいたいの作業時期を伝えるイメージで。
        </p>

        <div>
          <label className="text-xs text-text-mute block mb-1">
            🌾 田んぼの名前 <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: みつろう田んぼ / 鏡山の棚田"
            className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
            required
            maxLength={60}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-text-mute block mb-1">
              都道府県 <span className="text-accent">*</span>
            </label>
            <select
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
              required
            >
              <option value="">選んで</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-mute block mb-1">
              市町村
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="例: 美瑛町"
              className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-text-mute block mb-1">
            田んぼの紹介・想い
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="どんな田んぼ？無農薬？棚田？地域は？"
            className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm resize-none focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-text-mute block mb-1">
            🗓 作業時期・通い方
          </label>
          <input
            type="text"
            value={seasonInfo}
            onChange={(e) => setSeasonInfo(e.target.value)}
            placeholder="例: 田植え5月、稲刈り10月、月1で歓迎"
            className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-text-mute block mb-1">
            🤝 募集する人数（任意）
          </label>
          <input
            type="number"
            value={maxHelpers}
            onChange={(e) => setMaxHelpers(e.target.value)}
            min="1"
            placeholder="例: 5"
            className="w-32 bg-bg border border-border rounded-xl px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-text-mute block mb-1">
            📷 田んぼの写真（任意）
          </label>
          <ImageUpload
            bucket="shop-images"
            userId={userId}
            values={imageUrls}
            onChangeMany={setImageUrls}
            multiple
            maxCount={3}
            placeholder="写真を追加"
            aspect="square"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!name.trim() || !prefecture || saving}
            className="flex-1"
          >
            {saving ? "登録中..." : "🌾 米部に登録"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
