"use client";

export default function NotificationsPage() {
  return (
    <div className="space-y-3">
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
          🔔 お知らせ
        </h1>
        <p className="text-[11px] text-text-sub mt-1 leading-snug">
          種をまかれたとき・文をもらったとき
        </p>
      </div>

      <div
        className="text-center py-12 px-6 rounded-2xl border-2 border-dashed"
        style={{
          borderColor: "#c94d3a40",
          background:
            "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 100%)",
        }}
      >
        <p className="text-5xl mb-3">🔔</p>
        <p className="text-sm font-bold" style={{ color: "#c94d3a" }}>
          まだお知らせはありません
        </p>
        <p className="text-xs text-text-sub mt-1.5">
          誰かに種をまかれたり、文をもらうとここに表示されます
        </p>
      </div>
    </div>
  );
}
