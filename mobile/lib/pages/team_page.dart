import 'package:flutter/material.dart';
import 'package:united_tigers/api.dart';
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
        final players = asList(api.home['players']);
        final staff = asList(api.home['staff']);
        return Scaffold(
          appBar: AppBar(title: const Text('THE SQUAD')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('Meet the names announced for the Tigers’ first season.'),
              const SizedBox(height: 12),
              ...players.map((player) => Padding(padding: const EdgeInsets.only(bottom: 10), child: ClubCard(onTap: () => openPlayer(context, player), child: Row(children: [ClipRRect(borderRadius: BorderRadius.circular(12), child: SizedBox(width: 72, height: 72, child: RemoteImage(api.media(player['profileImage']), height: 72, radius: 12))), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('#${player['jerseyNumber'] ?? 'UT'}  ${player['fullName']}', style: const TextStyle(fontWeight: FontWeight.w800)), Text('${player['role'] ?? 'Player'}'.replaceAll('_', ' ')), if (player['nationality'] != null) Text(player['nationality'].toString())]))])))),
              if (staff.isNotEmpty) const SectionTitle('STAFF'),
              ...staff.map((member) => Padding(padding: const EdgeInsets.only(bottom: 8), child: ClubCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(member['fullName'].toString(), style: const TextStyle(fontWeight: FontWeight.w800)), Text('${member['role'] ?? ''} · ${member['category'] ?? ''}'), if (plain(member['bio']).isNotEmpty) Text(plain(member['bio']))])))),
            ],
          ),
        );
      },
    );
  }
}

void openPlayer(BuildContext context, Map<String, dynamic> player) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => PlayerPage(player: player)));
}

class PlayerPage extends StatelessWidget {
  const PlayerPage({super.key, required this.player});
  final Map<String, dynamic> player;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: AppBar(title: Text(player['fullName'].toString())),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          RemoteImage(api.media(player['profileImage']), height: 280),
          const SizedBox(height: 12),
          Text('#${player['jerseyNumber'] ?? 'UT'}', style: const TextStyle(color: gold, fontSize: 28, fontWeight: FontWeight.w800)),
          Text(player['fullName'].toString(), style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800)),
          Text('${player['role'] ?? ''}'.replaceAll('_', ' ')),
          if (player['nationality'] != null) Text(player['nationality'].toString()),
          if (player['battingStyle'] != null) Text('Batting · ${player['battingStyle']}'),
          if (player['bowlingStyle'] != null) Text('Bowling · ${player['bowlingStyle']}'),
          const SizedBox(height: 12),
          Text(plain(player['bio']).isEmpty ? 'Player profile details are being completed.' : plain(player['bio'])),
        ],
      ),
    );
  }
}
