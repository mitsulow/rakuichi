-- 012: Add subcategory + delivery_methods to shops.
-- Purpose: surface "お米とやさい" / "お魚とお肉" as first-class facets,
-- and let shops state how the goods/service is delivered (shipping,
-- in-person, pickup, online, mail). Existing rows keep working — both
-- columns are nullable / default-empty.

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS delivery_methods TEXT[] DEFAULT '{}'::TEXT[];

CREATE INDEX IF NOT EXISTS idx_shops_subcategory ON shops(subcategory);
CREATE INDEX IF NOT EXISTS idx_shops_delivery ON shops USING GIN (delivery_methods);
