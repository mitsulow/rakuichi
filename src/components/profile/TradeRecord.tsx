import type { Profile } from "@/lib/types";

interface TradeRecordProps {
  profile: Profile;
  transactionCount?: number;
  barterCount?: number;
}

export function TradeRecord({
  profile,
  transactionCount = 0,
  barterCount = 0,
}: TradeRecordProps) {
  const memberSince = new Date(profile.created_at);
  const now = new Date();
  const years = Math.max(
    0,
    Math.floor(
      (now.getTime() - memberSince.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    )
  );
  const yearsText = years < 1 ? "1年未満" : `${years}年`;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-text-sub">取引実績</h3>
      <div className="flex gap-4 text-center">
        <div className="flex-1 bg-bg rounded-xl p-3">
          <div className="text-lg font-bold text-text">{transactionCount}</div>
          <div className="text-xs text-text-mute">取引件数</div>
        </div>
        <div className="flex-1 bg-bg rounded-xl p-3">
          <div className="text-lg font-bold text-text">{yearsText}</div>
          <div className="text-xs text-text-mute">楽市楽座歴</div>
        </div>
        {profile.is_paid && (
          <div className="flex-1 bg-bg rounded-xl p-3">
            <div className="text-lg font-bold text-text">{barterCount}</div>
            <div className="text-xs text-text-mute">物々交換</div>
          </div>
        )}
      </div>
    </div>
  );
}
