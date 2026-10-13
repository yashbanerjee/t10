import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/pages/club_pages.dart';
import 'package:united_tigers/pages/fan_pages.dart';
import 'package:united_tigers/pages/fixtures_page.dart';
import 'package:united_tigers/pages/more_pages.dart';
import 'package:united_tigers/pages/shop_pages.dart';
import 'package:united_tigers/pages/team_page.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/video.dart';
import 'package:united_tigers/widgets.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return AnimatedBuilder(
      animation: api,
      builder: (context, _) {
        if (api.loading && api.catalog.isEmpty) {
          return const Scaffold(body: LoadingView());
        }
        if (api.error != null && api.catalog.isEmpty) {
          return Scaffold(body: MessageView(api.error!, onRetry: api.refresh));
        }
        final catalog = api.catalog;
        final upcoming = catalog.matches
            .where((match) => match.status == 'UPCOMING' || match.isLive)
            .firstOrNull;
        final completed = catalog.matches
            .where((match) => match.isCompleted)
            .toList();
        final listed = [
          ...completed.reversed.take(2).toList().reversed,
          ...catalog.matches
              .where((match) => match.status == 'UPCOMING' || match.isLive)
              .take(1),
        ];
        final poll = api.featuredPoll;
        final featuredKit = catalog.products
            .where((product) => product.isFeatured)
            .toList();
        final kit = (featuredKit.isEmpty ? catalog.products : featuredKit).take(
          4,
        );
        const tigerOrder = [
          'fakhar-zaman',
          'faheem-ashraf',
          'azmatullah-omarzai',
          'nurul-hasan',
        ];
        final squad = [
          for (final slug in tigerOrder)
            ...catalog.players.where((player) => player.slug == slug),
        ];
        final roster = squad.isEmpty ? catalog.players.take(4).toList() : squad;
        final pastMatches = catalog.gallery
            .where(
              (item) =>
                  (item.category ?? '').toLowerCase().contains('past match'),
            )
            .toList();
        final pastPhotos = pastMatches.where((item) => !item.isVideo).toList();
        final clips = [
          ...pastMatches.where((item) => item.isVideo),
          ...pastPhotos,
        ].take(3).toList();
        final shown = clips.map((item) => item.mediaUrl).toSet();
        final moments = pastPhotos
            .where((item) => !shown.contains(item.mediaUrl))
            .take(4)
            .toList();
        final scale = clubScale(context);

        return Scaffold(
          body: RefreshIndicator(
            onRefresh: api.refresh,
            child: ListView(
              scrollCacheExtent: pageCacheExtent,
              padding: EdgeInsets.fromLTRB(
                16,
                0,
                16,
                24 + navClearance(context),
              ),
              children: [
                SizedBox(
                  height: HomeHero.heroHeight(context),
                  child: OverflowBox(
                    minWidth: MediaQuery.sizeOf(context).width,
                    maxWidth: MediaQuery.sizeOf(context).width,
                    child: HomeHero(banner: api.banner),
                  ),
                ),
                if (upcoming == null) ...[
                  const SectionTitle('NEXT MATCH'),
                  const ClubCard(
                    child: Text(
                      'The next fixture will appear here as soon as it is confirmed.',
                    ),
                  ),
                ] else ...[
                  const SizedBox(height: 22),
                  ClubCard(
                    highlight: true,
                    padding: EdgeInsets.zero,
                    onTap: () => openMatch(context, upcoming),
                    child: _NextMatch(match: upcoming),
                  ),
                ],
                SectionTitle(
                  'MEET OUR TIGERS',
                  action: 'View all',
                  onAction: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const TeamPage()),
                  ),
                ),
                SizedBox(
                  height: 214 * scale,
                  child: ListView.separated(
                    scrollCacheExtent: pageCacheExtent,
                    scrollDirection: Axis.horizontal,
                    clipBehavior: Clip.none,
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    itemCount: roster.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 12),
                    itemBuilder: (context, index) => SizedBox(
                      width: 146 * scale,
                      child: _TigerCard(
                        player: roster[index],
                        order: index,
                        glowing: index.isEven,
                      ),
                    ),
                  ),
                ),
                SectionTitle(
                  'THE VOTE',
                  action: 'All polls',
                  onAction: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const VotePage()),
                  ),
                ),
                ClubCard(
                  highlight: true,
                  onTap: poll == null ? null : () => openPoll(context, poll),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GoldText(
                        'VOTE FOR\nPLAYER OF THE MATCH',
                        style: displayStyle(30),
                      ),
                      const SizedBox(height: 8),
                      Text(poll?.question ?? 'Who lit up the game?'),
                      const SizedBox(height: 12),
                      if (poll != null)
                        SizedBox(
                          height: 54 * scale,
                          child: ListView(
                            scrollCacheExtent: pageCacheExtent,
                            scrollDirection: Axis.horizontal,
                            children: poll.options.take(5).map((option) {
                              final face = _faceFor(
                                option.label,
                                catalog.players,
                              );
                              return Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: CircleAvatar(
                                  radius: 26 * scale,
                                  backgroundColor: glow,
                                  backgroundImage: face?.profileImage == null
                                      ? null
                                      : NetworkImage(
                                          api.media(face!.profileImage),
                                        ),
                                  child: face?.profileImage == null
                                      ? Text(
                                          option.label.isEmpty
                                              ? '?'
                                              : option.label[0],
                                        )
                                      : null,
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      const SizedBox(height: 12),
                      FilledButton(
                        style: goldButtonStyle(),
                        onPressed: poll == null
                            ? null
                            : () => openPoll(context, poll),
                        child: const Text('CAST YOUR VOTE'),
                      ),
                    ],
                  ),
                ),
                const SectionTitle('TIGERS NATION'),
                const ClubCard(
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _Stat(
                              FontAwesomeIcons.users,
                              '1M+',
                              'Fans worldwide',
                            ),
                          ),
                          Expanded(
                            child: _Stat(
                              FontAwesomeIcons.shieldHalved,
                              '7',
                              'Franchise teams',
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: _Stat(
                              FontAwesomeIcons.earthAsia,
                              '150+',
                              'International players',
                            ),
                          ),
                          Expanded(
                            child: _Stat(
                              FontAwesomeIcons.trophy,
                              '2',
                              'Championships',
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (clips.isNotEmpty) ...[
                  SectionTitle(
                    'PAST MATCHES',
                    action: 'View all',
                    onAction: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const GalleryPage()),
                    ),
                  ),
                  SizedBox(
                    height: 168 * scale,
                    child: ListView.separated(
                      scrollCacheExtent: pageCacheExtent,
                      scrollDirection: Axis.horizontal,
                      itemCount: clips.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 10),
                      itemBuilder: (context, index) {
                        final item = clips[index];
                        return SizedBox(
                          width: (index == 0 ? 260 : 150) * scale,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Builder(
                                  builder: (context) {
                                    final tile = Stack(
                                      fit: StackFit.expand,
                                      children: [
                                        if (item.isVideo)
                                          VideoThumb(api.media(item.mediaUrl))
                                        else
                                          RemoteImage(
                                            api.media(item.mediaUrl),
                                            height: 140,
                                            radius: 0,
                                          ),
                                        if (item.isVideo)
                                          const Center(
                                            child: Floating(
                                              distance: 3,
                                              child: FaIcon(
                                                FontAwesomeIcons.circlePlay,
                                                color: goldLight,
                                                size: 38,
                                              ),
                                            ),
                                          ),
                                        Positioned(
                                          left: 8,
                                          bottom: 8,
                                          child: MediaBadge(
                                            label: item.isVideo
                                                ? 'VIDEO'
                                                : 'PHOTO',
                                          ),
                                        ),
                                      ],
                                    );
                                    return GestureDetector(
                                      onTap: () => openGallery(
                                        context,
                                        clips,
                                        item,
                                        api.media,
                                      ),
                                      child: index == 0
                                          ? GlowFrame(
                                              radius: 14,
                                              colors: neonPink,
                                              offset: 0.4,
                                              child: tile,
                                            )
                                          : ClipRRect(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              child: tile,
                                            ),
                                    );
                                  },
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                item.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
                SectionTitle(
                  'FIXTURES & RESULTS',
                  action: 'View all',
                  onAction: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const FixturesPage()),
                  ),
                ),
                ...listed.map(
                  (match) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: ClubCard(
                      onTap: () => openMatch(context, match),
                      child: _FixtureRow(match: match),
                    ),
                  ),
                ),
                const HomePartnerCta(),
                if (moments.isNotEmpty)
                  SectionTitle(
                    'FEATURED MOMENTS',
                    action: 'Gallery',
                    onAction: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const GalleryPage()),
                    ),
                  ),
                if (moments.isNotEmpty)
                  SizedBox(
                    height: 120 * scale,
                    child: ListView.separated(
                      scrollCacheExtent: pageCacheExtent,
                      scrollDirection: Axis.horizontal,
                      itemCount: moments.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 8),
                      itemBuilder: (context, index) => GestureDetector(
                        onTap: () => openGallery(
                          context,
                          moments,
                          moments[index],
                          api.media,
                        ),
                        child: SizedBox(
                          width: 160 * scale,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              if (moments[index].isVideo)
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(14),
                                  child: VideoThumb(
                                    api.media(moments[index].mediaUrl),
                                  ),
                                )
                              else
                                RemoteImage(
                                  api.media(moments[index].mediaUrl),
                                  height: 120,
                                ),
                              Positioned(
                                left: 8,
                                bottom: 8,
                                child: MediaBadge(
                                  label: moments[index].isVideo
                                      ? 'VIDEO'
                                      : 'PHOTO',
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                SectionTitle(
                  'OFFICIAL KIT',
                  action: 'Shop all',
                  onAction: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ShopPage()),
                  ),
                ),
                ...kit.map(
                  (product) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: ClubCard(
                      onTap: () => openProduct(context, product),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 84 * scale,
                            child: RemoteImage(
                              api.media(product.image),
                              height: 84,
                              radius: 12,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  product.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                Text(
                                  money(product.price),
                                  style: const TextStyle(color: orange),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (catalog.updates.isNotEmpty) ...[
                  SectionTitle(
                    'TIGERS DAILY',
                    action: 'View all',
                    onAction: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const UpdatesPage()),
                    ),
                  ),
                  ...catalog.updates
                      .take(2)
                      .map(
                        (update) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: ClubCard(
                            onTap: () => openUpdate(context, update),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  update.category?.replaceAll('_', ' ') ??
                                      'UPDATE',
                                  style: const TextStyle(
                                    color: gold,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                Text(
                                  update.title,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                Text(
                                  update.description,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                ],
                if (catalog.contests.isNotEmpty) ...[
                  SectionTitle(
                    'FAN CONTEST',
                    action: 'All contests',
                    onAction: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const VotePage()),
                    ),
                  ),
                  ClubCard(
                    onTap: () => openContest(context, catalog.contests.first),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          catalog.contests.first.title.toUpperCase(),
                          style: displayStyle(24, color: Colors.white),
                        ),
                        if (catalog.contests.first.prize != null) ...[
                          const SizedBox(height: 6),
                          Text(
                            'Prize · ${catalog.contests.first.prize}',
                            style: const TextStyle(
                              color: goldLight,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                        const SizedBox(height: 12),
                        const Row(
                          children: [
                            Text(
                              'ENTER NOW',
                              style: TextStyle(
                                color: goldLight,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1,
                              ),
                            ),
                            SizedBox(width: 6),
                            Icon(
                              Icons.arrow_outward,
                              size: 15,
                              color: goldLight,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
                const SectionTitle('STAY CONNECTED'),
                ClubCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          IconButton(
                            onPressed: () => openExternal(
                              'https://www.facebook.com/share/1Bxhkk4L97/?mibextid=wwXIfr',
                            ),
                            icon: const FaIcon(
                              FontAwesomeIcons.facebookF,
                              size: 20,
                            ),
                            color: const Color(0xFF1877F2),
                          ),
                          IconButton(
                            onPressed: () => openExternal(
                              'https://www.instagram.com/unitedtigers.ae',
                            ),
                            icon: const FaIcon(
                              FontAwesomeIcons.instagram,
                              size: 22,
                            ),
                            color: pink,
                          ),
                        ],
                      ),
                      const GoldText(
                        '#LetsGoHunt',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text('Once a Tiger always a Tiger'),
                    ],
                  ),
                ),
                if (catalog.sponsors.isNotEmpty) ...[
                  SectionTitle(
                    'OUR PARTNERS',
                    action: 'View all',
                    onAction: () => openClubPath(context, '/partners'),
                  ),
                  SizedBox(
                    height: 96 * scale,
                    child: OverflowBox(
                      minWidth: MediaQuery.sizeOf(context).width,
                      maxWidth: MediaQuery.sizeOf(context).width,
                      child: _PartnerMarquee(sponsors: catalog.sponsors),
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Center(
                    child: Text(
                      'CRICKET UNITES PEOPLE',
                      style: TextStyle(
                        color: goldLight,
                        fontStyle: FontStyle.italic,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.6,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
                const HomeFranchises(),
              ],
            ),
          ),
        );
      },
    );
  }
}

class HomeHero extends StatelessWidget {
  const HomeHero({super.key, required this.banner});
  final HomeBanner banner;

  static const _cast = [
    '/images/hero-cast/01-neon-champion.webp',
    '/images/hero-cast/02-cricketer.webp',
    '/images/hero-cast/03-neon-portrait.webp',
    '/images/hero-cast/04-cricket-star.webp',
    '/images/hero-cast/05-confident.webp',
  ];

  static double heroHeight(BuildContext context) =>
      460 * clubScale(context) + MediaQuery.paddingOf(context).top;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final art = banner.isImage
        ? api.media(banner.image)
        : api.media('/images/hero-art.webp');
    final title = displayStyle(42, height: 0.9);
    const tagline = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w700,
      letterSpacing: 1.6,
    );
    final inset = MediaQuery.paddingOf(context).top;
    final scale = clubScale(context);
    double u(double value) => value * scale;
    return GestureDetector(
      onTap: () => openClubPath(context, banner.ctaHref),
      child: SizedBox(
        height: heroHeight(context),
        width: double.infinity,
        child: Stack(
          clipBehavior: Clip.hardEdge,
          fit: StackFit.expand,
          children: [
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: u(543),
              child: Image.network(
                art,
                height: u(543),
                cacheWidth:
                    (MediaQuery.sizeOf(context).width *
                            MediaQuery.devicePixelRatioOf(context))
                        .round(),
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
                errorBuilder: (_, _, _) => const ColoredBox(color: page),
              ),
            ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.transparent,
                    Color(0xCC120318),
                  ],
                  stops: [0, 0.55, 1],
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(16, 16 + inset, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const GoldText(
                    'ABU DHABI T10',
                    outlined: true,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.4,
                    ),
                  ),
                  const SizedBox(height: 8),
                  GoldText(banner.title, style: title, outlined: true),
                  GoldText(banner.accent, style: title, outlined: true),
                  const SizedBox(height: 8),
                  OutlinedGlow(
                    text: banner.tagline,
                    style: tagline,
                    child: Text(
                      banner.tagline,
                      style: tagline.copyWith(color: Colors.white),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const GoldText(
                    'United',
                    outlined: true,
                    style: TextStyle(
                      fontSize: 28,
                      fontStyle: FontStyle.italic,
                      fontWeight: FontWeight.w800,
                      height: 0.95,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(left: 28),
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Positioned(
                          left: -12,
                          right: -8,
                          bottom: 2,
                          height: 7,
                          child: Transform(
                            transform: Matrix4.skewX(-0.38),
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(3),
                                gradient: const LinearGradient(
                                  colors: [
                                    Color(0x00FB3BA6),
                                    Color(0xFFFB3BA6),
                                    pink,
                                  ],
                                  stops: [0, 0.22, 1],
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFFFB3BA6)
                                        .withValues(alpha: 0.6),
                                    blurRadius: 8,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 4),
                          child: GoldText(
                            'AS ONE',
                            outlined: true,
                            style: TextStyle(
                              fontSize: 15,
                              fontStyle: FontStyle.italic,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              top: u(124) + inset,
              right: 10,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  for (final word in banner.roar.split(RegExp(r'\s+')))
                    if (word.isNotEmpty)
                      GoldText(
                        word,
                        outlined: true,
                        style: const TextStyle(
                          fontSize: 22,
                          fontStyle: FontStyle.italic,
                          fontWeight: FontWeight.w800,
                          height: 0.9,
                        ),
                      ),
                ],
              ),
            ),
            Positioned(
              left: 12,
              right: 12,
              bottom: banner.showPlayers ? u(132) : u(96),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    'assets/brand/tiger-gold.png',
                    width: u(42),
                    height: u(36),
                  ),
                  const SizedBox(width: 8),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GoldText(
                        'UNITED TIGERS',
                        style: TextStyle(
                          fontFamily: display,
                          fontSize: 26,
                          height: 1,
                        ),
                      ),
                      GoldText(
                        'ABU DHABI',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2.4,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (banner.showPlayers)
              Positioned(
                left: 0,
                right: 0,
                bottom: u(8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    for (var index = 0; index < _cast.length; index++)
                      Padding(
                        padding: EdgeInsets.only(left: index == 0 ? 0 : 6),
                        child: _Arch(
                          url: api.media(_cast[index]),
                          width: u(const [46.0, 56.0, 68.0, 56.0, 46.0][index]),
                          height: u(
                            const [74.0, 92.0, 112.0, 92.0, 74.0][index],
                          ),
                          order: const [0, 1, 2, 1, 0][index],
                          lead: index == 2,
                        ),
                      ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Pill-topped player portrait with a metallic gold rim, matching the website's banner cast.
class _Arch extends StatelessWidget {
  const _Arch({
    required this.url,
    required this.width,
    required this.height,
    required this.order,
    this.lead = false,
  });
  final String url;
  final double width;
  final double height;
  final int order;
  final bool lead;

  @override
  Widget build(BuildContext context) {
    final outer = BorderRadius.vertical(
      top: Radius.circular(width / 2),
      bottom: const Radius.circular(10),
    );
    final inner = BorderRadius.vertical(
      top: Radius.circular(width / 2 - 2),
      bottom: const Radius.circular(8),
    );
    return Reveal(
      delay: Duration(milliseconds: 350 + order * 120),
      offset: 18,
      scale: 0.6,
      child: Floating(
        distance: lead ? 5 : 3.5,
        phase: (order * 0.27) % 1,
        period: Duration(milliseconds: 2400 + order * 260),
        child: Container(
          width: width,
          height: height,
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            borderRadius: outer,
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFFFFF3C9),
                Color(0xFFEEC873),
                Color(0xFFA8873A),
                Color(0xFFF6E7AE),
                Color(0xFFAC884A),
              ],
              stops: [0, 0.3, 0.58, 0.8, 1],
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFFB3BA6)
                    .withValues(alpha: lead ? 0.7 : 0.5),
                blurRadius: lead ? 22 : 14,
              ),
              BoxShadow(
                color: const Color(0xFF0F021B).withValues(alpha: 0.6),
                blurRadius: 14,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: inner,
            child: Stack(
              fit: StackFit.expand,
              children: [
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Color(0xFFFF7DBE),
                        Color(0xFFC9177E),
                        Color(0xFF6E2660),
                      ],
                      stops: [0, 0.55, 1],
                    ),
                  ),
                ),
                Image.network(
                  url,
                  fit: BoxFit.cover,
                  cacheWidth: 360,
                  alignment: const Alignment(0, -0.64),
                  errorBuilder: (_, _, _) => const SizedBox.shrink(),
                ),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Color(0x47FF7DBE),
                        Color(0x00000000),
                        Color(0x80C9177E),
                        Color(0xD1961E64),
                      ],
                      stops: [0, 0.34, 0.78, 1],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Square-portrait player card for the home carousel; [glowing] cards get the animated neon rim.
class _TigerCard extends StatelessWidget {
  const _TigerCard({
    required this.player,
    required this.order,
    required this.glowing,
  });
  final Player player;
  final int order;
  final bool glowing;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final name = _splitName(player.fullName);
    final body = DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF3A0A66), Color(0xFF260644)],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: RadialGradient(
                      center: Alignment(0, -0.2),
                      radius: 0.9,
                      colors: [Color(0xFFC9177E), Color(0xFF460B7D)],
                    ),
                  ),
                ),
                RemoteImage(
                  api.media(player.profileImage),
                  height: double.infinity,
                  radius: 0,
                  alignment: Alignment.topCenter,
                ),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Color(0x00260644),
                        Color(0x00260644),
                        Color(0xE6260644),
                      ],
                      stops: [0, 0.6, 1],
                    ),
                  ),
                ),
                Positioned(
                  left: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      color: const Color(0xCC1C0432),
                      border: Border.all(
                        color: goldLight.withValues(alpha: 0.6),
                      ),
                    ),
                    child: GoldText(
                      '${player.jerseyNumber ?? 'UT'}',
                      style: displayStyle(17, height: 1),
                    ),
                  ),
                ),
                if (player.role != null)
                  Positioned(
                    left: 10,
                    right: 10,
                    bottom: 6,
                    child: Text(
                      player.role!.replaceAll('_', ' ').toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: goldLight,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 7, 10, 9),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name.$1.isEmpty ? ' ' : name.$1,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Colors.white70,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  name.$2.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: displayStyle(19, color: Colors.white, height: 1),
                ),
              ],
            ),
          ),
        ],
      ),
    );
    return Reveal(
      delay: Duration(milliseconds: 120 + order * 110),
      child: Pressable(
        onTap: () => openPlayer(context, player),
        child: glowing
            ? GlowFrame(
                radius: 18,
                width: 2,
                offset: order * 0.25,
                colors: order.isEven ? neonGold : neonPink,
                child: body,
              )
            : DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      goldLight.withValues(alpha: 0.75),
                      gold.withValues(alpha: 0.25),
                      goldLight.withValues(alpha: 0.55),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF12021F).withValues(alpha: 0.45),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.all(1.2),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16.8),
                    child: body,
                  ),
                ),
              ),
      ),
    );
  }
}

void openClubPath(BuildContext context, String href) {
  final path = href.trim();
  if (path.startsWith('http')) {
    openExternal(path);
    return;
  }
  final Widget page;
  if (path.startsWith('/shop')) {
    page = const ShopPage();
  } else if (path.startsWith('/fixtures') || path.startsWith('/matches')) {
    page = const FixturesPage();
  } else if (path.startsWith('/vote') ||
      path.startsWith('/polls') ||
      path.startsWith('/contests')) {
    page = const VotePage();
  } else if (path.startsWith('/fan')) {
    page = const FanZonePage();
  } else if (path.startsWith('/stats') || path.startsWith('/records')) {
    page = const StatsPage();
  } else if (path.startsWith('/news')) {
    page = const NewsPage();
  } else if (path.startsWith('/gallery')) {
    page = const GalleryPage();
  } else if (path.startsWith('/partners')) {
    page = const PartnersPage();
  } else {
    page = const TeamPage();
  }
  Navigator.push(context, MaterialPageRoute(builder: (_) => page));
}

class _Stat extends StatelessWidget {
  const _Stat(this.icon, this.value, this.label);
  final FaIconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: pink.withValues(alpha: 0.18),
              border: Border.all(color: gold.withValues(alpha: 0.45)),
            ),
            child: FaIcon(icon, color: goldLight, size: 15),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CountUp(
                  value,
                  builder: (text) => GoldText(text, style: displayStyle(26)),
                ),
                Text(label, style: const TextStyle(fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

(String, String) _splitName(String fullName) {
  final parts = fullName.trim().split(RegExp(r'\s+'));
  if (parts.length < 2) return ('', parts.firstOrNull ?? fullName);
  return (parts.sublist(0, parts.length - 1).join(' '), parts.last);
}

Player? _faceFor(String label, List<Player> players) {
  final needle = label.trim().toLowerCase();
  for (final player in players) {
    final name = player.fullName.toLowerCase();
    if (name == needle || needle.contains(name) || name.contains(needle)) {
      return player;
    }
  }
  return null;
}

/// Team badge for the next-match card: our gold tiger on a purple disc, rivals' crests on white, as on the website.
class _Crest extends StatelessWidget {
  const _Crest({
    required this.name,
    required this.place,
    this.logo,
    this.short,
    this.ours = false,
    this.phase = 0,
  });
  final String name;
  final String place;
  final String? logo;
  final String? short;
  final bool ours;
  final double phase;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Expanded(
      child: Column(
        children: [
          Floating(
            phase: phase,
            distance: 3,
            period: const Duration(milliseconds: 3200),
            child: TeamCrest(
              ours: ours,
              logo: logo == null ? null : api.media(logo),
              label: _mark(short ?? name),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            name,
            maxLines: 2,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w800,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            place,
            style: const TextStyle(color: Color(0x9EFFFFFF), fontSize: 13),
          ),
        ],
      ),
    );
  }
}

String _mark(String name) {
  final compact = name.replaceAll(RegExp(r'[^A-Za-z]'), '');
  if (compact.isEmpty) return 'UT';
  return compact
      .substring(0, compact.length < 3 ? compact.length : 3)
      .toUpperCase();
}

class _NextMatch extends StatefulWidget {
  const _NextMatch({required this.match});
  final ClubMatch match;

  @override
  State<_NextMatch> createState() => _NextMatchState();
}

class _NextMatchState extends State<_NextMatch> {
  Timer? _tick;

  @override
  void initState() {
    super.initState();
    _tick = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tick?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final match = widget.match;
    final date = match.date;
    final left = date?.difference(DateTime.now());
    final counting = left != null && !left.isNegative && !match.isLive;
    if (!counting) _tick?.cancel();
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Stack(
        children: [
          Positioned.fill(
            child: RepaintBoundary(
              child: CustomPaint(
                painter: _MatchNightPainter(GlowClock.of(context)),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: Column(
              children: [
                Row(
                  children: [
                    if (match.isLive) ...[
                      const Pulse(child: SizedBox.square(dimension: 8)),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      match.isLive ? 'LIVE NOW' : 'NEXT MATCH',
                      style: displayStyle(18, color: goldLight),
                    ),
                    const Spacer(),
                    SizedBox(
                      width: 96 * clubScale(context),
                      height: 26 * clubScale(context),
                      child: Image.asset(
                        'assets/brand/abu-dhabi-t10-landscape-white.png',
                        fit: BoxFit.contain,
                        alignment: Alignment.centerRight,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Stack(
                  alignment: Alignment.center,
                  children: [
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: RadialGradient(
                            radius: 0.75,
                            colors: [
                              pink.withValues(alpha: 0.28),
                              Colors.transparent,
                            ],
                          ),
                        ),
                      ),
                    ),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _Crest(
                          name: 'United Tigers',
                          place: 'Abu Dhabi',
                          ours: true,
                        ),
                        Padding(
                          padding: const EdgeInsets.only(top: 32),
                          child: Pulse(
                            speed: 8,
                            child: Text(
                              'VS',
                              style: displayStyle(
                                18,
                                color: pink,
                              ).copyWith(fontWeight: FontWeight.w800),
                            ),
                          ),
                        ),
                        _Crest(
                          name: match.opponent,
                          place: 'Abu Dhabi',
                          logo: match.opponentLogoUrl,
                          short: match.opponentShort,
                          phase: 0.5,
                        ),
                      ],
                    ),
                  ],
                ),
                if (counting) ...[const SizedBox(height: 16), _Countdown(left)],
                const SizedBox(height: 14),
                MatchMeta(date: date),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Countdown extends StatelessWidget {
  const _Countdown(this.left);
  final Duration left;

  @override
  Widget build(BuildContext context) {
    final parts = [
      (left.inDays, 'DAYS'),
      (left.inHours % 24, 'HRS'),
      (left.inMinutes % 60, 'MIN'),
      (left.inSeconds % 60, 'SEC'),
    ];
    return Row(
      children: [
        for (final (index, part) in parts.indexed) ...[
          if (index > 0) const SizedBox(width: 8),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0x66160326),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: gold.withValues(alpha: 0.35)),
              ),
              child: Column(
                children: [
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 280),
                    transitionBuilder: (child, animation) => FadeTransition(
                      opacity: animation,
                      child: SlideTransition(
                        position: Tween(
                          begin: const Offset(0, -0.35),
                          end: Offset.zero,
                        ).animate(animation),
                        child: child,
                      ),
                    ),
                    child: GoldText(
                      part.$1.toString().padLeft(2, '0'),
                      key: ValueKey(part.$1),
                      style: displayStyle(24, height: 1),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    part.$2,
                    style: const TextStyle(
                      color: Color(0xFFBDAED0),
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

/// Match-night backdrop: gold and magenta floodlights drift across the card while a light beam sweeps through.
class _MatchNightPainter extends CustomPainter {
  _MatchNightPainter(this.clock) : super(repaint: clock);
  final Animation<double> clock;

  @override
  void paint(Canvas canvas, Size size) {
    final a = clock.value * 2 * math.pi;
    final w = size.width;
    final h = size.height;
    void glow(Offset centre, double radius, Color colour) {
      canvas.drawCircle(
        centre,
        radius,
        Paint()
          ..shader = RadialGradient(
            colors: [colour, colour.withValues(alpha: 0)],
          ).createShader(Rect.fromCircle(center: centre, radius: radius)),
      );
    }

    glow(
      Offset(
        w * (0.5 + 0.38 * math.sin(a * 2)),
        h * (0.02 + 0.06 * math.cos(a * 3)),
      ),
      w * 0.62,
      const Color(0x40F4C35A),
    );
    glow(
      Offset(
        w * (0.5 - 0.42 * math.sin(a * 3 + 1)),
        h * (0.98 - 0.05 * math.sin(a * 2)),
      ),
      w * 0.66,
      const Color(0x45FF7A2E),
    );
    glow(
      Offset(w * (0.5 + 0.3 * math.cos(a * 4)), h * 0.42),
      w * 0.42,
      pink.withValues(alpha: 0.16 + 0.08 * math.sin(a * 6)),
    );

    final sweep = (clock.value * 4) % 1;
    if (sweep < 0.45) {
      final x = -w * 0.4 + (w * 1.8) * (sweep / 0.45);
      final beam = Path()
        ..moveTo(x, 0)
        ..lineTo(x + w * 0.16, 0)
        ..lineTo(x - w * 0.14, h)
        ..lineTo(x - w * 0.3, h)
        ..close();
      canvas.drawPath(
        beam,
        Paint()
          ..shader = LinearGradient(
            colors: [
              Colors.white.withValues(alpha: 0),
              Colors.white.withValues(alpha: 0.07),
              Colors.white.withValues(alpha: 0),
            ],
          ).createShader(Rect.fromLTWH(x - w * 0.3, 0, w * 0.46, h)),
      );
    }

    final stars = Paint()..color = goldLight;
    for (var i = 0; i < 14; i++) {
      final seed = i * 37.0;
      final twinkle = (math.sin(a * (3 + i % 4) + seed) + 1) / 2;
      stars.color = goldLight.withValues(alpha: 0.12 + 0.45 * twinkle);
      canvas.drawCircle(
        Offset((seed * 13.7) % w, (seed * 7.3 + h * 0.1) % h),
        0.8 + twinkle,
        stars,
      );
    }
  }

  @override
  bool shouldRepaint(_MatchNightPainter oldDelegate) =>
      oldDelegate.clock != clock;
}

/// Website-style partner rail: an endless, auto-scrolling strip of sponsor logos that the fan can also swipe.
class _PartnerMarquee extends StatefulWidget {
  const _PartnerMarquee({required this.sponsors});
  final List<Sponsor> sponsors;

  @override
  State<_PartnerMarquee> createState() => _PartnerMarqueeState();
}

class _PartnerMarqueeState extends State<_PartnerMarquee>
    with SingleTickerProviderStateMixin {
  static const _speed = 34.0;
  final _scroll = ScrollController();
  late final Ticker _ticker = createTicker(_advance);
  Duration _last = Duration.zero;
  bool _held = false;
  Timer? _resume;

  @override
  void initState() {
    super.initState();
    _ticker.start();
  }

  void _advance(Duration elapsed) {
    final step = (elapsed - _last).inMicroseconds / 1e6;
    _last = elapsed;
    if (_held || !_scroll.hasClients) return;
    _scroll.jumpTo(_scroll.offset + _speed * step);
  }

  bool _onScroll(ScrollNotification note) {
    if (note is ScrollStartNotification && note.dragDetails != null) {
      _resume?.cancel();
      _held = true;
    } else if (note is ScrollEndNotification && _held) {
      _resume?.cancel();
      _resume = Timer(const Duration(seconds: 2), () => _held = false);
    }
    return false;
  }

  @override
  void dispose() {
    _resume?.cancel();
    _ticker.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final sponsors = widget.sponsors;
    final scale = clubScale(context);
    return SizedBox(
      height: 96 * scale,
      child: ShaderMask(
        blendMode: BlendMode.dstIn,
        shaderCallback: (rect) => const LinearGradient(
          colors: [
            Colors.transparent,
            Colors.black,
            Colors.black,
            Colors.transparent,
          ],
          stops: [0, 0.08, 0.92, 1],
        ).createShader(rect),
        child: NotificationListener<ScrollNotification>(
          onNotification: _onScroll,
          child: ListView.builder(
            scrollCacheExtent: pageCacheExtent,
            controller: _scroll,
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemBuilder: (context, index) {
              final sponsor = sponsors[index % sponsors.length];
              final logo = sponsor.logoUrl;
              final fallback = Center(
                child: Text(
                  sponsor.name,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  style: displayStyle(14, color: goldLight),
                ),
              );
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Pressable(
                  onTap: sponsor.website == null
                      ? () => openClubPath(context, '/partners')
                      : () => openExternal(sponsor.website!),
                  child: SizedBox(
                    width: 132 * scale,
                    child: Column(
                      children: [
                        Expanded(
                          child: SizedBox(
                            width: 132 * scale,
                            child: logo == null
                                ? fallback
                                : Center(
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(6),
                                      child: Image.network(
                                        api.media(logo),
                                        fit: BoxFit.contain,
                                        errorBuilder: (_, _, _) => fallback,
                                      ),
                                    ),
                                  ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          sponsor.name.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: goldLight,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _FixtureRow extends StatelessWidget {
  const _FixtureRow({required this.match});
  final ClubMatch match;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        StatusChip(match.statusLabel),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'vs ${match.opponent}',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              Text(when(match.date), style: const TextStyle(fontSize: 12)),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            match.scoreLine,
            textAlign: TextAlign.right,
            style: const TextStyle(fontSize: 12),
          ),
        ),
      ],
    );
  }
}
