import 'package:flutter/material.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';
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

String _short(String name) {
  final words = name.split(RegExp(r'\s+')).where((word) => word.isNotEmpty).toList();
  if (words.length > 1) return words.take(3).map((word) => word[0]).join().toUpperCase();
  return name.length <= 3 ? name.toUpperCase() : name.substring(0, 3).toUpperCase();
}

class _TeamMark extends StatelessWidget {
  const _TeamMark({required this.label, this.ours = false});
  final String label;
  final bool ours;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 58,
      height: 58,
      padding: EdgeInsets.all(ours ? 6 : 0),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: ours ? goldSurface : const LinearGradient(colors: [Color(0xFF6A1290), Color(0xFF2A0750)]),
        border: Border.all(color: gold.withValues(alpha: 0.5)),
        boxShadow: [BoxShadow(color: (ours ? gold : pink).withValues(alpha: 0.25), blurRadius: 14)],
      ),
      alignment: Alignment.center,
      child: ours ? Image.asset('assets/brand/united-tigers.png', fit: BoxFit.contain) : Text(label, style: displayStyle(20, color: Colors.white)),
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
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
              itemCount: matches.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final match = matches[index];
                return ClubCard(
                  highlight: match.isLive || (!match.isCompleted && index == 0),
                  onTap: () => openMatch(context, match),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          StatusChip(match.statusLabel),
                          const Spacer(),
                          Flexible(child: Text(match.competition ?? 'Abu Dhabi T10', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: goldLight, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.6))),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          const _TeamMark(label: 'UT', ours: true),
                          Expanded(
                            child: Column(
                              children: [
                                GoldText('VS', style: displayStyle(26)),
                                if (match.innings.isNotEmpty) Text(match.scoreLine, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5)),
                              ],
                            ),
                          ),
                          _TeamMark(label: match.opponentShort ?? _short(match.opponent)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('UNITED TIGERS v ${match.opponent.toUpperCase()}', style: displayStyle(19, color: Colors.white, height: 1.05)),
                      const SizedBox(height: 6),
                      Row(children: [const Icon(Icons.event_rounded, size: 15, color: goldLight), const SizedBox(width: 6), Expanded(child: Text(when(match.date), style: const TextStyle(color: Color(0xFFD9CCE6), fontSize: 13)))]),
                      if (match.venueName != null) Row(children: [const Icon(Icons.place_rounded, size: 15, color: goldLight), const SizedBox(width: 6), Expanded(child: Text(match.venueName!, style: const TextStyle(color: Color(0xFFD9CCE6), fontSize: 13)))]),
                      if (match.result != null) ...[const SizedBox(height: 8), Text(match.result!, style: TextStyle(color: match.won ? const Color(0xFF6BE3A0) : Colors.white, fontWeight: FontWeight.w800))],
                    ],
                  ),
                );
              },
            ),
    );
  }
}

void openMatch(BuildContext context, ClubMatch match) {
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
    final details = <(IconData, String)>[
      (Icons.event_rounded, when(current.date)),
      if (current.venueName != null) (Icons.place_rounded, [current.venueName, current.venueCity].whereType<String>().join(', ')),
      if (current.toss != null) (Icons.toll_rounded, 'Toss · ${current.toss}'),
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
                    child: Row(children: [Icon(icon, size: 16, color: goldLight), const SizedBox(width: 8), Expanded(child: Text(text, style: const TextStyle(color: Color(0xFFE6DDF0))))]),
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
