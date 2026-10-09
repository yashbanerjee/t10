import 'package:flutter/material.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';
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
                Transform.translate(
                  offset: const Offset(-16, 0),
                  child: SizedBox(width: MediaQuery.sizeOf(context).width, child: HomeHero(banner: api.banner)),
                ),
                const SectionTitle('NEXT MATCH'),
                if (upcoming == null)
                  const ClubCard(child: Text('The next fixture will appear here as soon as it is confirmed.'))
                else
                  ClubCard(onTap: () => openMatch(context, upcoming), child: _NextMatch(match: upcoming)),
                SectionTitle('MEET OUR TIGERS', action: 'View all', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TeamPage()))),
                SizedBox(
                  height: 214,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: roster.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 10),
                    itemBuilder: (context, index) {
                      final player = roster[index];
                      final name = _splitName(player.fullName);
                      return GestureDetector(
                        onTap: () => openPlayer(context, player),
                        child: SizedBox(
                          width: 124,
                          child: ClubCard(
                            padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
                            child: Column(
                              children: [
                                RemoteImage(api.media(player.profileImage), height: 88, radius: 40),
                                const SizedBox(height: 8),
                                GoldText('${player.jerseyNumber ?? 'UT'}', style: const TextStyle(fontWeight: FontWeight.w800)),
                                Text(name.$1, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: Colors.white70)),
                                Text(name.$2, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800)),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SectionTitle('VOTE FOR PLAYER OF THE MATCH'),
                ClubCard(
                  onTap: poll == null ? null : () => openPoll(context, poll),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Vote for\nplayer of the match', style: TextStyle(fontSize: 26, height: 0.95, fontWeight: FontWeight.w800)),
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
                      FilledButton(onPressed: poll == null ? null : () => openPoll(context, poll), child: const Text('CAST YOUR VOTE')),
                    ],
                  ),
                ),
                const SectionTitle('TIGERS NATION'),
                const ClubCard(
                  child: Column(
                    children: [
                      Row(children: [Expanded(child: _Stat(Icons.groups_outlined, '30K+', 'Fans worldwide')), Expanded(child: _Stat(Icons.shield_outlined, '6', 'Franchise teams'))]),
                      Row(children: [Expanded(child: _Stat(Icons.public, '30+', 'T10 matches')), Expanded(child: _Stat(Icons.timer_outlined, '90', 'Minutes of thrill'))]),
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
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Stack(
                                    fit: StackFit.expand,
                                    children: [
                                      RemoteImage(api.media(item.isVideo ? null : item.mediaUrl), height: 140, radius: 0),
                                      if (item.isVideo) const Center(child: Icon(Icons.play_circle_fill, color: goldLight, size: 36)),
                                      Positioned(left: 8, bottom: 8, child: MediaBadge(label: item.isVideo ? 'VIDEO' : 'PHOTO')),
                                    ],
                                  ),
                                ),
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
                  const SectionTitle('FAN CONTEST'),
                  ClubCard(
                    onTap: () => openContest(context, catalog.contests.first),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(catalog.contests.first.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                        if (catalog.contests.first.prize != null) Text('Prize · ${catalog.contests.first.prize}'),
                        const SizedBox(height: 10),
                        const Text('ENTER NOW', style: TextStyle(color: orange, fontWeight: FontWeight.w800)),
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
                          IconButton(onPressed: () => openExternal('https://www.facebook.com/share/1Bxhkk4L97/?mibextid=wwXIfr'), icon: const Icon(Icons.facebook), color: const Color(0xFF1877F2)),
                          IconButton(onPressed: () => openExternal('https://www.instagram.com/unitedtigers.ae'), icon: const Icon(Icons.camera_alt_outlined), color: pink),
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

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final art = banner.isImage ? api.media(banner.image) : api.media('/images/hero-art.webp');
    final title = const TextStyle(fontSize: 32, height: 0.94, fontWeight: FontWeight.w800);
    return GestureDetector(
      onTap: () => openClubPath(context, banner.ctaHref),
      child: SizedBox(
        height: 460,
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
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
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
                  const Padding(
                    padding: EdgeInsets.only(left: 28),
                    child: GoldText('AS ONE', style: TextStyle(fontSize: 15, fontStyle: FontStyle.italic, fontWeight: FontWeight.w800)),
                  ),
                ],
              ),
            ),
            Positioned(
              top: 124,
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
              bottom: 96,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.network(api.media('/brand/tiger-gold.png'), width: 42, height: 36, errorBuilder: (_, _, _) => const SizedBox(width: 42, height: 36)),
                  const SizedBox(width: 8),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GoldText('UNITED TIGERS', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, height: 1)),
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
                      _Arch(url: api.media(_cast[index]), height: index == 2 ? 72 : index == 1 || index == 3 ? 60 : 50),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _Arch extends StatelessWidget {
  const _Arch({required this.url, required this.height});
  final String url;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 38,
      height: height,
      margin: const EdgeInsets.only(left: 4),
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24), bottom: Radius.circular(8)),
        border: Border.all(color: const Color(0xFFEEC873), width: 1.4),
        gradient: const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFFFF7DBE), Color(0xFFC9177E), Color(0xFF6E2660)]),
      ),
      clipBehavior: Clip.antiAlias,
      child: Image.network(url, fit: BoxFit.cover, alignment: const Alignment(0, -0.2), errorBuilder: (_, _, _) => const SizedBox.shrink()),
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
  } else if (path.startsWith('/fan') || path.startsWith('/polls') || path.startsWith('/contests')) {
    page = const FanPage();
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
  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, color: gold, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: gold)),
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
  const _Crest(this.mark, this.name, this.place);
  final String mark;
  final String name;
  final String place;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            alignment: Alignment.center,
            decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: gold), color: glow),
            child: Text(mark, style: const TextStyle(fontWeight: FontWeight.w800)),
          ),
          const SizedBox(height: 6),
          Text(name, maxLines: 2, style: const TextStyle(fontWeight: FontWeight.w800)),
          Text(place, style: const TextStyle(color: Colors.white70, fontSize: 12)),
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
            const _Crest('UT', 'United Tigers', 'Abu Dhabi'),
            const Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Text('VS', style: TextStyle(color: gold, fontWeight: FontWeight.w800))),
            _Crest(_mark(match.opponentShort ?? match.opponent), match.opponent, match.venueCity ?? 'Away'),
          ],
        ),
        const SizedBox(height: 10),
        Text(when(match.date)),
        Text(match.venueName ?? 'Venue TBC'),
        const SizedBox(height: 12),
        const Text('MATCH CENTRE', style: TextStyle(color: orange, fontWeight: FontWeight.w800)),
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

