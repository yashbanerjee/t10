import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/pages/fixtures_page.dart';
import 'package:united_tigers/pages/more_pages.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/video.dart';
import 'package:united_tigers/widgets.dart';

/// Opens the brochure the club uploaded in Admin. It is not bundled: the PDF alone would add about 75 MB to the app.
Future<void> openBrochure(BuildContext context, {String? link}) async {
  final api = ClubScope.of(context).api;
  final url = link ?? api.site.brochure;
  if (url == null || url.isEmpty) throw Exception('The brochure is not available right now. Please try again shortly.');
  await openExternal(api.media(url));
}

String _clean(Object reason) => '$reason'.replaceFirst('Exception: ', '');

/// Loads once, then shows loading, error-with-retry or the content.
class _Loader<T> extends StatefulWidget {
  const _Loader({required this.load, required this.builder});
  final Future<T> Function() load;
  final Widget Function(BuildContext context, T value) builder;

  @override
  State<_Loader<T>> createState() => _LoaderState<T>();
}

class _LoaderState<T> extends State<_Loader<T>> {
  late Future<T> future = widget.load();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Padding(
            padding: const EdgeInsets.all(16),
            child: EmptyPanel(title: 'Could not load this page', message: _clean(snapshot.error!), action: 'Try again', onAction: () => setState(() => future = widget.load())),
          );
        }
        if (!snapshot.hasData) return const LoadingView(hero: false, cards: 4);
        return widget.builder(context, snapshot.data as T);
      },
    );
  }
}

class FranchisesPage extends StatefulWidget {
  const FranchisesPage({super.key, this.showPosts = false});

  /// Opens scrolled to the posts, for the home page's "View all".
  final bool showPosts;

  @override
  State<FranchisesPage> createState() => _FranchisesPageState();
}

class _FranchisesPageState extends State<FranchisesPage> {
  final _postsKey = GlobalKey();
  late bool _scrollToPosts = widget.showPosts;

  void _revealPosts() {
    if (!_scrollToPosts) return;
    _scrollToPosts = false;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final target = _postsKey.currentContext;
      if (target != null) Scrollable.ensureVisible(target, duration: const Duration(milliseconds: 600), curve: Curves.easeOutCubic);
    });
  }

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: const ClubAppBar('Our franchises'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: [
          const PageHero(eyebrow: 'About', title: 'Our\nfranchises.', intro: 'The clubs in the group, the league each one plays in, and where to follow them.'),
          _Loader<List<Franchise>>(
            load: api.fetchFranchises,
            builder: (context, franchises) {
              final posts = franchisePostFeed(franchises);
              if (posts.isNotEmpty) _revealPosts();
              return Padding(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
                child: franchises.isEmpty
                    ? const EmptyPanel(title: 'Franchises will be listed here', message: 'Names, logos, leagues and social links are added by the club.')
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          for (final franchise in franchises) _FranchiseCard(franchise: franchise),
                          if (posts.isNotEmpty) ...[
                            SectionTitle('Franchise posts', key: _postsKey),
                            GridView.builder(
                              shrinkWrap: true,
                              padding: EdgeInsets.zero,
                              physics: const NeverScrollableScrollPhysics(),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: 0.8),
                              itemCount: posts.length,
                              itemBuilder: (context, index) => _FranchisePostTile(franchise: posts[index].$1, post: posts[index].$2),
                            ),
                          ],
                        ],
                      ),
              );
            },
          ),
        ],
      ),
    );
  }
}

/// The club's owners, as on the website's Meet the owners page; profiles are edited in the admin panel.
class OwnersPage extends StatelessWidget {
  const OwnersPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: const ClubAppBar('Meet the owners'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: [
          const PageHero(eyebrow: 'The club', title: 'Meet the\nowners.', intro: 'The people behind United Tigers.'),
          _Loader<List<ClubOwner>>(
            load: api.fetchOwners,
            builder: (context, owners) => Padding(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
              child: owners.isEmpty
                  ? const EmptyPanel(title: 'Owner profiles will appear here soon.')
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        for (final owner in owners) Padding(padding: const EdgeInsets.only(bottom: 18), child: _OwnerCard(owner: owner)),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OwnerCard extends StatelessWidget {
  const _OwnerCard({required this.owner});
  final ClubOwner owner;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return ClubCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: AspectRatio(
              aspectRatio: 1,
              child: owner.image == null
                  ? DecoratedBox(
                      decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF460B7D), Color(0xFF2B074D)])),
                      child: FractionallySizedBox(widthFactor: 0.42, child: Image.asset('assets/brand/tiger-gold.png', fit: BoxFit.contain)),
                    )
                  : Image.network(api.media(owner.image), fit: BoxFit.cover, alignment: Alignment.topCenter, errorBuilder: (_, _, _) => const ColoredBox(color: Color(0xFF2B074D))),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(owner.title.toUpperCase(), style: const TextStyle(color: goldLight, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1.4)),
                const SizedBox(height: 6),
                Text(owner.name.toUpperCase(), style: displayStyle(30, color: Colors.white, height: 1)),
                if (owner.facebook != null || owner.instagram != null) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 10,
                    runSpacing: 8,
                    children: [
                      if (owner.facebook != null)
                        _OwnerSocial(
                          icon: FontAwesomeIcons.facebookF,
                          label: 'Facebook',
                          gradient: const LinearGradient(colors: [Color(0xFF1877F2), Color(0xFF1877F2)]),
                          onTap: () => openExternal(owner.facebook!),
                        ),
                      if (owner.instagram != null)
                        _OwnerSocial(
                          icon: FontAwesomeIcons.instagram,
                          label: 'Instagram',
                          gradient: const LinearGradient(begin: Alignment.bottomLeft, end: Alignment.topRight, colors: [Color(0xFFFDC468), Color(0xFFFD5949), Color(0xFFD6249F), Color(0xFF285AEB)]),
                          onTap: () => openExternal(owner.instagram!),
                        ),
                    ],
                  ),
                ],
                if (owner.headline != null) ...[
                  const SizedBox(height: 10),
                  Text(owner.headline!, style: const TextStyle(color: goldLight, fontSize: 15.5, fontWeight: FontWeight.w800, height: 1.35)),
                ],
                if (owner.summary != null) ...[
                  const SizedBox(height: 10),
                  Text(owner.summary!, style: const TextStyle(color: Color(0xFFE9E1F2), fontSize: 15.5, height: 1.55)),
                ],
                const SizedBox(height: 6),
                if (owner.bio != null)
                  ClubMarkdown(owner.bio!, mediaUrl: api.media, onLink: (href) => openSiteLink(context, href))
                else
                  const Padding(padding: EdgeInsets.only(top: 6), child: Text('A full profile is coming soon.', style: TextStyle(color: Color(0xFFCDBFDD)))),
                if (owner.quote != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.only(left: 14),
                    decoration: const BoxDecoration(border: Border(left: BorderSide(color: goldLight, width: 3))),
                    child: Text(owner.quote!.toUpperCase(), style: displayStyle(22, color: const Color(0xFFF3ECD9), height: 1.15)),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

const _staffAreas = [
  ('LEADERSHIP', 'Club leadership'),
  ('MANAGEMENT', 'Operations & team management'),
  ('COACHING', 'Coaching staff'),
  ('SUPPORT', 'Medical & support'),
  ('MEDIA', 'Media & content'),
];

class ManagementPage extends StatelessWidget {
  const ManagementPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: const ClubAppBar('Team management'),
      body: AnimatedBuilder(
        animation: api,
        builder: (context, _) {
          final staff = api.catalog.staff;
          final known = _staffAreas.map((area) => area.$1).toSet();
          final sections = [
            for (final (key, title) in _staffAreas) (title, staff.where((member) => member.category.toUpperCase() == key).toList()),
            ('Club staff', staff.where((member) => !known.contains(member.category.toUpperCase())).toList()),
          ].where((section) => section.$2.isNotEmpty).toList();
          return RefreshIndicator(
            color: pink,
            onRefresh: api.refresh,
            child: ListView(
              scrollCacheExtent: pageCacheExtent,
              padding: EdgeInsets.only(bottom: 28 + navClearance(context)),
              children: [
                const PageHero(eyebrow: 'United Tigers · 2026', title: 'Team\nmanagement.', intro: 'The leadership, coaches, support and media staff working behind the Tigers.'),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
                  child: sections.isEmpty
                      ? const Padding(padding: EdgeInsets.only(top: 14), child: EmptyPanel(title: 'Team management is coming', message: 'The club’s management team will be shared here soon.'))
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            for (final (title, members) in sections) ...[
                              SectionTitle(title),
                              for (final member in members) Padding(padding: const EdgeInsets.only(bottom: 10), child: _StaffCard(member: member)),
                            ],
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

class _StaffCard extends StatelessWidget {
  const _StaffCard({required this.member});
  final StaffMember member;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final size = 84 * clubScale(context);
    return ClubCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: SizedBox(
              width: size,
              height: size,
              child: member.profileImage == null
                  ? DecoratedBox(
                      decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF460B7D), Color(0xFF2B074D)])),
                      child: Padding(padding: const EdgeInsets.all(16), child: Opacity(opacity: 0.7, child: Image.asset('assets/brand/tiger-gold.png', fit: BoxFit.contain))),
                    )
                  : Image.network(api.media(member.profileImage), fit: BoxFit.cover, alignment: Alignment.topCenter, errorBuilder: (_, _, _) => const ColoredBox(color: Color(0xFF2B074D))),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(member.title.toUpperCase(), style: const TextStyle(color: goldLight, fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 1)),
                const SizedBox(height: 2),
                Text(member.fullName.toUpperCase(), style: displayStyle(20, color: Colors.white, height: 1.05)),
                if (member.bio != null) ...[const SizedBox(height: 6), Text(member.bio!, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 12.5))],
                if (member.facebook != null || member.instagram != null) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      if (member.facebook != null)
                        _OwnerSocial(
                          icon: FontAwesomeIcons.facebookF,
                          label: 'Facebook',
                          gradient: const LinearGradient(colors: [Color(0xFF1877F2), Color(0xFF1877F2)]),
                          onTap: () => openExternal(member.facebook!),
                        ),
                      if (member.instagram != null)
                        _OwnerSocial(
                          icon: FontAwesomeIcons.instagram,
                          label: 'Instagram',
                          gradient: const LinearGradient(begin: Alignment.bottomLeft, end: Alignment.topRight, colors: [Color(0xFFFDC468), Color(0xFFFD5949), Color(0xFFD6249F), Color(0xFF285AEB)]),
                          onTap: () => openExternal(member.instagram!),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OwnerSocial extends StatelessWidget {
  const _OwnerSocial({required this.icon, required this.label, required this.gradient, required this.onTap});
  final FaIconData icon;
  final String label;
  final Gradient gradient;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: Pressable(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(gradient: gradient, borderRadius: BorderRadius.circular(999)),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              FaIcon(icon, size: 14, color: Colors.white),
              const SizedBox(width: 8),
              Text(label.toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 0.8)),
            ],
          ),
        ),
      ),
    );
  }
}

/// A post cover with its platform in the top-right corner; tapping opens the post in its app or the browser.
class _FranchisePostTile extends StatelessWidget {
  const _FranchisePostTile({required this.franchise, required this.post});
  final Franchise franchise;
  final FranchisePost post;

  static (FaIconData, Gradient) _platform(String platform) => switch (platform) {
        'INSTAGRAM' => (FontAwesomeIcons.instagram, const LinearGradient(begin: Alignment.bottomLeft, end: Alignment.topRight, colors: [Color(0xFFFDC468), Color(0xFFFD5949), Color(0xFFD6249F), Color(0xFF285AEB)])),
        'FACEBOOK' => (FontAwesomeIcons.facebookF, const LinearGradient(colors: [Color(0xFF1877F2), Color(0xFF1877F2)])),
        'YOUTUBE' => (FontAwesomeIcons.youtube, const LinearGradient(colors: [Color(0xFFFF0000), Color(0xFFFF0000)])),
        'X' => (FontAwesomeIcons.xTwitter, const LinearGradient(colors: [Color(0xFF111111), Color(0xFF111111)])),
        'TIKTOK' => (FontAwesomeIcons.tiktok, const LinearGradient(colors: [Color(0xFF111111), Color(0xFF111111)])),
        'THREADS' => (FontAwesomeIcons.threads, const LinearGradient(colors: [Color(0xFF111111), Color(0xFF111111)])),
        'LINKEDIN' => (FontAwesomeIcons.linkedinIn, const LinearGradient(colors: [Color(0xFF0A66C2), Color(0xFF0A66C2)])),
        _ => (FontAwesomeIcons.link, const LinearGradient(colors: [Color(0xFF111111), Color(0xFF111111)])),
      };

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final (icon, badge) = _platform(post.platform);
    return Reveal(
      scale: 0.92,
      fade: false,
      child: Pressable(
        onTap: () => openExternal(post.url),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: DecoratedBox(
            position: DecorationPosition.foreground,
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: gold.withValues(alpha: 0.35))),
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (post.imageUrl != null)
                  RemoteImage(api.media(post.imageUrl), height: double.infinity, radius: 0)
                else
                  DecoratedBox(
                    decoration: const BoxDecoration(gradient: RadialGradient(colors: [Color(0xFF3A0968), Color(0xFF1B0431)])),
                    child: Center(child: FaIcon(icon, size: 30, color: goldLight.withValues(alpha: 0.6))),
                  ),
                const DecoratedBox(
                  decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0x590A0214), Colors.transparent, Colors.transparent, Color(0xC70A0214)], stops: [0, 0.32, 0.6, 1])),
                ),
                Positioned(
                  top: 7,
                  right: 7,
                  child: Container(
                    width: 26,
                    height: 26,
                    decoration: BoxDecoration(gradient: badge, borderRadius: BorderRadius.circular(8), boxShadow: const [BoxShadow(color: Color(0x66000000), blurRadius: 6, offset: Offset(0, 2))]),
                    alignment: Alignment.center,
                    child: FaIcon(icon, size: 14, color: Colors.white),
                  ),
                ),
                Positioned(
                  left: 8,
                  right: 8,
                  bottom: 9,
                  child: Row(
                    children: [
                      if (post.isVideo) ...[
                        Container(
                          width: 26,
                          height: 26,
                          decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0x8C0A0214), border: Border.all(color: Colors.white.withValues(alpha: 0.5))),
                          alignment: Alignment.center,
                          child: const Padding(padding: EdgeInsets.only(left: 2), child: FaIcon(FontAwesomeIcons.play, size: 10, color: Colors.white)),
                        ),
                        const SizedBox(width: 6),
                      ],
                      Expanded(
                        child: Text(franchise.name.toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.right, style: displayStyle(13, color: Colors.white, height: 1.1)),
                      ),
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

class _FranchiseCard extends StatelessWidget {
  const _FranchiseCard({required this.franchise});
  final Franchise franchise;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: ClubCard(
        highlight: franchise.isHome,
        child: Row(
          children: [
            _FranchiseCrest(franchise: franchise, size: 76),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (franchise.isHome) const Padding(padding: EdgeInsets.only(bottom: 4), child: StatusChip('OUR CLUB')),
                  Text(franchise.league.toUpperCase(), style: const TextStyle(color: goldLight, fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 0.9)),
                  Text(franchise.name.toUpperCase(), style: displayStyle(21, color: Colors.white, height: 1.05)),
                  if (franchise.channels.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: _FranchiseSocials(franchise: franchise)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FranchiseCrest extends StatelessWidget {
  const _FranchiseCrest({required this.franchise, required this.size});
  final Franchise franchise;
  final double size;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final box = size * clubScale(context);
    final initials = franchise.name.split(RegExp(r'\s+')).where((part) => part.isNotEmpty).take(2).map((part) => part[0]).join().toUpperCase();
    final fallback = Text(initials, style: displayStyle(size * 0.32, color: franchise.isHome ? ink : Colors.white));
    return Container(
      width: box,
      height: box,
      padding: EdgeInsets.all(box * 0.1),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: franchise.isHome ? goldSurface : const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF6A1290), Color(0xFF2A0750)]),
        border: Border.all(color: gold.withValues(alpha: 0.5)),
        boxShadow: [BoxShadow(color: (franchise.isHome ? gold : pink).withValues(alpha: 0.3), blurRadius: 16)],
      ),
      alignment: Alignment.center,
      child: franchise.logoUrl == null ? fallback : ClipOval(child: Image.network(api.media(franchise.logoUrl), fit: BoxFit.contain, errorBuilder: (_, _, _) => fallback)),
    );
  }
}

class _FranchiseSocials extends StatelessWidget {
  const _FranchiseSocials({required this.franchise, this.size = 16});
  final Franchise franchise;
  final double size;

  static FaIconData _icon(String label) => switch (label) {
        'Facebook' => FontAwesomeIcons.facebookF,
        'Instagram' => FontAwesomeIcons.instagram,
        'YouTube' => FontAwesomeIcons.youtube,
        'X' => FontAwesomeIcons.xTwitter,
        _ => FontAwesomeIcons.at,
      };

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        for (final (label, href) in franchise.channels)
          Tooltip(
            message: '${franchise.name} on $label',
            child: Material(
              color: purple.withValues(alpha: 0.7),
              shape: CircleBorder(side: BorderSide(color: gold.withValues(alpha: 0.4))),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: () => openExternal(href),
                child: SizedBox.square(dimension: size + 18, child: Center(child: FaIcon(_icon(label), size: size, color: goldLight))),
              ),
            ),
          ),
      ],
    );
  }
}

/// Home-page "Our franchises" board: our club in a wide lead card, the rest in a two-column grid.
/// Stays hidden until franchises load, so a missing endpoint never shows an error on the home page.
class HomeFranchises extends StatefulWidget {
  const HomeFranchises({super.key});

  @override
  State<HomeFranchises> createState() => _HomeFranchisesState();
}

class _HomeFranchisesState extends State<HomeFranchises> {
  Future<List<Franchise>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= ClubScope.of(context).api.fetchFranchises();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Franchise>>(
      future: _future,
      builder: (context, snapshot) {
        final franchises = snapshot.data ?? const <Franchise>[];
        if (franchises.isEmpty) return const SizedBox.shrink();
        final home = franchises.where((item) => item.isHome).toList();
        final others = franchises.where((item) => !item.isHome).toList();
        final posts = franchisePostFeed(franchises).take(10).toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SectionTitle('Our franchises', action: 'About', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FranchisesPage()))),
            for (final franchise in home) _FranchiseCard(franchise: franchise),
            for (final (index, franchise) in others.indexed)
              Padding(
                padding: EdgeInsets.only(bottom: index + 1 < others.length ? 10 : 0),
                child: _FranchiseTile(franchise: franchise, index: index),
              ),
            if (posts.isNotEmpty) ...[
              SectionTitle('Franchise posts', action: 'View all', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FranchisesPage(showPosts: true)))),
              SizedBox(
                height: 190,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  clipBehavior: Clip.none,
                  itemCount: posts.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 10),
                  itemBuilder: (context, index) => SizedBox(width: 152, child: _FranchisePostTile(franchise: posts[index].$1, post: posts[index].$2)),
                ),
              ),
            ],
          ],
        );
      },
    );
  }
}

class _FranchiseTile extends StatelessWidget {
  const _FranchiseTile({required this.franchise, required this.index});
  final Franchise franchise;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Reveal(
      delay: Duration(milliseconds: 50 * (index % 3)),
      child: GlowFrame(
        radius: 16,
        width: 1.2,
        colors: softRim,
        bloom: 0.3,
        offset: index * 0.19,
        child: Container(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          decoration: const BoxDecoration(
            gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xEB33085E), Color(0xEB2A0750), Color(0xEB4B0C66)]),
          ),
          child: Row(
            children: [
              _FranchiseCrest(franchise: franchise, size: 58),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(franchise.league.toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: goldLight, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
                    const SizedBox(height: 2),
                    Text(franchise.name.toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, style: displayStyle(18, color: Colors.white, height: 1.05)),
                    if (franchise.channels.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      _FranchiseSocials(franchise: franchise, size: 11),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Home-page "Partner with us" panel, matching the website: brochure cover, pitch and the two ways in.
class HomePartnerCta extends StatelessWidget {
  const HomePartnerCta({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    void open() => Navigator.push(context, MaterialPageRoute(builder: (_) => const BecomePartnerPage()));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionTitle('Partner with us'),
        Reveal(
          child: GlowFrame(
            radius: 20,
            width: 1.8,
            offset: 0.3,
            child: DecoratedBox(
              decoration: const BoxDecoration(
                gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF3A0A66), Color(0xFF2A0750), Color(0xFF5A0F6E)]),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  AspectRatio(
                    aspectRatio: 900 / 506,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        Pressable(
                          onTap: open,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              RemoteImage(api.media('/brand/partner-brochure-cover.webp'), height: double.infinity, radius: 0),
                              const DecoratedBox(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0x00000000), Color(0x00000000), Color(0xCC1C0432)], stops: [0, 0.55, 1]),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Positioned(left: 12, bottom: 12, child: _GetBrochureButton()),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        SheenText("LET'S MAKE A MARK.", style: displayStyle(28)),
                        const SizedBox(height: 8),
                        const Text(
                          'Put your brand alongside United Tigers in cricket’s fastest format. Get the brochure, or leave your details and our partnerships team will contact you.',
                          style: TextStyle(color: Color(0xFFE6DDF0), height: 1.45),
                        ),
                        const SizedBox(height: 14),
                        FilledButton.icon(style: goldButtonStyle(), onPressed: open, icon: const FaIcon(FontAwesomeIcons.handshake, size: 16), label: const Text('BECOME A PARTNER')),
                        const SizedBox(height: 10),
                        OutlinedButton(
                          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PartnersPage())),
                          child: const Text('MEET OUR PARTNERS'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Bottom-left control on the brochure cover. Opens the club's brochure PDF.
class _GetBrochureButton extends StatefulWidget {
  const _GetBrochureButton();

  @override
  State<_GetBrochureButton> createState() => _GetBrochureButtonState();
}

class _GetBrochureButtonState extends State<_GetBrochureButton> {
  bool busy = false;

  Future<void> _open() async {
    if (busy) return;
    setState(() => busy = true);
    try {
      await openBrochure(context);
    } catch (reason) {
      if (mounted) await showClubMessage(context, _clean(reason));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _open,
      child: Floating(
        distance: 3,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            gradient: goldSurface,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: const Color(0xFFEEC873).withValues(alpha: 0.45), blurRadius: 14)],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (busy)
                const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: ink))
              else
                const FaIcon(FontAwesomeIcons.download, size: 12, color: ink),
              const SizedBox(width: 7),
              const Text('GET THE BROCHURE', style: TextStyle(color: ink, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.9)),
            ],
          ),
        ),
      ),
    );
  }
}

const _dialCodes = ['+971', '+92', '+91', '+880', '+94', '+93', '+966', '+974', '+968', '+965', '+973', '+977', '+20', '+63', '+44', '+1', '+61', '+27', '+64'];

class BecomePartnerPage extends StatefulWidget {
  const BecomePartnerPage({super.key});

  @override
  State<BecomePartnerPage> createState() => _BecomePartnerPageState();
}

class _BecomePartnerPageState extends State<BecomePartnerPage> {
  final name = TextEditingController();
  final email = TextEditingController();
  final mobile = TextEditingController();
  String dial = _dialCodes.first;
  bool busy = false;
  bool sent = false;

  static const points = [
    ('On the website', 'Your brand sits with the club across the public site, from the partners page to match coverage.'),
    ('On match days', 'Partnership conversations cover the Abu Dhabi T10 season, the fastest format in the game.'),
    ('With the fans', 'United Tigers tell the season on the site and on the club’s social channels.'),
    ('The brochure', 'Send your name, email and mobile number. The brochure opens here, and a copy of the request goes to your inbox and to the club.'),
  ];

  @override
  void dispose() {
    for (final field in [name, email, mobile]) {
      field.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    final digits = mobile.text.replaceAll(RegExp(r'\D'), '');
    if (name.text.trim().length < 2 || !email.text.contains('@') || digits.length < 6 || digits.length > 14) {
      await showClubMessage(context, 'Enter your name, a valid email and your mobile number.');
      return;
    }
    setState(() => busy = true);
    try {
      final link = await ClubScope.of(context).api.requestPartnerBrochure({'name': name.text.trim(), 'email': email.text.trim(), 'phone': '$dial $digits'});
      if (!mounted) return;
      setState(() => sent = true);
      try {
        await openBrochure(context, link: link);
      } catch (reason) {
        if (mounted) await showClubMessage(context, _clean(reason));
      }
    } catch (reason) {
      if (mounted) await showClubMessage(context, _clean(reason));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const ClubAppBar('Become a partner'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: [
          const PageHero(eyebrow: 'Build with the Tigers', title: 'Become a\npartner.', intro: 'United Tigers are building a platform for ambitious partners in cricket’s fastest format. Tell us who you are and take the brochure with you.'),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SectionTitle('A season with the club'),
                for (final (label, text) in points)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: ClubCard(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Eyebrow(label), const SizedBox(height: 6), Text(text, style: const TextStyle(color: Color(0xFFE6DDF0), height: 1.45))]),
                    ),
                  ),
                const SectionTitle('Get the brochure'),
                if (sent)
                  ClubCard(
                    highlight: true,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        GoldText('THANK YOU.', style: displayStyle(28)),
                        const SizedBox(height: 6),
                        const Text('Our partnerships team has your details and will be in touch. A copy is on its way to your inbox.', style: TextStyle(color: Color(0xFFE6DDF0), height: 1.45)),
                        const SizedBox(height: 12),
                        FilledButton.icon(
                          style: goldButtonStyle(),
                          onPressed: () async {
                            try {
                              await openBrochure(context);
                            } catch (reason) {
                              if (context.mounted) await showClubMessage(context, _clean(reason));
                            }
                          },
                          icon: const FaIcon(FontAwesomeIcons.filePdf, size: 17),
                          label: const Text('OPEN BROCHURE'),
                        ),
                      ],
                    ),
                  )
                else ...[
                  ClubField(label: 'Your name', controller: name),
                  ClubField(label: 'Email address', controller: email, email: true),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: 56,
                        margin: const EdgeInsets.only(right: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(color: const Color(0x8C2B074D), borderRadius: BorderRadius.circular(14), border: Border.all(color: gold.withValues(alpha: 0.3))),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: dial,
                            dropdownColor: purple,
                            iconEnabledColor: goldLight,
                            style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white),
                            items: [for (final code in _dialCodes) DropdownMenuItem(value: code, child: Text(code))],
                            onChanged: (value) => setState(() => dial = value ?? dial),
                          ),
                        ),
                      ),
                      Expanded(child: ClubField(label: 'Mobile number', controller: mobile, phone: true)),
                    ],
                  ),
                  FilledButton(style: goldButtonStyle(), onPressed: busy ? null : _submit, child: Text(busy ? 'SENDING…' : 'GET THE BROCHURE')),
                ],
                const SizedBox(height: 14),
                OutlinedButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PartnersPage())), child: const Text('MEET OUR PARTNERS')),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class DraftPage extends StatelessWidget {
  const DraftPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final items = api.catalog.gallery.where((item) => (item.category ?? '').toLowerCase().contains('draft')).toList();
    final videos = items.where((item) => item.isVideo).toList();
    final photos = items.where((item) => !item.isVideo).toList();
    final columns = MediaQuery.sizeOf(context).shortestSide >= 600 ? 4 : 2;
    Widget grid(List<GalleryItem> list) => GridView.count(
          crossAxisCount: columns,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.8,
          children: [for (final item in list) _MediaTile(item: item, group: list)],
        );
    return Scaffold(
      appBar: const ClubAppBar('Player draft'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: [
          const PageHero(eyebrow: 'Recent activity', title: 'Player\ndraft.', intro: 'The night the squad came together. Watch the draft, then look through the room.'),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
            child: items.isEmpty
                ? const Padding(padding: EdgeInsets.only(top: 14), child: EmptyPanel(title: 'Draft night is on its way', message: 'Videos and photos from the player draft will appear here once they are published.'))
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (videos.isNotEmpty) ...[SectionTitle('Videos · ${videos.length}'), grid(videos)],
                      if (photos.isNotEmpty) ...[SectionTitle('Photos · ${photos.length}'), grid(photos)],
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _MediaTile extends StatelessWidget {
  const _MediaTile({required this.item, required this.group});
  final GalleryItem item;
  final List<GalleryItem> group;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final url = api.media(item.mediaUrl);
    return Reveal(
      scale: 0.92,
      fade: false,
      child: Pressable(
        onTap: () => openGallery(context, group, item, api.media),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (item.isVideo) VideoThumb(url) else RemoteImage(url, height: 200, radius: 0),
              const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Color(0xD91C0432)], stops: [0.5, 1]))),
              if (item.isVideo) const Center(child: FaIcon(FontAwesomeIcons.circlePlay, color: goldLight, size: 40)),
              Positioned(left: 8, top: 8, child: MediaBadge(label: item.isVideo ? 'VIDEO' : 'PHOTO')),
              Positioned(left: 10, right: 10, bottom: 10, child: Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13))),
            ],
          ),
        ),
      ),
    );
  }
}

class SeasonPage extends StatelessWidget {
  const SeasonPage({super.key, this.year = 2026});
  final int year;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final matches = api.catalog.matches.where((match) => match.date?.year == year).toList();
    final completed = matches.where((match) => match.isCompleted).toList();
    final wins = completed.where((match) => match.won).length;
    String figure(String value) => completed.isEmpty ? '–' : value;
    return Scaffold(
      appBar: ClubAppBar('$year season'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: [
          PageHero(eyebrow: 'Season overview', title: '$year\nseason.', intro: 'One team. A brand-new chapter. Follow the United Tigers across every match of the $year Abu Dhabi T10 season.'),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 1.5,
                  children: [
                    _SeasonStat('Played', figure('${completed.length}'), highlight: true),
                    _SeasonStat('Wins', figure('$wins')),
                    _SeasonStat('Losses', figure('${completed.length - wins}')),
                    _SeasonStat('Win rate', figure('${completed.isEmpty ? 0 : (wins / completed.length * 100).round()}%')),
                  ],
                ),
                SectionTitle('Season leaders', action: 'Full stats', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StatsPage()))),
                _Loader<(List<PlayerStat>, List<PointsRow>)>(
                  load: () async => (await api.fetchStats(), await api.fetchPoints().catchError((_) => <PointsRow>[])),
                  builder: (context, data) {
                    final (stats, table) = data;
                    final batter = [...stats]..sort((a, b) => b.runs.compareTo(a.runs));
                    final bowler = [...stats]..sort((a, b) => b.wickets.compareTo(a.wickets));
                    final ours = table.where((row) => row.teamName == 'United Tigers').firstOrNull;
                    final topBat = batter.firstOrNull;
                    final topBowl = bowler.firstOrNull;
                    return Column(
                      children: [
                        _LeaderRow('Top batter', topBat == null || topBat.runs == 0 ? '–' : '${topBat.runs}', topBat == null || topBat.runs == 0 ? 'Scorecards to come' : '${topBat.name} · runs'),
                        _LeaderRow('Top bowler', topBowl == null || topBowl.wickets == 0 ? '–' : '${topBowl.wickets}', topBowl == null || topBowl.wickets == 0 ? 'Scorecards to come' : '${topBowl.name} · wickets'),
                        _LeaderRow('Points', ours == null ? '–' : '${ours.points}', ours == null ? 'League table pending' : 'Position ${ours.position}'),
                      ],
                    );
                  },
                ),
                const SectionTitle('Fixtures & results'),
                if (matches.isEmpty)
                  const EmptyPanel(title: 'Fixture list pending', message: 'This page will update as official fixtures and results are added.')
                else
                  for (final match in matches)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: ClubCard(
                        onTap: () => openMatch(context, match),
                        child: Row(
                          children: [
                            StatusChip(match.statusLabel),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text((match.knockoutSides == null ? 'vs ${match.opponent}' : match.title).toUpperCase(), style: displayStyle(17, color: Colors.white)),
                                  Text(when(match.date), style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 12)),
                                  if (match.result != null) Text(match.result!, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5)),
                                ],
                              ),
                            ),
                            const FaIcon(FontAwesomeIcons.chevronRight, color: goldLight, size: 14),
                          ],
                        ),
                      ),
                    ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SeasonStat extends StatelessWidget {
  const _SeasonStat(this.label, this.value, {this.highlight = false});
  final String label;
  final String value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Reveal(
      scale: 0.88,
      child: GlowFrame(
        radius: 18,
        width: highlight ? 1.8 : 1.2,
        colors: highlight ? neonGold : softRim,
        bloom: highlight ? 0.7 : 0.3,
        offset: label.length * 0.11,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: highlight ? accentGradient : const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xEB33085E), Color(0xEB4B0C66)]),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label.toUpperCase(), style: const TextStyle(color: Color(0xFFE6DDF0), fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.9)),
              CountUp(value, builder: (text) => GoldText(text, style: displayStyle(36))),
            ],
          ),
        ),
      ),
    );
  }
}

class _LeaderRow extends StatelessWidget {
  const _LeaderRow(this.label, this.value, this.detail);
  final String label;
  final String value;
  final String detail;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: ClubCard(
        child: Row(
          children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Eyebrow(label), const SizedBox(height: 4), Text(detail, style: const TextStyle(fontWeight: FontWeight.w700))])),
            GoldText(value, style: displayStyle(34)),
          ],
        ),
      ),
    );
  }
}

class TrackOrderPage extends StatefulWidget {
  const TrackOrderPage({super.key, this.number, this.email});
  final String? number;
  final String? email;

  @override
  State<TrackOrderPage> createState() => _TrackOrderPageState();
}

class _TrackOrderPageState extends State<TrackOrderPage> {
  late final number = TextEditingController(text: widget.number);
  late final email = TextEditingController(text: widget.email);
  TrackedOrder? order;
  String? error;
  bool busy = false;

  static const _copy = {
    'PENDING': ('Booked', 'Your items are held while the payment is completed. If you have paid, this updates shortly.'),
    'CONFIRMED': ('Confirmed', 'Payment received. The club will be in touch to hand over or deliver your kit.'),
    'CANCELLED': ('Cancelled', 'This booking was cancelled. Get in touch with the club if you think this is a mistake.'),
  };

  @override
  void initState() {
    super.initState();
    if ((widget.number ?? '').isNotEmpty && (widget.email ?? '').contains('@')) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _track();
      });
    }
  }

  @override
  void dispose() {
    number.dispose();
    email.dispose();
    super.dispose();
  }

  Future<void> _track() async {
    final code = number.text.trim().toUpperCase();
    if (code.length < 3 || !email.text.contains('@')) {
      setState(() => error = 'Enter your tracking number and the email you booked with.');
      return;
    }
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final found = await ClubScope.of(context).api.trackOrder(code, email.text.trim());
      if (mounted) setState(() => order = found);
    } catch (reason) {
      if (mounted) {
        setState(() {
          order = null;
          error = _clean(reason);
        });
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final current = order;
    return Scaffold(
      appBar: const ClubAppBar('Track your booking'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: [
          const PageHero(eyebrow: 'Official kit', title: 'Track your\nbooking.', intro: 'Enter the tracking number from your confirmation email and the email you booked with.'),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ClubField(label: 'Tracking number (UT-XXXXXXXX)', controller: number),
                ClubField(label: 'Email address', controller: email, email: true),
                FilledButton(style: goldButtonStyle(), onPressed: busy ? null : _track, child: Text(busy ? 'CHECKING…' : 'TRACK BOOKING')),
                if (error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(error!, style: const TextStyle(color: Color(0xFFFFB4C8), fontWeight: FontWeight.w700))),
                if (current != null) ...[const SizedBox(height: 18), _TrackedCard(order: current, copy: _copy[current.status] ?? _copy['PENDING']!)],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TrackedCard extends StatelessWidget {
  const _TrackedCard({required this.order, required this.copy});
  final TrackedOrder order;
  final (String, String) copy;

  @override
  Widget build(BuildContext context) {
    final cancelled = order.status == 'CANCELLED';
    final steps = cancelled ? ['Booked', 'Cancelled'] : ['Booked', 'Confirmed'];
    final reached = order.status == 'PENDING' ? 0 : 1;
    return ClubCard(
      highlight: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [Expanded(child: Eyebrow(order.number)), StatusChip(order.paymentStatus == 'PAID' ? 'PAID' : order.paymentStatus)]),
          const SizedBox(height: 8),
          GoldText(copy.$1.toUpperCase(), style: displayStyle(34)),
          const SizedBox(height: 4),
          Text(copy.$2, style: const TextStyle(color: Color(0xFFE6DDF0), height: 1.45)),
          const SizedBox(height: 14),
          Row(
            children: [
              for (var i = 0; i < steps.length; i++) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(borderRadius: BorderRadius.circular(999), gradient: i <= reached ? (cancelled && i == 1 ? accentGradient : goldSurface) : null, border: Border.all(color: gold.withValues(alpha: 0.4))),
                  child: Text(steps[i].toUpperCase(), style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11.5, color: i <= reached ? (cancelled && i == 1 ? Colors.white : ink) : const Color(0xFFBDAED0))),
                ),
                if (i < steps.length - 1) Expanded(child: Container(height: 2, margin: const EdgeInsets.symmetric(horizontal: 6), decoration: BoxDecoration(gradient: reached > i ? collarGradient : null, color: reached > i ? null : gold.withValues(alpha: 0.25)))),
              ],
            ],
          ),
          const Divider(height: 28),
          for (final item in order.items)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(item.productName, style: const TextStyle(fontWeight: FontWeight.w800)), Text('${variantLabel(item.color, item.size)} · ×${item.quantity}', style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 12.5))])),
                  Text(money(item.unitPrice * item.quantity), style: const TextStyle(fontWeight: FontWeight.w800)),
                ],
              ),
            ),
          Row(children: [const Expanded(child: Eyebrow('Total')), GoldText(money(order.total), style: displayStyle(26))]),
          const SizedBox(height: 6),
          Text(['Booked ${when(order.createdAt)}', if (order.city != null) 'for ${[order.city, order.country].whereType<String>().join(', ')}'].join(' '), style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 12.5)),
        ],
      ),
    );
  }
}
