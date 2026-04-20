interface StorySectionProps {
  story: string | null;
}

export function StorySection({ story }: StorySectionProps) {
  if (!story) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-text-sub">ストーリー</h3>
      <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
        {story}
      </p>
    </div>
  );
}
