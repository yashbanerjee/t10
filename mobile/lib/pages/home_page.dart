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
        final kit = (featuredKit.isEmpty ? catalog.products : featuredKit).take(3);
        final photos = catalog.gallery.where((item) => !item.isVideo).toList();
        final featuredPhotos = photos.where((item) => item.isFeatured).toList();
        final gallery = (featuredPhotos.isEmpty ? photos : featuredPhotos).take(6).toList();
        final highlights = [
          ...catalog.news.where((story) => story.isFeatured),
          ...catalog.news.where((story) => !story.isFeatured),
        ].take(3);

        return Scaffold(
          body: RefreshIndicator(
            onRefresh: api.refresh,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [
                HomeHero(banner: api.banner),
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
                    itemCount: catalog.players.take(4).length,
                    separatorBuilder: (_, _) => const SizedBox(width: 10),
                    itemBuilder: (context, index) {
                      final player = catalog.players[index];
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
                                Text('${player.jerseyNumber ?? 'UT'}', style: const TextStyle(color: gold, fontWeight: FontWeight.w800)),
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
                      Row(children: [Expanded(child: _Stat(Icons.public, '30+', 'T10 nations')), Expanded(child: _Stat(Icons.timer_outlined, '90', 'Minutes of thrill'))]),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                const NationSignup(),
                SectionTitle('LATEST HIGHLIGHTS', action: 'View all', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NewsPage()))),
                ...highlights.map(
                  (story) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: ClubCard(
                      onTap: () => openStory(context, story),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          RemoteImage(api.media(story.coverImage)),
                          const SizedBox(height: 8),
                          Text(story.category ?? '', style: const TextStyle(color: gold, fontSize: 11)),
                          Text(story.title, style: const TextStyle(fontWeight: FontWeight.w800)),
                        ],
                      ),
                    ),
                  ),
                ),
                SectionTitle('FIXTURES & RESULTS', action: 'View all', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FixturesPage()))),
                ...listed.map(
                  (match) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: ClubCard(onTap: () => openMatch(context, match), child: _FixtureRow(match: match)),
                  ),
                ),
                SectionTitle('FEATURED KIT', action: 'Shop all', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ShopPage()))),
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
                SectionTitle('IN THE FRAME', action: 'Gallery', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GalleryPage()))),
                SizedBox(
                  height: 120,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: gallery.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 8),
                    itemBuilder: (context, index) => SizedBox(width: 160, child: RemoteImage(api.media(gallery[index].mediaUrl), height: 120)),
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
                  onTap: () => openExternal('https://www.instagram.com/unitedtigers.ae/'),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('#UnitedTigers', style: TextStyle(color: gold, fontWeight: FontWeight.w800)),
                      SizedBox(height: 4),
                      Text('Once a Tiger always a Tiger'),
                      SizedBox(height: 8),
                      Text('INSTAGRAM', style: TextStyle(color: orange, fontWeight: FontWeight.w800)),
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

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final lines = banner.titleLines;
    return Padding(
      padding: const EdgeInsets.only(top: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (banner.isImage) ...[
            RemoteImage(api.media(banner.image), height: 180, radius: 18),
            const SizedBox(height: 14),
          ],
          const Text('ABU DHABI T10', style: TextStyle(color: orange, fontWeight: FontWeight.w800, letterSpacing: 1.6, fontSize: 12)),
          const SizedBox(height: 8),
          if (lines[0].isNotEmpty) Text(lines[0], style: const TextStyle(fontSize: 40, height: 0.92, fontWeight: FontWeight.w800)),
          if (lines[1].isNotEmpty) Text(lines[1], style: const TextStyle(fontSize: 40, height: 0.92, fontWeight: FontWeight.w800)),
          Text(banner.accent, style: const TextStyle(fontSize: 40, height: 0.92, fontWeight: FontWeight.w800, color: gold)),
          const SizedBox(height: 8),
          Text(banner.tagline, style: const TextStyle(letterSpacing: 1.4, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(banner.roar, style: const TextStyle(color: gold, fontWeight: FontWeight.w800, letterSpacing: 2)),
          const SizedBox(height: 16),
          FilledButton(onPressed: () => openClubPath(context, banner.ctaHref), child: Text(banner.ctaLabel)),
        ],
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

class NationSignup extends StatefulWidget {
  const NationSignup({super.key});

  @override
  State<NationSignup> createState() => _NationSignupState();
}

class _NationSignupState extends State<NationSignup> {
  final email = TextEditingController();
  bool busy = false;

  @override
  void dispose() {
    email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClubCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('JOIN THE TIGERS NATION', style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          ClubField(label: 'Email address', controller: email, email: true),
          FilledButton(
            onPressed: busy ? null : _submit,
            child: Text(busy ? 'SENDING…' : 'SIGN UP'),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    setState(() => busy = true);
    try {
      final message = await ClubScope.of(context).api.sendContact({
        'name': 'Tigers Nation',
        'email': email.text.trim(),
        'subject': 'Tigers Nation signup',
        'message': 'Please add this email to Tigers Nation updates.',
      });
      if (mounted) await showClubMessage(context, message);
      email.clear();
    } catch (reason) {
      if (mounted) await showClubMessage(context, '$reason'.replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}
