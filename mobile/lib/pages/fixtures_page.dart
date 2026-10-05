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
        appBar: AppBar(
          title: const Text('FIXTURES'),
          bottom: const TabBar(tabs: [Tab(text: 'UPCOMING'), Tab(text: 'COMPLETED')]),
        ),
        body: AnimatedBuilder(
          animation: api,
          builder: (context, _) {
            final upcoming = api.catalog.matches.where((match) => !match.isCompleted).toList();
            final completed = api.catalog.matches.where((match) => match.isCompleted).toList().reversed.toList();
            return TabBarView(
              children: [
                _MatchList(matches: upcoming),
                _MatchList(matches: completed),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _MatchList extends StatelessWidget {
  const _MatchList({required this.matches});
  final List<ClubMatch> matches;

  @override
  Widget build(BuildContext context) {
    if (matches.isEmpty) return const Center(child: Text('Fixtures will be listed here.'));
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: matches.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final match = matches[index];
        return ClubCard(
          onTap: () => openMatch(context, match),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              StatusChip(match.statusLabel),
              const SizedBox(height: 8),
              Text('United Tigers vs ${match.opponent}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              Text(when(match.date)),
              if (match.venueName != null) Text(match.venueName!),
              Text(match.scoreLine),
            ],
          ),
        );
      },
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
      return Scaffold(appBar: AppBar(title: const Text('MATCH')), body: error == null ? const LoadingView() : MessageView(error!));
    }
    return Scaffold(
      appBar: AppBar(title: Text('vs ${current.opponent}')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          StatusChip(current.statusLabel),
          const SizedBox(height: 8),
          Text('United Tigers vs ${current.opponent}', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
          Text(when(current.date)),
          if (current.competition != null) Text(current.competition!),
          if (current.venueName != null) Text([current.venueName, current.venueCity].whereType<String>().join(', ')),
          if (current.toss != null) Text('Toss · ${current.toss}'),
          if (current.result != null) Text(current.result!, style: const TextStyle(fontWeight: FontWeight.w700)),
          if (error != null) Text(error!),
          if (current.innings.isEmpty) const Padding(padding: EdgeInsets.only(top: 16), child: Text('The scorecard will appear once it is entered.')),
          ...current.innings.map((entry) => Padding(padding: const EdgeInsets.only(top: 16), child: _InningsCard(entry: entry))),
        ],
      ),
    );
  }
}

class _InningsCard extends StatelessWidget {
  const _InningsCard({required this.entry});
  final InningsCard entry;

  @override
  Widget build(BuildContext context) {
    return ClubCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Innings ${entry.number} · ${entry.battingTeam}', style: const TextStyle(fontWeight: FontWeight.w800)),
          Text(entry.summary, style: const TextStyle(color: gold, fontSize: 18, fontWeight: FontWeight.w800)),
          if (entry.batting.isNotEmpty) ...[
            const SizedBox(height: 10),
            const Text('BATTING', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
            ...entry.batting.map(
              (row) => Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Row(
                  children: [
                    Expanded(child: Text('${row.name}${row.dismissal == null ? '' : '  ${row.dismissal}'}')),
                    Text('${row.runs} (${row.balls})'),
                  ],
                ),
              ),
            ),
          ],
          if (entry.bowling.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Text('BOWLING', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
            ...entry.bowling.map(
              (row) => Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Row(
                  children: [
                    Expanded(child: Text(row.name)),
                    Text('${row.wickets}/${row.runs}  (${row.overs})'),
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
