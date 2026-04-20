import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatusLine } from "@/components/profile/StatusLine";
import { WorkSection } from "@/components/profile/WorkSection";
import { StorySection } from "@/components/profile/StorySection";
import { ShopList } from "@/components/profile/ShopList";
import { WishList } from "@/components/profile/WishList";
import { TradeRecord } from "@/components/profile/TradeRecord";
import { ExternalLinks } from "@/components/profile/ExternalLinks";
import { RecentPosts } from "@/components/profile/RecentPosts";
import {
  getProfileByUsername,
  getBadgesByUserId,
  getShopsByOwnerId,
  getWishesByUserId,
  getPostsByUserId,
  getExternalLinksByUserId,
} from "@/lib/mock-data";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  // TODO: Replace with real auth check once Supabase is connected
  const currentUserId = "u1"; // Simulated logged-in user
  const isOwner = profile.id === currentUserId;

  const badges = getBadgesByUserId(profile.id);
  const shops = getShopsByOwnerId(profile.id);
  const wishes = getWishesByUserId(profile.id);
  const posts = getPostsByUserId(profile.id);
  const externalLinks = getExternalLinksByUserId(profile.id);

  return (
    <div className="max-w-[680px] mx-auto px-4 py-4 space-y-4">
      {/* Header section */}
      <Card>
        <ProfileHeader
          profile={profile}
          badges={badges}
          externalLinks={externalLinks}
          isOwner={isOwner}
        />
      </Card>

      {/* Status line */}
      <StatusLine statusLine={profile.status_line} />

      {/* Work section */}
      <Card>
        <WorkSection profile={profile} />
      </Card>

      {/* Story */}
      {profile.story && (
        <Card>
          <StorySection story={profile.story} />
        </Card>
      )}

      {/* Shops (paid members only) */}
      {profile.is_paid && shops.length > 0 && (
        <Card>
          <ShopList shops={shops} />
        </Card>
      )}

      {/* Wish list */}
      {wishes.length > 0 && (
        <Card>
          <WishList wishes={wishes} />
        </Card>
      )}

      {/* Trade record */}
      <Card>
        <TradeRecord
          profile={profile}
          transactionCount={Math.floor(Math.random() * 50 + 10)}
          barterCount={
            profile.is_paid ? Math.floor(Math.random() * 20 + 5) : 0
          }
        />
      </Card>

      {/* External links */}
      {externalLinks.length > 0 && (
        <Card>
          <ExternalLinks links={externalLinks} />
        </Card>
      )}

      {/* Recent posts */}
      {posts.length > 0 && (
        <Card>
          <RecentPosts posts={posts} username={username} />
        </Card>
      )}
    </div>
  );
}
