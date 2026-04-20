"use client";

interface FeedFilterTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "region", emoji: "🗾", label: "地域から" },
  { id: "category", emoji: "🗂", label: "カテゴリ" },
  { id: "following", emoji: "👥", label: "フォロー中" },
  { id: "featured", emoji: "⭐", label: "新着注目" },
];

export function FeedFilterTabs({ activeTab, onTabChange }: FeedFilterTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto hide-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
            activeTab === tab.id
              ? "bg-accent text-white"
              : "bg-card text-text-sub border border-border hover:bg-bg"
          }`}
        >
          <span>{tab.emoji}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
