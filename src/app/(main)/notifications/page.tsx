"use client";

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">🔔 お知らせ</h1>

      <div className="text-center py-12 text-text-mute">
        <p className="text-4xl mb-3">🔔</p>
        <p className="text-sm">まだお知らせはありません</p>
        <p className="text-xs mt-1">
          誰かに種をまかれたり、文をもらうとここに表示されます
        </p>
      </div>
    </div>
  );
}
