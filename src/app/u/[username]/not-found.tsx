import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ProfileNotFound() {
  return (
    <div className="max-w-[680px] mx-auto px-4 py-16 text-center">
      <p className="text-6xl mb-4">🏯</p>
      <h1 className="text-xl font-bold mb-2">村人が見つかりません</h1>
      <p className="text-sm text-text-sub mb-6">
        このページは存在しないか、まだ準備中です。
      </p>
      <Link href="/feed">
        <Button variant="primary">みんなの市場に戻る</Button>
      </Link>
    </div>
  );
}
