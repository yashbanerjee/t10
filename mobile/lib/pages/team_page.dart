import 'package:flutter/material.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';
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
          appBar: AppBar(title: const Text('THE SQUAD')),
          body: RefreshIndicator(
            onRefresh: api.refresh,
            child: CustomScrollView(
              slivers: [
                const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.fromLTRB(16, 16, 16, 12), child: Text('Meet the names announced for the Tigers’ first season.'))),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: 0.72),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final player = api.catalog.players[index];
                        return ClubCard(
                          padding: const EdgeInsets.all(10),
                          onTap: () => openPlayer(context, player),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              RemoteImage(api.media(player.profileImage), height: 110, radius: 14),
                              const SizedBox(height: 8),
                              Text(player.badge, style: const TextStyle(color: gold, fontSize: 10, fontWeight: FontWeight.w800)),
                              Text(player.fullName, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800)),
                              Text('#${player.jerseyNumber ?? 'UT'} · ${roleLabel(player.role)}', style: const TextStyle(fontSize: 12)),
                            ],
                          ),
                        );
                      },
                      childCount: api.catalog.players.length,
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: Column(
                      children: [
                if (api.catalog.staff.isNotEmpty) const SectionTitle('STAFF'),
                ...api.catalog.staff.map(
                  (member) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: ClubCard(
                      child: Row(
                        children: [
                          SizedBox(width: 64, height: 64, child: RemoteImage(api.media(member.profileImage), height: 64, radius: 12)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(member.fullName, style: const TextStyle(fontWeight: FontWeight.w800)),
                                Text('${member.title} · ${member.category}'),
                                if (member.bio != null) Text(member.bio!, maxLines: 3, overflow: TextOverflow.ellipsis),
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
              ],
            ),
          ),
        );
      },
    );
  }
}

class _StatsBlock extends StatelessWidget {
  const _StatsBlock(this.label, this.stats);
  final String label;
  final CricketStats stats;

  String _rate(double? value) => value == null ? '–' : value.toStringAsFixed(2);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: ClubCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: gold, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text('${stats.matches} matches · ${stats.runs} runs · ${stats.wickets} wickets'),
            Text('HS ${stats.highestScore} · Avg ${_rate(stats.average)} · SR ${_rate(stats.strikeRate)}'),
            Text('Econ ${_rate(stats.economy)} · ${stats.fours} fours · ${stats.sixes} sixes · ${stats.catches} catches'),
            if (stats.bowlingOvers != null || stats.bestBowling != null) Text('Overs ${stats.bowlingOvers ?? '–'} · Best ${stats.bestBowling ?? '–'}'),
          ],
        ),
      ),
    );
  }
}

void openPlayer(BuildContext context, Player player) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => PlayerPage(slug: player.slug, preview: player)));
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
      if (mounted && player == null) setState(() => error = '$reason'.replaceFirst('Exception: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    final current = player;
    if (current == null) {
      return Scaffold(appBar: AppBar(title: const Text('PLAYER')), body: error == null ? const LoadingView() : MessageView(error!));
    }
    final api = ClubScope.of(context).api;
    final facts = <String, String>{
      if (current.battingStyle != null) 'Batting': current.battingStyle!,
      if (current.bowlingStyle != null) 'Bowling': current.bowlingStyle!,
      if (current.heightCm != null) 'Height': '${current.heightCm} cm',
      if (current.dateOfBirth != null) 'Born': when(current.dateOfBirth).split(' · ').first,
      if (current.shortName != null) 'Short name': current.shortName!,
      if (current.country != null) 'Country': current.country!,
    };
    return Scaffold(
      appBar: AppBar(title: Text(current.heading)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          RemoteImage(api.media(current.coverImage ?? current.profileImage), height: 280),
          const SizedBox(height: 12),
          Text(current.badge, style: const TextStyle(color: gold, fontWeight: FontWeight.w800)),
          Text('#${current.jerseyNumber ?? 'UT'}', style: const TextStyle(color: gold, fontSize: 28, fontWeight: FontWeight.w800)),
          Text(current.heading, style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800)),
          Text(roleLabel(current.role)),
          if (current.nationality != null) Text(current.nationality!),
          const SizedBox(height: 12),
          Text(current.bio ?? 'Player profile details are being completed.'),
          if (report?.currentSeason != null) _StatsBlock('THIS SEASON', report!.currentSeason!),
          if (report?.career != null) _StatsBlock('CAREER', report!.career!),
          if (facts.isNotEmpty) ...[
            const SizedBox(height: 16),
            ...facts.entries.map(
              (fact) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    SizedBox(width: 110, child: Text(fact.key, style: const TextStyle(color: gold))),
                    Expanded(child: Text(fact.value, style: const TextStyle(fontWeight: FontWeight.w700))),
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
