-- Publish the Mir Hamza signing story. The cover is the newsroom thumbnail.
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
    'news_mir_hamza_signing',
    'United Tigers Strengthen Bowling Attack with Signing of Pakistan International Mir Hamza for Abu Dhabi T10 2026',
    'mir-hamza-joins-united-tigers',
    'United Tigers have officially secured the services of Pakistan international left-arm fast bowler Mir Hamza for the upcoming 2026 Abu Dhabi T10 League, adding valuable international experience, quality and firepower to their bowling department.',
    $story$Abu Dhabi, UAE: United Tigers have officially secured the services of Pakistan international left-arm fast bowler Mir Hamza for the upcoming 2026 Abu Dhabi T10 League, adding valuable international experience, quality and firepower to their bowling department.

The experienced Pakistani pacer, known for his exceptional control, ability to swing the ball and disciplined bowling, is set to bring a new dimension to the United Tigers' pace attack in the fast-paced T10 format.

Having represented Pakistan at the international level and established himself as a reliable performer in domestic cricket, Mir Hamza arrives with a strong reputation for troubling batters through his accuracy, movement and intelligent variations.

His inclusion is expected to provide United Tigers with an important bowling option, particularly during the crucial powerplay overs, where early breakthroughs can significantly influence the outcome of a T10 contest.

The signing also underlines United Tigers' ambition to assemble a competitive and well-balanced squad capable of challenging the strongest franchises in the tournament.

With Pakistan star Fakhar Zaman leading the side, the addition of Mir Hamza further strengthens the franchise's Pakistani contingent and adds another experienced campaigner to its ranks.

United Tigers will be looking to make a strong impression in the 2026 Abu Dhabi T10 League, combining international talent, emerging players and an aggressive brand of cricket.

A new challenge awaits. A new Tiger joins the hunt.

**Welcome to United Tigers, Mir Hamza!** 🐅🇵🇰

The journey starts now. The roar begins in Abu Dhabi. Let's Go Hunt!$story$,
    '/news/mir-hamza-signing.jpg',
    'United Tigers',
    'TEAM NEWS',
    'PUBLISHED',
    true,
    false,
    TIMESTAMP '2026-10-26 06:00:00',
    'Mir Hamza joins United Tigers for Abu Dhabi T10 2026',
    'Pakistan international Mir Hamza joins United Tigers for the 2026 Abu Dhabi T10, adding control, swing and powerplay firepower to the pace attack.',
    '/news/mir-hamza-signing.jpg',
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
