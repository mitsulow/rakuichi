"use client";

const GREETINGS = [
  {
    title: "今日は何を投げる？",
    body: "情緒を一言、楽座を一品。村が動き出す。",
  },
  {
    title: "AIの時代、自分の腕一本で。",
    body: "誰かが「料理できる人いない？」と探した時、あなたが見つかる場所。",
  },
  {
    title: "ライスワークから、ライフワークへ。",
    body: "1%でも今日、ライフワークに近づけたら勝ち。",
  },
  {
    title: "売上ではなく、どれだけ交わったか。",
    body: "楽市楽座にあるのは「出会い」の指標だけ。",
  },
  {
    title: "🌾 お米と野菜は、村の血液。",
    body: "農家と漁師、職人と母さん。物々交換が始まる。",
  },
  {
    title: "「お試し出店」もOK。",
    body: "値段をつける自信がなくても、まず一座 出してみよう。",
  },
  {
    title: "🤚 この指とまれ。",
    body: "やりたいことを掲げると、仲間が指をあげる。",
  },
  {
    title: "🏮 のれんをくぐる。",
    body: "気になる座の民をフォローして、つながりを増やそう。",
  },
  {
    title: "情緒は、心の天気予報。",
    body: "今日の出来事、嬉しかったこと、ぼやきも全部 投げてOK。",
  },
  {
    title: "毎週水曜20時、楽市が立つ。",
    body: "今週の楽座、あなたかもしれない。",
  },
  {
    title: "📍 沖縄から北海道まで。",
    body: "出張先で「自然食」、地図で一発で見つかる楽市楽座。",
  },
  {
    title: "🌱 種をまく、芽吹く、実る。",
    body: "誰かに種を投げると、相手の中で何かが育つ。",
  },
  {
    title: "あなたができることが、誰かの「やりたいこと」。",
    body: "🛠 My Skill で名前を残そう。",
  },
  {
    title: "まずは「自分のやりたいこと」を 1個。",
    body: "🌱 やりたいことに、年齢も実績も関係ない。",
  },
];

/**
 * Pick a greeting deterministically by day-of-year so it's the same for
 * everyone on the same day, but rotates daily.
 */
function pickGreeting() {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return GREETINGS[dayOfYear % GREETINGS.length];
}

export function DailyGreeting() {
  const g = pickGreeting();
  return (
    <div
      className="rounded-2xl border-2 px-4 py-3"
      style={{
        borderColor: "#c94d3a40",
        background:
          "linear-gradient(135deg, #fdf6e9 0%, #f5e8d5 50%, #fdf6e9 100%)",
      }}
    >
      <p
        className="text-sm font-bold leading-snug"
        style={{ color: "#c94d3a" }}
      >
        {g.title}
      </p>
      <p className="text-[11px] text-text-sub mt-1 leading-snug">{g.body}</p>
    </div>
  );
}
