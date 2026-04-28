"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border-2 px-4 py-4 text-center"
        style={{
          borderColor: "#c94d3a40",
          background:
            "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 50%, #fdf6e9 100%)",
        }}
      >
        <img
          src="/icons/welcome-hero.png"
          alt=""
          className="w-full max-w-md mx-auto rounded-xl mb-3"
        />
        <h1
          className="text-2xl font-bold tracking-wide"
          style={{ color: "#c94d3a" }}
        >
          楽市楽座について
        </h1>
        <p className="text-xs text-text-sub mt-1">
          AIの時代、自分の腕一本で。
        </p>
        <p className="text-[11px] text-text-mute mt-1">
          日本人総フリーランス化計画
        </p>
      </div>

      <Section title="🏮 楽市楽座とは" >
        <p>
          織田信長が安土に開いた市から名を取った、現代の<strong>市場</strong>。
          売る人と買う人、人と人が直接出会い、お金でも物々交換でも、
          縁を結ぶ場所です。
        </p>
        <p>
          ここに「売上ランキング」はありません。
          大切なのは金額の大小じゃなく、<strong>どれだけ交わったか</strong>。
        </p>
      </Section>

      <Section title="🌱 ライフワークとは">
        <p>
          「お金のためにする仕事」を <strong>ライスワーク</strong>、
          「本当にやりたい仕事」を <strong>ライフワーク</strong> と呼びます。
        </p>
        <p>
          楽市楽座は、ライスワークから始めた人が、少しずつ
          ライフワークに移行していく過程を応援します。
          まずは <strong>お試し出品（0円〜）</strong> でも構いません。
          物々交換や投げ銭で受け取れます。
        </p>
      </Section>

      <Section title="🛠 My Skill / 🌱 やりたいこと">
        <p>
          自分が <strong>役に立てること</strong>と、まだ出来ないけど
          <strong>やりたいこと</strong>を、両方マイページに登録できます。
        </p>
        <p>
          誰かが「料理できる人いない？」と SKILL検索 した時、
          あなたの名前が見つかる。漁師さんが獲った魚を「お米とやさい」と
          交換したい時、農家さんが見つかる。
        </p>
      </Section>

      <Section title="🤚 この指とまれ">
        <p>
          やりたいことを掲げて、仲間を集める掲示板。
          「一緒に味噌仕込まない？」「合宿企画したい」
          「沖縄で漁の手伝い募集」など、何でも投げてみよう。
        </p>
      </Section>

      <Section title="🗺 自然派・本格派・ナチュラル">
        <p>
          全国の自然食・代替医療・自然療法・自然派カフェ・神社が
          地図で見える。出張先で「自然食を見つけたい」が叶う。
        </p>
        <p>
          あなたが知っているお店を「みんなの推薦店」に登録できます。
        </p>
      </Section>

      <Section title="🔄 物々交換、お金、投げ銭">
        <p>
          楽座を出品するとき、3 つの受け取り方を選べます:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>💴 日本円で価格設定</li>
          <li>🔄 物々交換（自分の出品物と相手の出品物）</li>
          <li>🪙 投げ銭（気持ちで好きな額）</li>
        </ul>
        <p>
          受け渡し方法も「📦 発送 / 🤝 対面 / 🏠 引き取り / 💻 オンライン」
          から複数選べます。
        </p>
      </Section>

      <Section title="🌱 いいね">
        <p>
          情緒（投稿）に共感したら 🌱 いいね を送れます。
          受け取ったいいねが貯まると、その人の名刺で
          芽吹き → 若葉 → 開花 → 実り と育っていきます。
        </p>
      </Section>

      <Section title="🏮 フォロー">
        <p>
          気になるむらびとを「フォロー」すると、その人の情緒だけ
          まとめて見られるようになります（情緒 → フォロー中タブ）。
        </p>
      </Section>

      <div className="pt-2">
        <Link
          href="/feed"
          className="block w-full bg-accent text-white rounded-full py-3 text-center text-sm font-bold no-underline shadow-sm hover:opacity-90"
        >
          🏮 楽座 へ戻る
        </Link>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border border-border p-4 space-y-2 text-sm leading-relaxed"
      style={{
        background: "linear-gradient(180deg, #fffaf0 0%, #fdf6e9 100%)",
      }}
    >
      <h2 className="text-base font-bold" style={{ color: "#c94d3a" }}>
        {title}
      </h2>
      <div className="text-text-sub space-y-2">{children}</div>
    </div>
  );
}
