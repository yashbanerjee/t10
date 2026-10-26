-- Trim the Joe Clarke story to the approved announcement copy.
UPDATE "NewsArticle"
SET
    "content" = $story$United Tigers have officially secured the services of explosive English batter Joe Clarke for the upcoming Abu Dhabi T10 League 2026.

Renowned for his fearless stroke play, aggressive intent and match-winning ability, Clarke brings international franchise cricket experience and serious firepower to the Tigers' batting line-up.

United Tigers Head Coach Yasir Arafat expressed his excitement over the signing, stating:

> "Joe Clarke is exactly the kind of explosive batter we want in our squad. His aggressive approach, experience and ability to dominate bowling attacks make him a valuable addition. We believe he will play a crucial role in our campaign this season."$story$,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'joe-clarke-joins-united-tigers';
