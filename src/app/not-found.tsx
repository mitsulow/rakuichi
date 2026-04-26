import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center">
      <img
        src="/icons/error-404.png"
        alt=""
        className="w-48 h-48 mb-4"
      />
      <h1
        className="text-xl font-bold mb-2"
        style={{ color: "#c94d3a" }}
      >
        ここには何もありません
      </h1>
      <p className="text-sm text-text-sub mb-1">
        道に迷ったみたい。
      </p>
      <p className="text-xs text-text-mute mb-6">
        URLが間違っているか、削除された可能性があります。
      </p>
      <Link
        href="/feed"
        className="inline-block bg-accent text-white rounded-full px-5 py-2.5 text-sm font-bold hover:opacity-90 transition shadow-sm no-underline"
      >
        🏮 楽座に戻る
      </Link>
    </div>
  );
}
