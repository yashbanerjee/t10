-- Publish the Joe Clarke signing story. The cover is the newsroom thumbnail.
INSERT INTO "NewsArticle" (
    "id",
    "title",
    "slug",
    "excerpt",
    "content",
    "coverImage",
    "authorName",
    "category",
    "status",
    "isFeatured",
    "isDemo",
    "publishedAt",
    "seoTitle",
    "seoDescription",
    "ogImage",
    "updatedAt"
) VALUES (
    'news_joe_clarke_signing',
    'United Tigers Sign English Powerhouse Joe Clarke for Abu Dhabi T10 2026',
    'joe-clarke-joins-united-tigers',
    'United Tigers have officially secured the services of explosive English batter Joe Clarke for the upcoming Abu Dhabi T10 League 2026.',
    $story$United Tigers have officially secured the services of explosive English batter Joe Clarke for the upcoming Abu Dhabi T10 League 2026.

Renowned for his fearless stroke play, aggressive intent and match-winning ability, Clarke brings international franchise cricket experience and serious firepower to the Tigers' batting line-up.

United Tigers Head Coach Yasir Arafat expressed his excitement over the signing, stating:

> "Joe Clarke is exactly the kind of explosive batter we want in our squad. His aggressive approach, experience and ability to dominate bowling attacks make him a valuable addition. We believe he will play a crucial role in our campaign this season."

**English firepower. Fearless cricket. The Tigers are ready to roar!** 🐅🏏

#UnitedTigers #JoeClarke #AbuDhabiT10 #LetsGoHunt$story$,
    '/news/joe-clarke-signing.jpg',
    'United Tigers',
    'TEAM NEWS',
    'PUBLISHED',
    true,
    false,
    TIMESTAMP '2026-10-26 07:30:00',
    'Joe Clarke joins United Tigers for Abu Dhabi T10 2026',
    'Explosive English batter Joe Clarke joins United Tigers for the 2026 Abu Dhabi T10, adding fearless stroke play to the batting line-up.',
    '/news/joe-clarke-signing.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO UPDATE SET
    "title" = EXCLUDED."title",
    "excerpt" = EXCLUDED."excerpt",
    "content" = EXCLUDED."content",
    "coverImage" = EXCLUDED."coverImage",
    "authorName" = EXCLUDED."authorName",
    "category" = EXCLUDED."category",
    "status" = EXCLUDED."status",
    "isFeatured" = EXCLUDED."isFeatured",
    "isDemo" = false,
    "publishedAt" = EXCLUDED."publishedAt",
    "seoTitle" = EXCLUDED."seoTitle",
    "seoDescription" = EXCLUDED."seoDescription",
    "ogImage" = EXCLUDED."ogImage",
    "updatedAt" = CURRENT_TIMESTAMP;
