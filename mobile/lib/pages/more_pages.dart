import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:united_tigers/api/api_client.dart';
import 'package:united_tigers/pages/club_pages.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/pages/fan_pages.dart';
import 'package:united_tigers/pages/team_page.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/video.dart';
import 'package:united_tigers/widgets.dart';

void _push(BuildContext context, Widget page) => Navigator.push(context, MaterialPageRoute(builder: (_) => page));

/// Opens a link from CMS text: site paths go to the matching screen, anything else opens in the browser.
void openSiteLink(BuildContext context, String href) {
  final path = href.trim();
  if (path.startsWith('http')) {
    openExternal(path);
    return;
  }
  if (path.startsWith('/contact')) return _push(context, const ContactPage());
  if (path.startsWith('/privacy')) return _push(context, const LegalScreen(kind: LegalKind.privacy));
  if (path.startsWith('/terms')) return _push(context, const LegalScreen(kind: LegalKind.terms));
  if (path.startsWith('/vote') || path.startsWith('/polls') || path.startsWith('/contests')) return _push(context, const VotePage());
  if (path.startsWith('/news')) return _push(context, const NewsPage());
  if (path.startsWith('/become-a-partner')) return _push(context, const BecomePartnerPage());
  if (path.startsWith('/partners')) return _push(context, const PartnersPage());
  if (path.startsWith('/track-order')) return _push(context, const TrackOrderPage());
  if (path.startsWith('/franchises') || path.startsWith('/about')) return _push(context, const FranchisesPage());
  if (path.startsWith('/draft')) return _push(context, const DraftPage());
  if (path.startsWith('/season')) return _push(context, const SeasonPage());
  if (path.startsWith('/gallery')) return _push(context, const GalleryPage());
  if (path.startsWith('/updates')) return _push(context, const UpdatesPage());
  if (path.startsWith('/stats')) return _push(context, const StatsPage());
  if (path.startsWith('/records')) return _push(context, const RecordsPage());
  if (path.startsWith('/points-table')) return _push(context, const PointsPage());
  openExternal('${ClubScope.of(context).api.base}$path');
}

class _MenuItem {
  const _MenuItem(this.icon, this.title, this.subtitle, this.page);
  final FaIconData icon;
  final String title;
  final String subtitle;
  final Widget page;
}

class MorePage extends StatelessWidget {
  const MorePage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    const featured = [
      _MenuItem(FontAwesomeIcons.squarePollVertical, 'Vote', 'Polls & contests', VotePage()),
      _MenuItem(FontAwesomeIcons.chartLine, 'Stats centre', 'T10, All T20 & T20Is', StatsPage()),
    ];
    const club = [
      _MenuItem(FontAwesomeIcons.newspaper, 'News', 'The newsroom', NewsPage()),
      _MenuItem(FontAwesomeIcons.bullhorn, 'Tigers Daily', 'Training & team updates', UpdatesPage()),
      _MenuItem(FontAwesomeIcons.images, 'Gallery', 'Photos & videos', GalleryPage()),
      _MenuItem(FontAwesomeIcons.tableList, 'Points table', 'League standings', PointsPage()),
      _MenuItem(FontAwesomeIcons.trophy, 'Records', 'The record book', RecordsPage()),
      _MenuItem(FontAwesomeIcons.fire, 'Fan Zone', 'Coming soon', FanZonePage()),
      _MenuItem(FontAwesomeIcons.handshake, 'Partners', 'Our sponsors', PartnersPage()),
      _MenuItem(FontAwesomeIcons.bookOpen, 'Our story', 'About the club', AboutPage()),
      _MenuItem(FontAwesomeIcons.calendarDays, '2026 season', 'Results & leaders', SeasonPage()),
      _MenuItem(FontAwesomeIcons.clapperboard, 'Player draft', 'Draft night', DraftPage()),
      _MenuItem(FontAwesomeIcons.shieldHalved, 'Franchises', 'The Tigers family', FranchisesPage()),
      _MenuItem(FontAwesomeIcons.truckFast, 'Track booking', 'Shop orders', TrackOrderPage()),
    ];
    return AnimatedBuilder(
      animation: api,
      builder: (context, _) => Scaffold(
        appBar: const ClubAppBar('United Tigers'),
        body: ListView(
          scrollCacheExtent: pageCacheExtent,
          padding: EdgeInsets.fromLTRB(16, 18, 16, 28 + navClearance(context)),
          children: [
            Row(children: [for (final item in featured) Expanded(child: Padding(padding: EdgeInsets.only(right: item == featured.first ? 6 : 0, left: item == featured.first ? 0 : 6), child: _FeatureTile(item: item)))]),
            const SectionTitle('The club'),
            GridView(
              shrinkWrap: true,
              padding: EdgeInsets.zero,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 10, crossAxisSpacing: 10, mainAxisExtent: MediaQuery.textScalerOf(context).scale(70)),
              children: [for (final item in club) _MenuTile(item: item)],
            ),
            const SectionTitle('Get in touch'),
            _MenuRow(icon: FontAwesomeIcons.envelope, title: 'Contact', subtitle: 'Partnership, media & supporter enquiries', onTap: () => _push(context, const ContactPage())),
            _MenuRow(icon: FontAwesomeIcons.crown, title: 'Become a partner', subtitle: 'Get the partnership brochure', onTap: () => _push(context, const BecomePartnerPage())),
            _MenuRow(icon: FontAwesomeIcons.userShield, title: 'Privacy', subtitle: 'How we handle your information', onTap: () => _push(context, const LegalScreen(kind: LegalKind.privacy))),
            _MenuRow(icon: FontAwesomeIcons.scaleBalanced, title: 'Terms', subtitle: 'Using the app, shop, polls & contests', onTap: () => _push(context, const LegalScreen(kind: LegalKind.terms))),
            const SizedBox(height: 18),
            Center(child: Opacity(opacity: 0.8, child: Image.asset('assets/brand/abu-dhabi-t10-landscape-white.png', height: 22 * clubScale(context)))),
            const SizedBox(height: 8),
            const Center(child: Text('#LetsGoHunt', style: TextStyle(color: goldLight, fontWeight: FontWeight.w800, letterSpacing: 1.2))),
          ],
        ),
      ),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  const _FeatureTile({required this.item});
  final _MenuItem item;

  @override
  Widget build(BuildContext context) {
    return Reveal(
      scale: 0.9,
      child: Pressable(
        onTap: () => _push(context, item.page),
        child: GlowFrame(
          radius: 18,
          width: 1.8,
          offset: item.title.length * 0.13,
          child: Container(
            height: MediaQuery.textScalerOf(context).scale(84),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: const BoxDecoration(gradient: accentGradient),
            child: Row(
              children: [
                Floating(
                  distance: 3,
                  phase: item.title.length * 0.1 % 1,
                  child: Container(
                    width: 42,
                    height: 42,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(12)),
                    child: FaIcon(item.icon, color: Colors.white, size: 19),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerLeft, child: Text(item.title.toUpperCase(), maxLines: 1, style: displayStyle(18, color: Colors.white, height: 1.1))),
                      const SizedBox(height: 2),
                      Text(item.subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFFBE3F1), fontSize: 11, height: 1.2)),
                    ],
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

class _MenuTile extends StatelessWidget {
  const _MenuTile({required this.item});
  final _MenuItem item;

  @override
  Widget build(BuildContext context) {
    return ClubCard(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      onTap: () => _push(context, item.page),
      child: SizedBox.expand(
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.06),
                border: Border.all(color: gold.withValues(alpha: 0.35)),
              ),
              child: ShaderMask(blendMode: BlendMode.srcIn, shaderCallback: (bounds) => goldSurface.createShader(bounds), child: FaIcon(item.icon, size: 16)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.title.toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, style: displayStyle(15, color: Colors.white, height: 1.1)),
                  const SizedBox(height: 2),
                  Text(item.subtitle, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 11)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuRow extends StatelessWidget {
  const _MenuRow({required this.icon, required this.title, required this.subtitle, required this.onTap});
  final FaIconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: ClubCard(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        onTap: onTap,
        child: Row(
          children: [
            SizedBox(width: 26, child: Center(child: FaIcon(icon, color: goldLight, size: 19))),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)), Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 12))])),
            const FaIcon(FontAwesomeIcons.chevronRight, color: goldLight, size: 14),
          ],
        ),
      ),
    );
  }
}

class NewsPage extends StatelessWidget {
  const NewsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: const ClubAppBar('Newsroom'),
      body: AnimatedBuilder(
        animation: api,
        builder: (context, _) {
          final stories = api.catalog.news;
          return RefreshIndicator(
            color: pink,
            onRefresh: api.refresh,
            child: ListView(
              scrollCacheExtent: pageCacheExtent,
              padding: EdgeInsets.zero,
              children: [
                const PageHero(eyebrow: 'The newsroom', title: 'Club news.', intro: 'Squad announcements, match reports and stories from around the Tigers.'),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
                  child: stories.isEmpty
                      ? const EmptyPanel(title: 'Stories will appear here.')
                      : Column(
                          children: [
                            for (var index = 0; index < stories.length; index++)
                              Padding(padding: const EdgeInsets.only(bottom: 12), child: _StoryCard(story: stories[index], lead: index == 0)),
                          ],
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StoryCard extends StatelessWidget {
  const _StoryCard({required this.story, this.lead = false});
  final NewsStory story;
  final bool lead;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return ClubCard(
      padding: EdgeInsets.zero,
      highlight: lead,
      onTap: () => openStory(context, story),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              RemoteImage(api.media(story.coverImage), height: lead ? 200 : 150, radius: 15),
              Positioned(left: 12, top: 12, child: MediaBadge(label: (story.category ?? 'NEWS').toUpperCase())),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (story.publishedAt != null) Text(when(story.publishedAt).split(' · ').first.toUpperCase(), style: const TextStyle(color: goldLight, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1)),
                const SizedBox(height: 6),
                Text(story.title.toUpperCase(), style: displayStyle(lead ? 26 : 21, color: Colors.white)),
                const SizedBox(height: 8),
                Text(story.excerpt, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFD9CCE6))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

void openStory(BuildContext context, NewsStory story) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => StoryPage(slug: story.slug, preview: story)));
}

class StoryPage extends StatefulWidget {
  const StoryPage({super.key, required this.slug, this.preview});
  final String slug;
  final NewsStory? preview;

  @override
  State<StoryPage> createState() => _StoryPageState();
}

class _StoryPageState extends State<StoryPage> {
  NewsStory? story;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    story = widget.preview;
    ClubScope.of(context).api.fetchNews(widget.slug).then((loaded) {
      if (mounted) setState(() => story = loaded);
    }).catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final current = story;
    if (current == null) return const Scaffold(appBar: ClubAppBar('News'), body: LoadingView());
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: ClubAppBar(current.category ?? 'News'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: [
          PageHero(
            eyebrow: [current.category ?? 'News', if (current.publishedAt != null) when(current.publishedAt).split(' · ').first].join(' · '),
            title: current.title,
            intro: current.excerpt,
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (current.coverImage != null) ...[RemoteImage(api.media(current.coverImage), height: 220, radius: 16), const SizedBox(height: 16)],
                ClubMarkdown(current.content.isEmpty ? current.excerpt : current.content, mediaUrl: api.media, onLink: (href) => openSiteLink(context, href)),
                const SizedBox(height: 10),
                Text('${current.authorName ?? 'United Tigers'}${current.publishedAt == null ? '' : ' · ${when(current.publishedAt).split(' · ').first}'}', style: const TextStyle(color: goldLight, fontWeight: FontWeight.w700)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

void openUpdate(BuildContext context, TeamUpdate update) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => UpdatePage(update: update)));
}

class UpdatesPage extends StatelessWidget {
  const UpdatesPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: const ClubAppBar('Tigers Daily'),
      body: AnimatedBuilder(
        animation: api,
        builder: (context, _) {
          final updates = api.catalog.updates;
          return RefreshIndicator(
            color: pink,
            onRefresh: api.refresh,
            child: ListView(
              scrollCacheExtent: pageCacheExtent,
              padding: EdgeInsets.zero,
              children: [
                const PageHero(eyebrow: 'Tigers daily', title: 'Inside the camp.', intro: 'Training notes, team news and behind-the-scenes moments.'),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
                  child: updates.isEmpty
                      ? const EmptyPanel(title: 'Check back soon.', message: 'Training notes and team news will appear here.')
                      : Column(
                          children: updates
                              .map((update) => Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: ClubCard(
                                      padding: EdgeInsets.zero,
                                      onTap: () => openUpdate(context, update),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          if (update.image != null) UpdatePhoto(api.media(update.image), radius: 15),
                                          Padding(
                                            padding: const EdgeInsets.all(16),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(children: [StatusChip(update.category?.replaceAll('_', ' ') ?? 'UPDATE'), const Spacer(), Text(when(update.publishedAt).split(' · ').first, style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 12))]),
                                                const SizedBox(height: 10),
                                                Text(update.title.toUpperCase(), style: displayStyle(21, color: Colors.white)),
                                                const SizedBox(height: 6),
                                                Text(update.description, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFD9CCE6))),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ))
                              .toList(),
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class UpdatePage extends StatefulWidget {
  const UpdatePage({super.key, required this.update});
  final TeamUpdate update;

  @override
  State<UpdatePage> createState() => _UpdatePageState();
}

class _UpdatePageState extends State<UpdatePage> {
  TeamUpdate? current;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    current = widget.update;
    if (widget.update.slug.isEmpty) return;
    ClubScope.of(context).api.fetchUpdate(widget.update.slug).then((loaded) {
      if (!mounted) return;
      final image = matchingUpdateImage(widget.update.image, loaded.image);
      setState(() => current = image != null && image != loaded.image ? loaded.withImage(image) : loaded);
    }).catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final update = current ?? widget.update;
    final api = ClubScope.of(context).api;
    final body = update.content.trim();
    final intro = update.description.trim();
    final showBody = body.isNotEmpty && body != intro;
    return Scaffold(
      appBar: const ClubAppBar('Tigers Daily'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: [
          PageHero(eyebrow: '${update.category?.replaceAll('_', ' ') ?? 'Update'} · ${when(update.publishedAt).split(' · ').first}', title: update.title, intro: update.description),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (update.image != null) ...[UpdatePhoto(api.media(update.image), radius: 15), const SizedBox(height: 16)],
                if (update.playerName != null) ...[Eyebrow(update.playerName!), const SizedBox(height: 12)],
                if (showBody) ClubMarkdown(update.content, mediaUrl: api.media, onLink: (href) => openSiteLink(context, href)),
                if (update.video != null) ...[
                  const SizedBox(height: 12),
                  FilledButton.icon(onPressed: () => playVideo(context, api.media(update.video), title: update.title), icon: const FaIcon(FontAwesomeIcons.play, size: 15), label: const Text('WATCH')),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class GalleryPage extends StatelessWidget {
  const GalleryPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final items = api.catalog.gallery;
    return Scaffold(
      appBar: const ClubAppBar('Gallery'),
      body: CustomScrollView(
        scrollCacheExtent: pageCacheExtent,
        slivers: [
          const SliverToBoxAdapter(child: PageHero(eyebrow: 'Gallery', title: 'Moments.', intro: 'Photos and videos from match days, training and the Tigers family.')),
          if (items.isEmpty)
            const SliverPadding(padding: EdgeInsets.all(16), sliver: SliverToBoxAdapter(child: EmptyPanel(title: 'Photos and videos will appear here.')))
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
              sliver: SliverGrid(
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: MediaQuery.sizeOf(context).shortestSide >= 600 ? 4 : 2, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: 0.8),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final item = items[index];
                    return Reveal(
                      scale: 0.92,
                      fade: false,
                      child: Pressable(
                        onTap: () => openGallery(context, items, item, api.media),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              if (item.isVideo) VideoThumb(api.media(item.mediaUrl)) else RemoteImage(api.media(item.mediaUrl), height: 200, radius: 0),
                              const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Color(0xD91C0432)], stops: [0.5, 1]))),
                              if (item.isVideo) const Center(child: FaIcon(FontAwesomeIcons.circlePlay, color: goldLight, size: 40)),
                              Positioned(left: 8, top: 8, child: MediaBadge(label: item.isVideo ? 'VIDEO' : 'PHOTO')),
                              Positioned(left: 10, right: 10, bottom: 10, child: Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13))),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                  childCount: items.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class PartnersPage extends StatelessWidget {
  const PartnersPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final sponsors = api.catalog.sponsors;
    return Scaffold(
      appBar: const ClubAppBar('Partners'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: [
          const PageHero(eyebrow: 'Our partners', title: 'Cricket unites people.', intro: 'The brands backing the Tigers in their first season.'),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
            child: sponsors.isEmpty
                ? const EmptyPanel(title: 'Partners will appear here.')
                : Column(
                    children: sponsors
                        .map(
                          (sponsor) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: ClubCard(
                              onTap: sponsor.website == null ? null : () => openExternal(sponsor.website!),
                              child: Row(
                                children: [
                                  Container(
                                    width: 84 * clubScale(context),
                                    height: 56 * clubScale(context),
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF6A1FB0), Color(0xFF3A0A68), Color(0xFF250545)]),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: gold.withValues(alpha: 0.7)),
                                      boxShadow: [BoxShadow(color: pink.withValues(alpha: 0.3), blurRadius: 12)],
                                    ),
                                    child: sponsor.logoUrl == null ? const FaIcon(FontAwesomeIcons.handshake, color: goldLight) : Image.network(api.media(sponsor.logoUrl), fit: BoxFit.contain, errorBuilder: (_, _, _) => const FaIcon(FontAwesomeIcons.handshake, color: goldLight)),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text((sponsor.category ?? 'Partner').toUpperCase(), style: const TextStyle(color: goldLight, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1)),
                                        Text(sponsor.name.toUpperCase(), style: displayStyle(21, color: Colors.white)),
                                      ],
                                    ),
                                  ),
                                  if (sponsor.website != null) const Icon(Icons.arrow_outward, color: goldLight, size: 18),
                                ],
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
            child: ClubCard(
              highlight: true,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Eyebrow('Build with the Tigers'),
                  const SizedBox(height: 6),
                  GoldText('LET’S MAKE A MARK.', style: displayStyle(28)),
                  const SizedBox(height: 4),
                  const Text('Talk to our team about 2026 partnership opportunities.', style: TextStyle(color: Color(0xFFE6DDF0))),
                  const SizedBox(height: 12),
                  FilledButton(style: goldButtonStyle(), onPressed: () => _push(context, const BecomePartnerPage()), child: const Text('BECOME A PARTNER')),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const ClubAppBar('Our story'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: const [
          PageHero(
            eyebrow: 'Our story',
            title: 'Built for the moment.',
            intro: 'United Tigers are a new Abu Dhabi T10 franchise announced for the 2026 season. The club brings a fresh identity to a format built for pace, energy and unforgettable moments.',
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(16, 18, 16, 28),
            child: Column(
              children: [
                Text('Fakhar Zaman has been announced as the team’s icon player. As the squad takes shape, the club’s story will be written alongside its players, partners and fans.', style: TextStyle(color: Color(0xFFE6DDF0), fontSize: 15, height: 1.5)),
                SizedBox(height: 16),
                _Pillar('01', 'Our mission', 'Bring people together through fast, fearless cricket and a shared pride in the Tigers.'),
                _Pillar('02', 'Our vision', 'Build a team and fan community that grows stronger with every season.'),
                _Pillar('03', 'Our values', 'Play with courage. Move with purpose. Make room for everyone in the pride.'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Pillar extends StatelessWidget {
  const _Pillar(this.index, this.title, this.body);
  final String index;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: ClubCard(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GoldText(index, style: displayStyle(40)),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title.toUpperCase(), style: displayStyle(21, color: Colors.white)),
                  const SizedBox(height: 4),
                  Text(body, style: const TextStyle(color: Color(0xFFD9CCE6))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ContactPage extends StatefulWidget {
  const ContactPage({super.key});

  @override
  State<ContactPage> createState() => _ContactPageState();
}

class _ContactPageState extends State<ContactPage> {
  final name = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();
  final subject = TextEditingController();
  final message = TextEditingController();
  bool busy = false;

  @override
  void dispose() {
    for (final field in [name, email, phone, subject, message]) {
      field.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const ClubAppBar('Contact'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: [
          const PageHero(eyebrow: 'Contact', title: 'Talk to the Tigers.', intro: 'For partnership, media and supporter enquiries, leave a message for the team. Based in Abu Dhabi, United Arab Emirates.'),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(child: OutlinedButton.icon(onPressed: () => openExternal('https://www.facebook.com/share/1Bxhkk4L97/?mibextid=wwXIfr'), icon: const FaIcon(FontAwesomeIcons.facebookF, size: 16), label: const Text('FACEBOOK'))),
                    const SizedBox(width: 10),
                    Expanded(child: OutlinedButton.icon(onPressed: () => openExternal('https://www.instagram.com/unitedtigers.ae'), icon: const FaIcon(FontAwesomeIcons.instagram, size: 17), label: const Text('INSTAGRAM'))),
                  ],
                ),
                const SectionTitle('Send a message'),
                ClubField(label: 'Name', controller: name),
                ClubField(label: 'Email', controller: email, email: true),
                ClubField(label: 'Phone', controller: phone, phone: true),
                ClubField(label: 'Subject', controller: subject),
                ClubField(label: 'Message', controller: message, lines: 5),
                FilledButton(onPressed: busy ? null : _submit, child: Text(busy ? 'SENDING…' : 'SEND MESSAGE')),
                const SizedBox(height: 10),
                Text.rich(
                  TextSpan(children: [
                    const TextSpan(text: 'We use your details only to reply. See our '),
                    WidgetSpan(alignment: PlaceholderAlignment.baseline, baseline: TextBaseline.alphabetic, child: GestureDetector(onTap: () => _push(context, const LegalScreen(kind: LegalKind.privacy)), child: const Text('privacy policy', style: TextStyle(color: goldLight, decoration: TextDecoration.underline, decorationColor: goldLight, fontSize: 12.5)))),
                    const TextSpan(text: '.'),
                  ]),
                  style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 12.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    setState(() => busy = true);
    try {
      final reply = await ClubScope.of(context).api.sendContact({
        'name': name.text.trim(),
        'email': email.text.trim(),
        'phone': phone.text.trim(),
        'subject': subject.text.trim(),
        'message': message.text.trim(),
      });
      if (mounted) await showClubMessage(context, reply);
    } catch (reason) {
      if (mounted) await showClubMessage(context, '$reason'.replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}

enum LegalKind { privacy, terms }

/// Privacy or Terms, with the wording an admin saves under Legal pages.
class LegalScreen extends StatelessWidget {
  const LegalScreen({super.key, required this.kind});
  final LegalKind kind;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return AnimatedBuilder(
      animation: api,
      builder: (context, _) {
        final page = kind == LegalKind.privacy ? api.site.privacy : api.site.terms;
        final fallbackTitle = kind == LegalKind.privacy ? 'Privacy' : 'Terms';
        return Scaffold(
          appBar: ClubAppBar(page?.title ?? fallbackTitle),
          body: page == null
              ? MessageView('The ${fallbackTitle.toLowerCase()} page could not be loaded. Check your connection and try again.', onRetry: api.refresh)
              : RefreshIndicator(
                  color: pink,
                  onRefresh: api.refresh,
                  child: ListView(
                    scrollCacheExtent: pageCacheExtent,
                    padding: EdgeInsets.zero,
                    children: [
                      PageHero(eyebrow: 'United Tigers', title: '${page.title}.', intro: page.intro),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 18, 16, 32),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (page.updatedOn != null) Text('LAST UPDATED ${when(page.updatedOn).split(' · ').first.toUpperCase()}', style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 1)),
                            ClubMarkdown(page.content, mediaUrl: api.media, onLink: (href) => openSiteLink(context, href)),
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

class ServerPage extends StatefulWidget {
  const ServerPage({super.key});

  @override
  State<ServerPage> createState() => _ServerPageState();
}

class _ServerPageState extends State<ServerPage> {
  TextEditingController? address;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    address ??= TextEditingController(text: ClubScope.of(context).api.base);
  }

  @override
  void dispose() {
    address?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const ClubAppBar('Server'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: const EdgeInsets.all(16),
        children: [
          const Text('The app uses the live United Tigers site, https://unitedtigers.ae. For local testing, point it at your computer instead (an Android emulator reaches it at http://10.0.2.2:3001).', style: TextStyle(color: Color(0xFFE6DDF0))),
          const SizedBox(height: 16),
          ClubField(label: 'API address', controller: address!),
          FilledButton(
            onPressed: () async {
              await ClubScope.of(context).api.setBase(address!.text);
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('SAVE'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () async {
              await ClubScope.of(context).api.setBase(ApiClient.liveBase);
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('USE LIVE SITE'),
          ),
        ],
      ),
    );
  }
}

enum StatScope { season, allT20, t20 }

enum StatCategory { batting, bowling, fielding }

typedef _Column = (String key, String label);

const _columns = <StatCategory, List<_Column>>{
  StatCategory.batting: [('runs', 'Runs'), ('matches', 'M'), ('average', 'Avg'), ('strikeRate', 'SR'), ('highestScore', 'HS'), ('fours', '4s'), ('sixes', '6s')],
  StatCategory.bowling: [('wickets', 'Wkts'), ('matches', 'M'), ('economy', 'Econ'), ('bowlingAverage', 'Avg'), ('bowlingStrikeRate', 'SR'), ('bestBowling', 'Best')],
  StatCategory.fielding: [('catches', 'Catches'), ('runOuts', 'Run outs'), ('stumpings', 'Stumpings')],
};

String _figure(FigureSet? set, String key) {
  if (set == null) return '–';
  final text = set.text(key);
  if (text == null) return '–';
  final number = num.tryParse(text);
  if (number == null) return text;
  return number % 1 == 0 ? number.toInt().toString() : number.toStringAsFixed(2);
}

class StatsPage extends StatefulWidget {
  const StatsPage({super.key});

  @override
  State<StatsPage> createState() => _StatsPageState();
}

class _StatsPageState extends State<StatsPage> {
  List<PlayerStat> rows = [];
  String? error;
  bool loading = true;
  bool started = false;
  StatScope scope = StatScope.season;
  StatCategory category = StatCategory.batting;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ClubScope.of(context).api.fetchStats();
      if (!mounted) return;
      final played = data.where((row) => row.season.played).length;
      setState(() {
        rows = data;
        loading = false;
        error = null;
        scope = played * 2 >= data.length ? StatScope.season : data.any((row) => row.allT20 != null) ? StatScope.allT20 : StatScope.t20;
      });
    } catch (reason) {
      if (mounted) setState(() { error = '$reason'.replaceFirst('Exception: ', ''); loading = false; });
    }
  }

  FigureSet? _figures(PlayerStat row) => switch (scope) { StatScope.season => row.season, StatScope.allT20 => row.allT20, StatScope.t20 => row.t20 };

  void _changeScope(StatScope next) => setState(() {
        scope = next;
        if (next == StatScope.t20 && category == StatCategory.fielding) category = StatCategory.batting;
      });

  @override
  Widget build(BuildContext context) {
    final columns = _columns[category]!;
    final primary = columns.first.$1;
    final sorted = [...rows]..sort((left, right) {
        final a = _figures(left)?.number(primary);
        final b = _figures(right)?.number(primary);
        if (a == null && b == null) return left.name.compareTo(right.name);
        if (a == null) return 1;
        if (b == null) return -1;
        return b.compareTo(a);
      });
    final leaders = sorted.where((row) => (_figures(row)?.number(primary) ?? 0) > 0).take(3).toList();
    final footnote = switch (scope) {
      StatScope.season => 'Figures from scorecards of the ${DateTime.now().year} Abu Dhabi T10 season.',
      StatScope.allT20 => 'Every recognised T20 the player has played: domestic, franchise and international. These are not merged into club figures.',
      StatScope.t20 => 'T20 Internationals only. Players without a T20I are listed with a link to their All T20 record.',
    };
    return Scaffold(
      appBar: ClubAppBar('Stats centre', actions: [IconButton(tooltip: 'Records', onPressed: () => _push(context, const RecordsPage()), icon: const FaIcon(FontAwesomeIcons.trophy, color: goldLight, size: 19))]),
      body: error != null
          ? MessageView(error!, onRetry: () { setState(() => loading = true); _load(); })
          : loading
              ? const LoadingView()
              : RefreshIndicator(
                  color: pink,
                  onRefresh: _load,
                  child: ListView(
                    scrollCacheExtent: pageCacheExtent,
                    padding: EdgeInsets.zero,
                    children: [
                      PageHero(
                        eyebrow: 'Stats centre',
                        title: 'The numbers.',
                        intro: footnote,
                        child: ClubTabs<StatScope>(options: [(StatScope.season, '${DateTime.now().year} T10'), (StatScope.allT20, 'All T20'), (StatScope.t20, 'T20I')], value: scope, onChanged: _changeScope),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ClubTabs<StatCategory>(
                              options: [(StatCategory.batting, 'Batting'), (StatCategory.bowling, 'Bowling'), if (scope != StatScope.t20) (StatCategory.fielding, 'Fielding')],
                              value: category,
                              onChanged: (next) => setState(() => category = next),
                            ),
                            if (rows.isEmpty)
                              const Padding(padding: EdgeInsets.only(top: 16), child: EmptyPanel(title: 'The numbers will appear once scorecards are entered.'))
                            else ...[
                              if (leaders.isNotEmpty) ...[
                                SectionTitle('Leaders · ${columns.first.$2}'),
                                Row(children: [for (var index = 0; index < leaders.length; index++) Expanded(child: Padding(padding: EdgeInsets.only(right: index < leaders.length - 1 ? 8 : 0), child: _LeaderCard(rank: index + 1, name: leaders[index].name, value: _figure(_figures(leaders[index]), primary), label: columns.first.$2, onTap: () => _openPlayer(leaders[index]))))]),
                              ],
                              SectionTitle(category.name),
                              ...sorted.map((row) => Padding(padding: const EdgeInsets.only(bottom: 10), child: _statRow(row, columns))),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _statRow(PlayerStat row, List<_Column> columns) {
    final figures = _figures(row);
    return ClubCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      onTap: () => _openPlayer(row),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [Expanded(child: Text(row.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15.5))), if (figures != null) GoldText(_figure(figures, columns.first.$1), style: displayStyle(26))]),
          const SizedBox(height: 8),
          if (figures == null && scope != StatScope.season)
            Wrap(
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 8,
              children: [
                Text(scope == StatScope.t20 ? 'No T20 Internationals yet.' : 'No T20 record available yet.', style: const TextStyle(color: Color(0xFFBDAED0), fontStyle: FontStyle.italic)),
                if (scope == StatScope.t20 && row.allT20 != null)
                  GestureDetector(onTap: () => _changeScope(StatScope.allT20), child: const Text('See his All T20 record', style: TextStyle(color: goldLight, fontWeight: FontWeight.w800, decoration: TextDecoration.underline, decorationColor: goldLight))),
              ],
            )
          else
            Wrap(spacing: 6, runSpacing: 6, children: [for (final (key, label) in columns.skip(1)) _FigureChip(label: label, value: _figure(figures, key))]),
        ],
      ),
    );
  }

  void _openPlayer(PlayerStat row) {
    final player = ClubScope.of(context).api.catalog.players.where((player) => player.slug == row.slug).firstOrNull;
    if (player != null) openPlayer(context, player);
  }
}

class _LeaderCard extends StatelessWidget {
  const _LeaderCard({required this.rank, required this.name, required this.value, required this.label, required this.onTap});
  final int rank;
  final String name;
  final String value;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final first = rank == 1;
    return Reveal(
      delay: Duration(milliseconds: 90 * rank),
      scale: 0.85,
      child: Pressable(
        onTap: onTap,
        child: GlowFrame(
          radius: 16,
          width: first ? 1.8 : 1.2,
          colors: first ? neonGold : softRim,
          bloom: first ? 0.75 : 0.3,
          offset: rank * 0.21,
          child: Container(
            height: 132 * clubScale(context),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: first ? accentGradient : const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF3A0B66), Color(0xFF2A0750)]),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('#$rank', style: displayStyle(18, color: first ? Colors.white : goldLight)),
                const Spacer(),
                CountUp(value, builder: (text) => GoldText(text, style: displayStyle(34))),
                Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1, color: Color(0xFFF1E6F7))),
                const SizedBox(height: 4),
                Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FigureChip extends StatelessWidget {
  const _FigureChip({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(color: purple.withValues(alpha: 0.7), borderRadius: BorderRadius.circular(9), border: Border.all(color: gold.withValues(alpha: 0.25))),
      child: Text.rich(TextSpan(children: [TextSpan(text: '${label.toUpperCase()} ', style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 0.5)), TextSpan(text: value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800))])),
    );
  }
}

class RecordsPage extends StatefulWidget {
  const RecordsPage({super.key});

  @override
  State<RecordsPage> createState() => _RecordsPageState();
}

class _RecordsPageState extends State<RecordsPage> {
  List<ClubRecord> rows = [];
  bool loading = true;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    ClubScope.of(context).api.fetchRecords().then((data) {
      if (mounted) setState(() { rows = data; loading = false; });
    }).catchError((_) {
      if (mounted) setState(() => loading = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final columns = MediaQuery.sizeOf(context).shortestSide >= 600 ? 4 : 2;
    return Scaffold(
      appBar: const ClubAppBar('Records'),
      body: loading
          ? const LoadingView()
          : ListView(
              scrollCacheExtent: pageCacheExtent,
              padding: EdgeInsets.zero,
              children: [
                const PageHero(eyebrow: 'The record book', title: 'Records.', intro: 'The best of the Tigers, season by season.'),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
                  child: rows.isEmpty
                      ? const EmptyPanel(title: 'The record book is open.', message: 'Records will be written as the season is played.')
                      : GridView.count(
                          crossAxisCount: columns,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: 0.9,
                          children: rows
                              .map(
                                (record) => ClubCard(
                                  padding: const EdgeInsets.all(14),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      if (record.category != null) Text(record.category!.toUpperCase(), style: const TextStyle(color: goldLight, fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 1)),
                                      const Spacer(),
                                      GoldText(record.value, style: displayStyle(36), maxLines: 1),
                                      const SizedBox(height: 4),
                                      Text(record.title.toUpperCase(), maxLines: 2, overflow: TextOverflow.ellipsis, style: displayStyle(15, color: Colors.white, height: 1)),
                                      const SizedBox(height: 6),
                                      Text([record.playerName ?? 'United Tigers', if (record.seasonYear != null) '${record.seasonYear}'].join(' · '), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 12)),
                                    ],
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                ),
              ],
            ),
    );
  }
}

class PointsPage extends StatefulWidget {
  const PointsPage({super.key});

  @override
  State<PointsPage> createState() => _PointsPageState();
}

class _PointsPageState extends State<PointsPage> {
  List<PointsRow> rows = [];
  bool loading = true;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    ClubScope.of(context).api.fetchPoints().then((data) {
      if (mounted) setState(() { rows = data; loading = false; });
    }).catchError((_) {
      if (mounted) setState(() => loading = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const ClubAppBar('Points table'),
      body: loading
          ? const LoadingView()
          : ListView(
              scrollCacheExtent: pageCacheExtent,
              padding: EdgeInsets.zero,
              children: [
                const PageHero(eyebrow: 'The league', title: 'Points table.', intro: 'Standings for every franchise, built from completed scorecards and confirmed by the club.'),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
                  child: rows.isEmpty
                      ? const EmptyPanel(title: 'The table appears after completed matches.')
                      : Column(
                          children: rows.map((row) {
                            final ours = row.teamName.toLowerCase().contains('united tigers');
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: ClubCard(
                                highlight: ours,
                                padding: const EdgeInsets.fromLTRB(12, 12, 14, 12),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 34,
                                      height: 34,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(shape: BoxShape.circle, gradient: row.position <= 4 ? goldSurface : null, color: row.position <= 4 ? null : glow),
                                      child: Text('${row.position}', style: TextStyle(fontFamily: display, fontSize: 18, color: row.position <= 4 ? ink : Colors.white)),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(row.teamName.toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, style: displayStyle(18, color: Colors.white)),
                                          const SizedBox(height: 3),
                                          Text('P ${row.played}   W ${row.won}   L ${row.lost}   NRR ${row.netRunRate >= 0 ? '+' : ''}${row.netRunRate.toStringAsFixed(3)}', style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 12, fontWeight: FontWeight.w700)),
                                        ],
                                      ),
                                    ),
                                    Column(children: [GoldText('${row.points}', style: displayStyle(28)), const Text('PTS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1, color: Color(0xFFBDAED0)))]),
                                  ],
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                ),
              ],
            ),
    );
  }
}
