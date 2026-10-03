import 'package:flutter/material.dart';
import 'package:united_tigers/api.dart';
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
        appBar: AppBar(title: const Text('FIXTURES'), bottom: const TabBar(tabs: [Tab(text: 'UPCOMING'), Tab(text: 'COMPLETED')])),
        body: AnimatedBuilder(
          animation: api,
          builder: (context, _) {
            final matches = asList(api.home['matches']);
            final upcoming = matches.where((match) => match['status'] != 'COMPLETED').toList();
            final completed = matches.where((match) => match['status'] == 'COMPLETED').toList().reversed.toList();
            return TabBarView(children: [
              _MatchList(matches: upcoming),
              _MatchList(matches: completed),
            ]);
          },
        ),
      ),
    );
  }
}

class _MatchList extends StatelessWidget {
  const _MatchList({required this.matches});
  final List<Map<String, dynamic>> matches;

  @override
  Widget build(BuildContext context) {
    if (matches.isEmpty) return const Center(child: Text('Fixtures will be listed here.'));
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: matches.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final match = matches[index];
        final won = RegExp(r'united tigers won', caseSensitive: false).hasMatch(match['result']?.toString() ?? '');
        final label = match['status'] == 'LIVE' ? 'LIVE' : match['status'] == 'COMPLETED' ? (won ? 'WIN' : 'RESULT') : 'NEXT';
        return ClubCard(
          onTap: () => openMatch(context, match),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            StatusChip(label),
            const SizedBox(height: 8),
            Text('United Tigers vs ${match['opponent']}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            Text(when(match['date'])),
            Text(scoreLine(match)),
          ]),
        );
      },
    );
  }
}

void openMatch(BuildContext context, Map<String, dynamic> match) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => MatchPage(slug: match['slug'].toString(), preview: match)));
}

class MatchPage extends StatefulWidget {
  const MatchPage({super.key, required this.slug, required this.preview});
  final String slug;
  final Map<String, dynamic> preview;

  @override
  State<MatchPage> createState() => _MatchPageState();
}

class _MatchPageState extends State<MatchPage> {
  Map<String, dynamic>? match;
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
      final data = await ClubScope.of(context).api.get('/api/v1/matches/${widget.slug}');
      if (mounted) setState(() => match = Map<String, dynamic>.from(data as Map));
    } catch (reason) {
      if (mounted) setState(() => error = reason.toString().replaceFirst('Exception: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    final current = match ?? widget.preview;
    final venue = current['venue'];
    final innings = asList(current['innings']);
    return Scaffold(
      appBar: AppBar(title: Text('vs ${current['opponent']}')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(current['status']?.toString() ?? '', style: const TextStyle(color: gold, fontWeight: FontWeight.w800)),
          Text('United Tigers vs ${current['opponent']}', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
          Text(when(current['date'])),
          if (venue is Map) Text(venue['name']?.toString() ?? ''),
          if (current['result'] != null) Text(current['result'].toString()),
          if (error != null) Text(error!),
          ...innings.map((entry) => Padding(
                padding: const EdgeInsets.only(top: 16),
                child: ClubCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Innings ${entry['number']} · ${entry['battingTeam']}', style: const TextStyle(fontWeight: FontWeight.w800)),
                  Text('${entry['runs']}/${entry['wickets']} (${entry['overs']} overs)'),
                  ...asList(entry['batting']).map((row) => Text('${row['player'] is Map ? row['player']['fullName'] : 'Batter'}  ${row['runs']} (${row['balls']})')),
                  ...asList(entry['bowling']).map((row) => Text('${row['player'] is Map ? row['player']['fullName'] : 'Bowler'}  ${row['wickets']}/${row['runs']}')),
                ])),
              )),
        ],
      ),
    );
  }
}
