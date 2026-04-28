import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <div className="max-w-[680px] mx-auto px-4 py-12 text-center">
      <img
        src="/icons/error-404.png"
        alt=""
        className="w-40 h-40 mx-auto mb-4"
      />
      <h1 className="text-xl font-bold mb-2" style={{ color: "#c94d3a" }}>
        むらびとが見つかりません
      </h1>
      <p className="text-sm text-text-sub mb-1">
        この人の名刺はありませんでした。
      </p>
      <p className="text-xs text-text-mute mb-6">
        URLが間違っているか、まだ準備中の可能性があります。
      </p>
      <Link
        href="/feed"
        className="inline-block bg-accent text-white rounded-full px-5 py-2.5 text-sm font-bold hover:opacity-90 transition shadow-sm no-underline"
      >
        🏮 みんなの楽座に戻る
      </Link>
    </div>
  );
}
