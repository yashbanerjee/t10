import 'package:flutter/material.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/services/analytics.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/widgets.dart';

class TeamPage extends StatelessWidget {
  const TeamPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return AnimatedBuilder(
      animation: api,
      builder: (context, _) {
        return Scaffold(
          appBar: const ClubAppBar('The squad'),
          body: RefreshIndicator(
            color: pink,
            onRefresh: api.refresh,
            child: CustomScrollView(
              scrollCacheExtent: pageCacheExtent,
              slivers: [
                const SliverToBoxAdapter(
                  child: PageHero(
                    eyebrow: 'Abu Dhabi T10 · 2026',
                    title: 'Meet our\nTigers.',
                    intro: 'The names announced for the Tigers’ first season.',
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
                  sliver: SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: 0.66,
                        ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) =>
                          _PlayerCard(player: api.catalog.players[index]),
                      childCount: api.catalog.players.length,
                    ),
                  ),
                ),
                // Keep staff entirely API-driven, but render each CMS category
                // in its own section to match the website.
                ..._staffSections(api.catalog.staff).map(
                  (section) => SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                    sliver: SliverList.list(
                      children: [
                        SectionTitle(section.label),
                        ...section.members.map(
                          (member) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: ClubCard(
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  SizedBox(
                                    width: 68,
                                    height: 68,
                                    child: RemoteImage(
                                      api.media(member.profileImage),
                                      height: 68,
                                      radius: 34,
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          member.category.toUpperCase(),
                                          style: const TextStyle(
                                            color: goldLight,
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: 1,
                                          ),
                                        ),
                                        Text(
                                          member.fullName.toUpperCase(),
                                          style: displayStyle(
                                            20,
                                            color: Colors.white,
                                          ),
                                        ),
                                        Text(
                                          member.title,
                                          style: const TextStyle(
                                            color: Color(0xFFD9CCE6),
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                        if (member.bio != null &&
                                            member.bio!.trim().isNotEmpty) ...[
                                          const SizedBox(height: 6),
                                          Text(
                                            member.bio!,
                                            maxLines: 3,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              color: Color(0xFFBDAED0),
                                              fontSize: 12.5,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (api.catalog.staff.isEmpty)
                  const SliverToBoxAdapter(child: SizedBox(height: 28)),
                SliverToBoxAdapter(
                  child: SizedBox(height: navClearance(context)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// A display group derived from staff category values returned by the API.
class _StaffSection {
  const _StaffSection(this.label, this.members);

  final String label;
  final List<dynamic> members;
}

/// Maps API categories to the website's section headings without hardcoding
/// staff names or staff content. Unknown categories remain visible under
/// "Other Staff" instead of being silently discarded.
List<_StaffSection> _staffSections(List<dynamic> staff) {
  final coaching = <dynamic>[];
  final support = <dynamic>[];
  final management = <dynamic>[];
  final other = <dynamic>[];

  for (final member in staff) {
    final category = member.category.trim().toLowerCase();
    if (category.contains('coach')) {
      coaching.add(member);
    } else if (category.contains('support') || category == 'staff') {
      support.add(member);
    } else if (category.contains('management') ||
        category.contains('manager') ||
        category.contains('leadership')) {
      management.add(member);
    } else {
      other.add(member);
    }
  }

  return [
    if (coaching.isNotEmpty) _StaffSection('Coaching Staff', coaching),
    if (support.isNotEmpty) _StaffSection('Support Staff', support),
    if (management.isNotEmpty) _StaffSection('Management', management),
    if (other.isNotEmpty) _StaffSection('Other Staff', other),
  ];
}

class _PlayerCard extends StatelessWidget {
  const _PlayerCard({required this.player});
  final Player player;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final special =
        player.isCaptain || player.isViceCaptain || player.isIconPlayer;
    return ClubCard(
      padding: EdgeInsets.zero,
      highlight: special,
      onTap: () => openPlayer(context, player),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(15),
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Color(0xFF8A1BA6),
                          Color(0xFF4B0C66),
                          Color(0xFF2A0750),
                        ],
                      ),
                    ),
                  ),
                  RemoteImage(
                    api.media(player.profileImage),
                    height: 200,
                    radius: 0,
                  ),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Color(0xE61C0432)],
                        stops: [0.55, 1],
                      ),
                    ),
                  ),
                  Positioned(
                    right: 10,
                    top: 6,
                    child: GoldText(
                      '${player.jerseyNumber ?? 'UT'}',
                      style: displayStyle(30),
                    ),
                  ),
                  if (special)
                    Positioned(
                      left: 8,
                      top: 8,
                      child: MediaBadge(label: player.badge),
                    ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  player.fullName.toUpperCase(),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: displayStyle(17, color: Colors.white, height: 1),
                ),
                const SizedBox(height: 4),
                Text(
                  roleLabel(player.role),
                  style: const TextStyle(
                    color: goldLight,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.6,
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

String _rate(double? value) => value == null ? '–' : value.toStringAsFixed(2);

class _StatsBlock extends StatelessWidget {
  const _StatsBlock(this.label, this.stats);
  final String label;
  final CricketStats stats;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionTitle(label),
        _FigureGrid(
          figures: [
            ('Matches', '${stats.matches}'),
            ('Runs', '${stats.runs}'),
            ('Wickets', '${stats.wickets}'),
            ('High score', '${stats.highestScore}'),
            ('Average', _rate(stats.average)),
            ('Strike rate', _rate(stats.strikeRate)),
            ('Economy', _rate(stats.economy)),
            ('Best', stats.bestBowling ?? '–'),
            ('Fours', '${stats.fours}'),
            ('Sixes', '${stats.sixes}'),
            ('Catches', '${stats.catches}'),
            ('Overs', stats.bowlingOvers ?? '–'),
          ],
        ),
      ],
    );
  }
}

class _FigureGrid extends StatelessWidget {
  const _FigureGrid({required this.figures});
  final List<(String, String)> figures;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: 1.35,
      children: [
        for (final (index, (label, value)) in figures.indexed)
          Reveal(
            delay: Duration(milliseconds: 40 * index),
            scale: 0.85,
            offset: 14,
            child: GlowFrame(
              radius: 14,
              width: 1.2,
              colors: softRim,
              bloom: 0.3,
              offset: index * 0.17,
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xEB33085E), Color(0xEB4B0C66)],
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      label.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFFBDAED0),
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.7,
                      ),
                    ),
                    CountUp(
                      value,
                      builder: (text) =>
                          GoldText(text, style: displayStyle(24), maxLines: 1),
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

String _recordFigure(FigureSet set, String key) {
  final text = set.text(key);
  if (text == null) return '–';
  final number = num.tryParse(text);
  if (number == null) return text;
  return number % 1 == 0
      ? number.toInt().toString()
      : number.toStringAsFixed(2);
}

/// A T20 record from Admin, in Batting, Bowling (if he bowled) and Fielding (if any) groups.
class _T20Record extends StatelessWidget {
  const _T20Record({
    required this.title,
    required this.record,
    required this.empty,
  });
  final String title;
  final FigureSet? record;
  final String empty;

  @override
  Widget build(BuildContext context) {
    final set = record;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 18, bottom: 10),
          child: GoldText(title, style: displayStyle(22)),
        ),
        if (set == null || !set.played)
          ClubCard(
            child: Text(
              empty,
              style: const TextStyle(
                color: Color(0xFFD9CCE6),
                fontStyle: FontStyle.italic,
              ),
            ),
          )
        else ...[
          const _GroupLabel('Batting'),
          _FigureGrid(
            figures: [
              ('Matches', _recordFigure(set, 'matches')),
              ('Runs', _recordFigure(set, 'runs')),
              ('High score', _recordFigure(set, 'highestScore')),
              ('Average', _recordFigure(set, 'average')),
              ('Strike rate', _recordFigure(set, 'strikeRate')),
              (
                '50s / 100s',
                '${_recordFigure(set, 'fifties')} / ${_recordFigure(set, 'hundreds')}',
              ),
            ],
          ),
          if (set.hasBowling) ...[
            const _GroupLabel('Bowling'),
            _FigureGrid(
              figures: [
                ('Wickets', _recordFigure(set, 'wickets')),
                ('Best', _recordFigure(set, 'bestBowling')),
                ('Economy', _recordFigure(set, 'economy')),
                ('Average', _recordFigure(set, 'bowlingAverage')),
                ('Strike rate', _recordFigure(set, 'bowlingStrikeRate')),
                ('Overs', _recordFigure(set, 'bowlingOvers')),
              ],
            ),
          ],
          if (set.hasFielding) ...[
            const _GroupLabel('Fielding'),
            _FigureGrid(
              figures: [
                ('Catches', _recordFigure(set, 'catches')),
                ('Stumpings', _recordFigure(set, 'stumpings')),
                ('Run outs', _recordFigure(set, 'runOuts')),
              ],
            ),
          ],
        ],
      ],
    );
  }
}

class _GroupLabel extends StatelessWidget {
  const _GroupLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 6, bottom: 8),
    child: Eyebrow(text),
  );
}

void openPlayer(BuildContext context, Player player) {
  ClubAnalytics.viewPlayer(player.slug, player.fullName);
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (_) => PlayerPage(slug: player.slug, preview: player),
    ),
  );
}

class _PlayerStyleDetail extends StatelessWidget {
  const _PlayerStyleDetail({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 280),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              color: goldLight,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }
}

class PlayerPage extends StatefulWidget {
  const PlayerPage({super.key, required this.slug, this.preview});
  final String slug;
  final Player? preview;

  @override
  State<PlayerPage> createState() => _PlayerPageState();
}

class _PlayerPageState extends State<PlayerPage> {
  Player? player;
  PlayerReport? report;
  String? error;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    player = widget.preview;
    _load();
  }

  Future<void> _load() async {
    try {
      final api = ClubScope.of(context).api;
      final loaded = await api.fetchPlayer(widget.slug);
      if (mounted) setState(() => player = loaded);
      try {
        final stats = await api.fetchPlayerStats(widget.slug);
        if (mounted) setState(() => report = stats);
      } catch (_) {}
    } catch (reason) {
      if (mounted && player == null)
        setState(() => error = '$reason'.replaceFirst('Exception: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    final current = player;
    if (current == null) {
      return Scaffold(
        appBar: const ClubAppBar('Player'),
        body: error == null ? const LoadingView() : MessageView(error!),
      );
    }
    final api = ClubScope.of(context).api;
    final additionalFacts = <(String, String)>[
      if (current.dateOfBirth != null)
        ('Born', when(current.dateOfBirth).split(' · ').first),
      if (current.heightCm != null) ('Height', '${current.heightCm} cm'),
    ];
    final name = current.heading;
    return Scaffold(
      appBar: ClubAppBar(name),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: [
          SizedBox(
            height: 350,
            child: Stack(
              fit: StackFit.expand,
              children: [
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topRight,
                      end: Alignment.bottomLeft,
                      colors: [
                        Color(0xFFC9177E),
                        Color(0xFF6A1290),
                        Color(0xFF2A0750),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  right: -30,
                  top: 20,
                  bottom: 40,
                  child: Opacity(
                    opacity: 0.18,
                    child: Image.asset('assets/brand/united-tigers.png'),
                  ),
                ),
                RemoteImage(
                  api.media(current.coverImage ?? current.profileImage),
                  height: 430,
                  radius: 0,
                ),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Color(0xF2340A5F)],
                      stops: [0.45, 1],
                    ),
                  ),
                ),
                Positioned(
                  left: 18,
                  right: 18,
                  bottom: 18,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Eyebrow(current.badge),
                      const SizedBox(height: 8),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: GoldText(
                              name.toUpperCase(),
                              style: displayStyle(36, height: 0.95),
                            ),
                          ),
                          GoldText(
                            '#${current.jerseyNumber ?? 'UT'}',
                            style: displayStyle(38),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 10,
                        runSpacing: 4,
                        children: [
                          Text(
                            roleLabel(current.role).toUpperCase(),
                            style: const TextStyle(
                              color: Color(0xFFE6DDF0),
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1,
                            ),
                          ),
                          const Text(
                            '/',
                            style: TextStyle(color: goldLight, fontSize: 11),
                          ),
                          if (current.nationality != null) ...[
                            Text(
                              current.nationality!.toUpperCase(),
                              style: const TextStyle(
                                color: Color(0xFFE6DDF0),
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1,
                              ),
                            ),
                            const Text(
                              '/',
                              style: TextStyle(color: goldLight, fontSize: 11),
                            ),
                          ],
                          Text(
                            'SQUAD #${current.jerseyNumber ?? 'UT'}',
                            style: const TextStyle(
                              color: Color(0xFFE6DDF0),
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  current.bio ?? 'Player profile details are being completed.',
                  style: const TextStyle(
                    color: Color(0xFFE6DDF0),
                    fontSize: 15,
                    height: 1.55,
                  ),
                ),
                if (current.battingStyle != null ||
                    current.bowlingStyle != null) ...[
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 28,
                    runSpacing: 14,
                    children: [
                      if (current.battingStyle != null)
                        _PlayerStyleDetail(
                          label: 'Batting',
                          value: current.battingStyle!,
                        ),
                      if (current.bowlingStyle != null)
                        _PlayerStyleDetail(
                          label: 'Bowling',
                          value: current.bowlingStyle!,
                        ),
                    ],
                  ),
                ],
                if (additionalFacts.isNotEmpty) ...[
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final (label, value) in additionalFacts)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: purple.withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: gold.withValues(alpha: 0.3),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                label.toUpperCase(),
                                style: const TextStyle(
                                  color: Color(0xFFBDAED0),
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.8,
                                ),
                              ),
                              Text(
                                value,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ],
                const SizedBox(height: 16),
                if (report?.currentSeason != null)
                  _StatsBlock('This season', report!.currentSeason!),
                if (report?.career != null)
                  _StatsBlock('Career', report!.career!),
                const SectionTitle('Beyond the Tigers'),
                _T20Record(
                  title: 'ALL T20 MATCHES',
                  record: current.allT20Record,
                  empty: 'No T20 record is available for $name yet.',
                ),
                _T20Record(
                  title: 'T20 INTERNATIONALS',
                  record: current.t20Record,
                  empty: '$name has not played a T20 International yet.',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
