import 'package:flutter/material.dart';
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
        final upcoming = catalog.matches.where((match) => match.status == 'UPCOMING' || match.isLive).firstOrNull;
        final completed = catalog.matches.where((match) => match.isCompleted).toList();
        final listed = [
          ...completed.reversed.take(2).toList().reversed,
          ...catalog.matches.where((match) => match.status == 'UPCOMING' || match.isLive).take(1),
        ];
        final poll = api.featuredPoll;
        final featuredKit = catalog.products.where((product) => product.isFeatured).toList();
        final kit = (featuredKit.isEmpty ? catalog.products : featuredKit).take(4);
        const tigerOrder = ['fakhar-zaman', 'faheem-ashraf', 'azmatullah-omarzai', 'nurul-hasan'];
        final squad = [
          for (final slug in tigerOrder) ...catalog.players.where((player) => player.slug == slug),
        ];
        final roster = squad.isEmpty ? catalog.players.take(4).toList() : squad;
        final pastMatches = catalog.gallery.where((item) => (item.category ?? '').toLowerCase().contains('past match')).toList();
        final pastPhotos = pastMatches.where((item) => !item.isVideo).toList();
        final clips = [...pastMatches.where((item) => item.isVideo), ...pastPhotos].take(3).toList();
        final shown = clips.map((item) => item.mediaUrl).toSet();
        final moments = pastPhotos.where((item) => !shown.contains(item.mediaUrl)).take(4).toList();

        return Scaffold(
          body: RefreshIndicator(
            onRefresh: api.refresh,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              children: [
                SizedBox(
                  height: HomeHero.heroHeight(context),
                  child: OverflowBox(
                    minWidth: MediaQuery.sizeOf(context).width,
                    maxWidth: MediaQuery.sizeOf(context).width,
                    child: HomeHero(banner: api.banner),
                  ),
                ),
                const SectionTitle('NEXT MATCH'),
                if (upcoming == null)
                  const ClubCard(child: Text('The next fixture will appear here as soon as it is confirmed.'))
                else
                  Reveal(child: ClubCard(highlight: true, onTap: () => openMatch(context, upcoming), child: _NextMatch(match: upcoming))),
                SectionTitle('MEET OUR TIGERS', action: 'View all', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TeamPage()))),
                SizedBox(
                  height: 214,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    clipBehavior: Clip.none,
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    itemCount: roster.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 12),
                    itemBuilder: (context, index) => SizedBox(
                      width: 146,
                      child: _TigerCard(player: roster[index], order: index, glowing: index.isEven),
                    ),
                  ),
                ),
                SectionTitle('THE VOTE', action: 'All polls', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const VotePage()))),
                ClubCard(
                  highlight: true,
                  onTap: poll == null ? null : () => openPoll(context, poll),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GoldText('VOTE FOR\nPLAYER OF THE MATCH', style: displayStyle(30)),
                      const SizedBox(height: 8),
                      Text(poll?.question ?? 'Who lit up the game?'),
                      const SizedBox(height: 12),
                      if (poll != null)
                        SizedBox(
                          height: 54,
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            children: poll.options.take(5).map((option) {
                              final face = _faceFor(option.label, catalog.players);
                              return Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: CircleAvatar(
                                  radius: 26,
                                  backgroundColor: glow,
                                  backgroundImage: face?.profileImage == null ? null : NetworkImage(api.media(face!.profileImage)),
                                  child: face?.profileImage == null ? Text(option.label.isEmpty ? '?' : option.label[0]) : null,
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      const SizedBox(height: 12),
                      FilledButton(style: goldButtonStyle(), onPressed: poll == null ? null : () => openPoll(context, poll), child: const Text('CAST YOUR VOTE')),
                    ],
                  ),
                ),
                const SectionTitle('TIGERS NATION'),
                const ClubCard(
                  child: Column(
                    children: [
                      Row(children: [Expanded(child: _Stat(FontAwesomeIcons.users, '1M+', 'Fans worldwide')), Expanded(child: _Stat(FontAwesomeIcons.shieldHalved, '7', 'Franchise teams'))]),
                      Row(children: [Expanded(child: _Stat(FontAwesomeIcons.earthAsia, '150+', 'International players')), Expanded(child: _Stat(FontAwesomeIcons.trophy, '2', 'Championships'))]),
                    ],
                  ),
                ),
                if (clips.isNotEmpty) ...[
                  SectionTitle('PAST MATCHES', action: 'View all', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GalleryPage()))),
                  SizedBox(
                    height: 168,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: clips.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 10),
                      itemBuilder: (context, index) {
                        final item = clips[index];
                        return SizedBox(
                          width: index == 0 ? 260 : 150,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Builder(builder: (context) {
                                  final tile = Stack(
                                    fit: StackFit.expand,
                                    children: [
                                      RemoteImage(api.media(item.isVideo ? null : item.mediaUrl), height: 140, radius: 0),
                                      if (item.isVideo) const Center(child: Floating(distance: 3, child: FaIcon(FontAwesomeIcons.circlePlay, color: goldLight, size: 38))),
                                      Positioned(left: 8, bottom: 8, child: MediaBadge(label: item.isVideo ? 'VIDEO' : 'PHOTO')),
                                    ],
                                  );
                                  return index == 0
                                      ? GlowFrame(radius: 14, colors: neonPink, offset: 0.4, child: tile)
                                      : ClipRRect(borderRadius: BorderRadius.circular(12), child: tile);
                                }),
                              ),
                              const SizedBox(height: 6),
                              Text(item.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
                SectionTitle('FIXTURES & RESULTS', action: 'View all', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FixturesPage()))),
                ...listed.map(
                  (match) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: ClubCard(onTap: () => openMatch(context, match), child: _FixtureRow(match: match)),
                  ),
                ),
                const HomePartnerCta(),
                if (moments.isNotEmpty)
                  SectionTitle('FEATURED MOMENTS', action: 'Gallery', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GalleryPage()))),
                if (moments.isNotEmpty)
                  SizedBox(
                    height: 120,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: moments.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 8),
                      itemBuilder: (context, index) => SizedBox(
                        width: 160,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            RemoteImage(api.media(moments[index].mediaUrl), height: 120),
                            Positioned(left: 8, bottom: 8, child: MediaBadge(label: moments[index].isVideo ? 'VIDEO' : 'PHOTO')),
                          ],
                        ),
                      ),
                    ),
                  ),
                SectionTitle('OFFICIAL KIT', action: 'Shop all', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ShopPage()))),
                ...kit.map(
                  (product) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: ClubCard(
                      onTap: () => openProduct(context, product),
                      child: Row(
                        children: [
                          SizedBox(width: 84, child: RemoteImage(api.media(product.image), height: 84, radius: 12)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(product.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                                Text(money(product.price), style: const TextStyle(color: orange)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (catalog.updates.isNotEmpty) ...[
                  SectionTitle('TIGERS DAILY', action: 'View all', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const UpdatesPage()))),
                  ...catalog.updates.take(2).map(
                    (update) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: ClubCard(
                        onTap: () => openUpdate(context, update),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(update.category?.replaceAll('_', ' ') ?? 'UPDATE', style: const TextStyle(color: gold, fontSize: 11, fontWeight: FontWeight.w800)),
                            Text(update.title, style: const TextStyle(fontWeight: FontWeight.w800)),
                            Text(update.description, maxLines: 2, overflow: TextOverflow.ellipsis),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
                if (catalog.contests.isNotEmpty) ...[
                  SectionTitle('FAN CONTEST', action: 'All contests', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const VotePage()))),
                  ClubCard(
                    onTap: () => openContest(context, catalog.contests.first),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(catalog.contests.first.title.toUpperCase(), style: displayStyle(24, color: Colors.white)),
                        if (catalog.contests.first.prize != null) ...[const SizedBox(height: 6), Text('Prize · ${catalog.contests.first.prize}', style: const TextStyle(color: goldLight, fontWeight: FontWeight.w700))],
                        const SizedBox(height: 12),
                        const Row(children: [Text('ENTER NOW', style: TextStyle(color: goldLight, fontWeight: FontWeight.w900, letterSpacing: 1)), SizedBox(width: 6), Icon(Icons.arrow_outward, size: 15, color: goldLight)]),
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
                          IconButton(onPressed: () => openExternal('https://www.facebook.com/share/1Bxhkk4L97/?mibextid=wwXIfr'), icon: const FaIcon(FontAwesomeIcons.facebookF, size: 20), color: const Color(0xFF1877F2)),
                          IconButton(onPressed: () => openExternal('https://www.instagram.com/unitedtigers.ae'), icon: const FaIcon(FontAwesomeIcons.instagram, size: 22), color: pink),
                        ],
                      ),
                      const GoldText('#LetsGoHunt', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 1)),
                      const SizedBox(height: 4),
                      const Text('Once a Tiger always a Tiger'),
                    ],
                  ),
                ),
                const SectionTitle('OUR PARTNERS'),
                ClubCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(spacing: 8, runSpacing: 8, children: catalog.sponsors.map((sponsor) => Chip(label: Text(sponsor.name))).toList()),
                      const SizedBox(height: 8),
                      const Text('CRICKET UNITES PEOPLE', style: TextStyle(color: gold, fontWeight: FontWeight.w800, letterSpacing: 1)),
                    ],
                  ),
                ),
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

  static double heroHeight(BuildContext context) => 460 + MediaQuery.paddingOf(context).top;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final art = banner.isImage ? api.media(banner.image) : api.media('/images/hero-art.webp');
    final title = displayStyle(42, height: 0.9);
    final inset = MediaQuery.paddingOf(context).top;
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
              height: 543,
              child: Image.network(
                art,
                height: 543,
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
                  colors: [Colors.transparent, Colors.transparent, Color(0xCC120318)],
                  stops: [0, 0.55, 1],
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(16, 16 + inset, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const GoldText('ABU DHABI T10', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 1.4)),
                  const SizedBox(height: 8),
                  GoldText(banner.title, style: title),
                  GoldText(banner.accent, style: title),
                  const SizedBox(height: 8),
                  Text(banner.tagline, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.6)),
                  const SizedBox(height: 10),
                  const GoldText('United', style: TextStyle(fontSize: 28, fontStyle: FontStyle.italic, fontWeight: FontWeight.w800, height: 0.95)),
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
                                gradient: const LinearGradient(colors: [Color(0x00FB3BA6), Color(0xFFFB3BA6), pink], stops: [0, 0.22, 1]),
                                boxShadow: [BoxShadow(color: const Color(0xFFFB3BA6).withValues(alpha: 0.6), blurRadius: 8)],
                              ),
                            ),
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 4),
                          child: GoldText('AS ONE', style: TextStyle(fontSize: 15, fontStyle: FontStyle.italic, fontWeight: FontWeight.w800)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              top: 124 + inset,
              right: 10,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  for (final word in banner.roar.split(RegExp(r'\s+')))
                    if (word.isNotEmpty) GoldText(word, style: const TextStyle(fontSize: 22, fontStyle: FontStyle.italic, fontWeight: FontWeight.w800, height: 0.9)),
                ],
              ),
            ),
            Positioned(
              left: 12,
              right: 12,
              bottom: banner.showPlayers ? 132 : 96,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset('assets/brand/tiger-gold.png', width: 42, height: 36),
                  const SizedBox(width: 8),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GoldText('UNITED TIGERS', style: TextStyle(fontFamily: display, fontSize: 26, height: 1)),
                      GoldText('ABU DHABI', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 2.4)),
                    ],
                  ),
                ],
              ),
            ),
            if (banner.showPlayers)
              Positioned(
                left: 0,
                right: 0,
                bottom: 8,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    for (var index = 0; index < _cast.length; index++)
                      Padding(
                        padding: EdgeInsets.only(left: index == 0 ? 0 : 6),
                        child: _Arch(
                          url: api.media(_cast[index]),
                          width: const [46.0, 56.0, 68.0, 56.0, 46.0][index],
                          height: const [74.0, 92.0, 112.0, 92.0, 74.0][index],
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
  const _Arch({required this.url, required this.width, required this.height, required this.order, this.lead = false});
  final String url;
  final double width;
  final double height;
  final int order;
  final bool lead;

  @override
  Widget build(BuildContext context) {
    final outer = BorderRadius.vertical(top: Radius.circular(width / 2), bottom: const Radius.circular(10));
    final inner = BorderRadius.vertical(top: Radius.circular(width / 2 - 2), bottom: const Radius.circular(8));
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
              colors: [Color(0xFFFFF3C9), Color(0xFFEEC873), Color(0xFFA8873A), Color(0xFFF6E7AE), Color(0xFFAC884A)],
              stops: [0, 0.3, 0.58, 0.8, 1],
            ),
            boxShadow: [
              BoxShadow(color: const Color(0xFFFB3BA6).withValues(alpha: lead ? 0.7 : 0.5), blurRadius: lead ? 22 : 14),
              BoxShadow(color: const Color(0xFF0F021B).withValues(alpha: 0.6), blurRadius: 14, offset: const Offset(0, 8)),
            ],
          ),
          child: ClipRRect(
            borderRadius: inner,
            child: Stack(
              fit: StackFit.expand,
              children: [
                const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFFFF7DBE), Color(0xFFC9177E), Color(0xFF6E2660)], stops: [0, 0.55, 1]))),
                Image.network(url, fit: BoxFit.cover, alignment: const Alignment(0, -0.64), errorBuilder: (_, _, _) => const SizedBox.shrink()),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Color(0x47FF7DBE), Color(0x00000000), Color(0x80C9177E), Color(0xD1961E64)],
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
  const _TigerCard({required this.player, required this.order, required this.glowing});
  final Player player;
  final int order;
  final bool glowing;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final name = _splitName(player.fullName);
    final body = DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFF3A0A66), Color(0xFF260644)]),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: Stack(
              fit: StackFit.expand,
              children: [
                const DecoratedBox(decoration: BoxDecoration(gradient: RadialGradient(center: Alignment(0, -0.2), radius: 0.9, colors: [Color(0xFFC9177E), Color(0xFF460B7D)]))),
                RemoteImage(api.media(player.profileImage), height: double.infinity, radius: 0, alignment: Alignment.topCenter),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0x00260644), Color(0x00260644), Color(0xE6260644)], stops: [0, 0.6, 1]),
                  ),
                ),
                Positioned(
                  left: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      color: const Color(0xCC1C0432),
                      border: Border.all(color: goldLight.withValues(alpha: 0.6)),
                    ),
                    child: GoldText('${player.jerseyNumber ?? 'UT'}', style: displayStyle(17, height: 1)),
                  ),
                ),
                if (player.role != null)
                  Positioned(
                    left: 10,
                    right: 10,
                    bottom: 6,
                    child: Text(player.role!.replaceAll('_', ' ').toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: goldLight, fontSize: 9.5, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 7, 10, 9),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name.$1.isEmpty ? ' ' : name.$1, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: Colors.white70, height: 1.1)),
                const SizedBox(height: 2),
                Text(name.$2.toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, style: displayStyle(19, color: Colors.white, height: 1)),
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
            ? GlowFrame(radius: 18, width: 2, offset: order * 0.25, colors: order.isEven ? neonGold : neonPink, child: body)
            : DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [goldLight.withValues(alpha: 0.75), gold.withValues(alpha: 0.25), goldLight.withValues(alpha: 0.55)]),
                  boxShadow: [BoxShadow(color: const Color(0xFF12021F).withValues(alpha: 0.45), blurRadius: 16, offset: const Offset(0, 8))],
                ),
                child: Padding(padding: const EdgeInsets.all(1.2), child: ClipRRect(borderRadius: BorderRadius.circular(16.8), child: body)),
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
  } else if (path.startsWith('/vote') || path.startsWith('/polls') || path.startsWith('/contests')) {
    page = const VotePage();
  } else if (path.startsWith('/fan')) {
    page = const FanZonePage();
  } else if (path.startsWith('/stats') || path.startsWith('/records')) {
    page = const StatsPage();
  } else if (path.startsWith('/news')) {
    page = const NewsPage();
  } else if (path.startsWith('/gallery')) {
    page = const GalleryPage();
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
            decoration: BoxDecoration(shape: BoxShape.circle, color: pink.withValues(alpha: 0.18), border: Border.all(color: gold.withValues(alpha: 0.45))),
            child: FaIcon(icon, color: goldLight, size: 15),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CountUp(value, builder: (text) => GoldText(text, style: displayStyle(26))),
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
    if (name == needle || needle.contains(name) || name.contains(needle)) return player;
  }
  return null;
}

class _Crest extends StatelessWidget {
  const _Crest(this.mark, this.name, this.place, {this.ours = false});
  final String mark;
  final String name;
  final String place;
  final bool ours;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Container(
            width: 58,
            height: 58,
            padding: EdgeInsets.all(ours ? 6 : 0),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: ours ? goldSurface : const LinearGradient(colors: [Color(0xFF6A1290), Color(0xFF2A0750)]),
              border: Border.all(color: gold.withValues(alpha: 0.5)),
              boxShadow: [BoxShadow(color: (ours ? gold : pink).withValues(alpha: 0.25), blurRadius: 14)],
            ),
            child: ours ? Image.asset('assets/brand/united-tigers.png', fit: BoxFit.contain) : Text(mark, style: displayStyle(20, color: Colors.white)),
          ),
          const SizedBox(height: 8),
          Text(name.toUpperCase(), maxLines: 2, textAlign: TextAlign.center, style: displayStyle(16, color: Colors.white, height: 1)),
          Text(place, style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 12)),
        ],
      ),
    );
  }
}

String _mark(String name) {
  final compact = name.replaceAll(RegExp(r'[^A-Za-z]'), '');
  if (compact.isEmpty) return 'UT';
  return compact.substring(0, compact.length < 2 ? 1 : 2).toUpperCase();
}

class _NextMatch extends StatelessWidget {
  const _NextMatch({required this.match});
  final ClubMatch match;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const _Crest('UT', 'United Tigers', 'Abu Dhabi', ours: true),
            Padding(padding: const EdgeInsets.symmetric(horizontal: 8), child: GoldText('VS', style: displayStyle(28))),
            _Crest(_mark(match.opponentShort ?? match.opponent), match.opponent, match.venueCity ?? 'Away'),
          ],
        ),
        const SizedBox(height: 14),
        Row(children: [const SizedBox(width: 16, child: FaIcon(FontAwesomeIcons.calendarDays, size: 13, color: goldLight)), const SizedBox(width: 6), Expanded(child: Text(when(match.date)))]),
        Row(children: [const SizedBox(width: 16, child: FaIcon(FontAwesomeIcons.locationDot, size: 13, color: goldLight)), const SizedBox(width: 6), Expanded(child: Text(match.venueName ?? 'Venue TBC'))]),
        const SizedBox(height: 12),
        const Row(children: [Text('MATCH CENTRE', style: TextStyle(color: goldLight, fontWeight: FontWeight.w900, letterSpacing: 1)), SizedBox(width: 6), Icon(Icons.arrow_outward, size: 15, color: goldLight)]),
      ],
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
              Text('vs ${match.opponent}', style: const TextStyle(fontWeight: FontWeight.w700)),
              Text(when(match.date), style: const TextStyle(fontSize: 12)),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Flexible(child: Text(match.scoreLine, textAlign: TextAlign.right, style: const TextStyle(fontSize: 12))),
      ],
    );
  }
}

