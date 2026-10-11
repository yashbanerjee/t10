import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/services/analytics.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/widgets.dart';

class FixturesPage extends StatelessWidget {
  const FixturesPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: const ClubAppBar('Fixtures', tabs: ['Upcoming', 'Results']),
        body: AnimatedBuilder(
          animation: api,
          builder: (context, _) {
            final upcoming = api.catalog.matches.where((match) => !match.isCompleted).toList();
            final completed = api.catalog.matches.where((match) => match.isCompleted).toList().reversed.toList();
            return TabBarView(
              children: [
                _MatchList(matches: upcoming, empty: 'Fixtures will be listed here once the schedule is out.'),
                _MatchList(matches: completed, empty: 'Results appear here after each match.'),
              ],
            );
          },
        ),
      ),
    );
  }
}

/// Fixture times are published in Gulf Standard Time, as on the website.
DateTime _gst(DateTime date) => date.toUtc().add(const Duration(hours: 4));

const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

class _FixtureCrest extends StatelessWidget {
  const _FixtureCrest({this.asset, this.url});
  final String? asset;
  final String? url;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Container(
      width: 34,
      height: 34,
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(8)),
      child: asset != null
          ? Image.asset(asset!, fit: BoxFit.contain)
          : Image.network(api.media(url), fit: BoxFit.contain, errorBuilder: (_, _, _) => const SizedBox.shrink()),
    );
  }
}

class _FixtureRow extends StatelessWidget {
  const _FixtureRow({required this.match, required this.lead});
  final ClubMatch match;
  final bool lead;

  @override
  Widget build(BuildContext context) {
    final date = match.date == null ? null : _gst(match.date!);
    final score = match.innings.map((entry) => '${entry.runs}/${entry.wickets}').join(' · ');
    final team = displayStyle(19, color: Colors.white, height: 1.05);
    return ClubCard(
      highlight: lead,
      padding: const EdgeInsets.all(14),
      onTap: () => openMatch(context, match),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 72,
            child: date == null
                ? Text('TBC', style: displayStyle(19, color: goldLight))
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${date.day.toString().padLeft(2, '0')} ${_months[date.month - 1]}', style: displayStyle(19, color: goldLight, height: 1.1)),
                      const SizedBox(height: 2),
                      Text(
                        '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')} GST',
                        style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 12, letterSpacing: 1.1),
                      ),
                      if (match.isLive || lead) ...[const SizedBox(height: 8), StatusChip(match.statusLabel)],
                    ],
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    Row(mainAxisSize: MainAxisSize.min, children: [const _FixtureCrest(asset: 'assets/brand/united-tigers.png'), const SizedBox(width: 8), Text('UNITED TIGERS', style: team)]),
                    const Text('vs', style: TextStyle(color: Color(0xFF8E7F9F), fontSize: 14, fontWeight: FontWeight.w900)),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (match.opponentLogoUrl != null) ...[_FixtureCrest(url: match.opponentLogoUrl), const SizedBox(width: 8)],
                        Flexible(child: Text(match.opponent.toUpperCase(), style: team)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '${match.competition ?? 'Abu Dhabi T10'} · ${match.venueName ?? 'Venue TBC'}',
                  style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 13),
                ),
                if (score.isNotEmpty) ...[const SizedBox(height: 8), GoldText(score, style: displayStyle(20))],
                if (match.result != null) ...[
                  const SizedBox(height: 4),
                  Text(match.result!, style: TextStyle(color: match.won ? const Color(0xFF6BE3A0) : Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MatchList extends StatelessWidget {
  const _MatchList({required this.matches, required this.empty});
  final List<ClubMatch> matches;
  final String empty;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return RefreshIndicator(
      color: pink,
      onRefresh: api.refresh,
      child: matches.isEmpty
          ? ListView(padding: const EdgeInsets.all(16), children: [EmptyPanel(title: 'Nothing here yet', message: empty)])
          : ListView.separated(
              padding: EdgeInsets.fromLTRB(16, 16, 16, 28 + navClearance(context)),
              itemCount: matches.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final match = matches[index];
                return _FixtureRow(match: match, lead: match.isLive || (!match.isCompleted && index == 0));
              },
            ),
    );
  }
}

void openMatch(BuildContext context, ClubMatch match) {
  ClubAnalytics.viewMatch(match.slug, match.opponent);
  Navigator.push(context, MaterialPageRoute(builder: (_) => MatchPage(slug: match.slug, preview: match)));
}

class MatchPage extends StatefulWidget {
  const MatchPage({super.key, required this.slug, this.preview});
  final String slug;
  final ClubMatch? preview;

  @override
  State<MatchPage> createState() => _MatchPageState();
}

class _MatchPageState extends State<MatchPage> {
  ClubMatch? match;
  String? error;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    match = widget.preview;
    _load();
  }

  Future<void> _load() async {
    try {
      final loaded = await ClubScope.of(context).api.fetchMatch(widget.slug);
      if (mounted) setState(() => match = loaded);
    } catch (reason) {
      if (mounted) setState(() => error = '$reason'.replaceFirst('Exception: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    final current = match;
    if (current == null) {
      return Scaffold(appBar: const ClubAppBar('Match'), body: error == null ? const LoadingView() : MessageView(error!));
    }
    final details = <(FaIconData, String)>[
      (FontAwesomeIcons.calendarDays, when(current.date)),
      if (current.venueName != null) (FontAwesomeIcons.locationDot, [current.venueName, current.venueCity].whereType<String>().join(', ')),
      if (current.toss != null) (FontAwesomeIcons.coins, 'Toss · ${current.toss}'),
    ];
    return Scaffold(
      appBar: const ClubAppBar('Match centre'),
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          PageHero(
            eyebrow: current.competition ?? 'Abu Dhabi T10',
            title: 'Tigers v\n${current.opponent}',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                StatusChip(current.statusLabel),
                const SizedBox(height: 12),
                for (final (icon, text) in details)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(children: [SizedBox(width: 18, child: FaIcon(icon, size: 14, color: goldLight)), const SizedBox(width: 8), Expanded(child: Text(text, style: const TextStyle(color: Color(0xFFE6DDF0))))]),
                  ),
                if (current.result != null) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(gradient: current.won ? goldSurface : accentGradient, borderRadius: BorderRadius.circular(12)),
                    child: Text(current.result!.toUpperCase(), style: displayStyle(17, color: current.won ? ink : Colors.white)),
                  ),
                ],
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(error!, style: const TextStyle(color: Color(0xFFFFB4C8)))),
                const SectionTitle('Scorecard'),
                if (current.innings.isEmpty) const EmptyPanel(title: 'Scorecard coming', message: 'The scorecard will appear once it is entered.'),
                ...current.innings.map((entry) => Padding(padding: const EdgeInsets.only(bottom: 12), child: _InningsCard(entry: entry))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InningsCard extends StatelessWidget {
  const _InningsCard({required this.entry});
  final InningsCard entry;

  static const _head = TextStyle(color: goldLight, fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 0.9);
  static const _muted = TextStyle(color: Color(0xFFBDAED0), fontSize: 12);

  @override
  Widget build(BuildContext context) {
    return ClubCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(child: Text('INNINGS ${entry.number} · ${entry.battingTeam.toUpperCase()}', style: displayStyle(17, color: Colors.white))),
              GoldText(entry.summary, style: displayStyle(24)),
            ],
          ),
          if (entry.batting.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Row(children: [Expanded(child: Text('BATTING', style: _head)), Text('R (B)', style: _head)]),
            const Divider(height: 14),
            ...entry.batting.map(
              (row) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(row.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                          if (row.dismissal != null) Text(row.dismissal!, style: _muted),
                        ],
                      ),
                    ),
                    Text('${row.runs}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                    Text(' (${row.balls})', style: _muted),
                  ],
                ),
              ),
            ),
          ],
          if (entry.bowling.isNotEmpty) ...[
            const SizedBox(height: 8),
            const Row(children: [Expanded(child: Text('BOWLING', style: _head)), Text('W/R (O)', style: _head)]),
            const Divider(height: 14),
            ...entry.bowling.map(
              (row) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Expanded(child: Text(row.name, style: const TextStyle(fontWeight: FontWeight.w800))),
                    Text('${row.wickets}/${row.runs}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                    Text('  (${row.overs})', style: _muted),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
