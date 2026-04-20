import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { mockProfiles } from "@/lib/mock-data";

const mockNotifications = [
  {
    id: "n1",
    type: "like",
    emoji: "🌱",
    text: "があなたの立て札に種をまきました",
    userId: "u2",
    createdAt: "2026-04-20T10:00:00Z",
  },
  {
    id: "n2",
    type: "follow",
    emoji: "🏮",
    text: "があなたののれんをくぐりました",
    userId: "u7",
    createdAt: "2026-04-19T15:00:00Z",
  },
  {
    id: "n3",
    type: "comment",
    emoji: "📜",
    text: "があなたの立て札に文を寄せました",
    userId: "u5",
    createdAt: "2026-04-18T12:00:00Z",
  },
  {
    id: "n4",
    type: "badge",
    emoji: "🏆",
    text: "「一人前」バッジが付与されました",
    userId: null,
    createdAt: "2026-04-17T09:00:00Z",
  },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">🔔 お知らせ</h1>

      <div className="space-y-2">
        {mockNotifications.map((notif) => {
          const user = notif.userId
            ? mockProfiles.find((p) => p.id === notif.userId)
            : null;

          return (
            <Card key={notif.id} className="!p-3">
              <div className="flex items-center gap-3">
                {user ? (
                  <Avatar
                    src={user.avatar_url}
                    alt={user.display_name}
                    size="sm"
                  />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center text-xl">
                    {notif.emoji}
                  </div>
                )}
                <p className="text-sm flex-1">
                  {user && (
                    <span className="font-medium">{user.display_name}</span>
                  )}
                  {notif.text}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
