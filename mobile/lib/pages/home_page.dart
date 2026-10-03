import 'package:flutter/material.dart';
import 'package:united_tigers/api.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/pages/fan_pages.dart';
import 'package:united_tigers/pages/fixtures_page.dart';
import 'package:united_tigers/pages/more_pages.dart';
import 'package:united_tigers/pages/shop_pages.dart';
import 'package:united_tigers/pages/team_page.dart';
import 'package:united_tigers/widgets.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return AnimatedBuilder(
      animation: api,
      builder: (context, _) {
        if (api.loading && api.home.isEmpty) return const Scaffold(body: Center(child: CircularProgressIndicator()));
        if (api.error != null && api.home.isEmpty) {
          return Scaffold(body: Center(child: Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [Text(api.error!, textAlign: TextAlign.center), const SizedBox(height: 12), FilledButton(onPressed: api.refresh, child: const Text('TRY AGAIN'))]))));
        }
        final players = asList(api.home['players']);
        final matches = asList(api.home['matches']);
        final news = asList(api.home['news']);
        final products = asList(api.home['products']);
        final polls = asList(api.home['polls']);
        final contests = asList(api.home['contests']);
        final gallery = asList(api.home['gallery']).where((item) => item['type'] == 'IMAGE').take(4).toList();
        final sponsors = asList(api.home['sponsors']);
        final upcoming = matches.where((match) => match['status'] == 'UPCOMING' || match['status'] == 'LIVE').firstOrNull;
        final listed = [
          ...matches.where((match) => match['status'] == 'COMPLETED').toList().reversed.take(2).toList().reversed,
          ...matches.where((match) => match['status'] == 'UPCOMING' || match['status'] == 'LIVE').take(1),
        ];
        final poll = polls.cast<Map<String, dynamic>?>().firstOrNull;
        return Scaffold(
          body: RefreshIndicator(
            onRefresh: api.refresh,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [
                const SizedBox(height: 36),
                const Text('ABU DHABI T10', style: TextStyle(color: orange, fontWeight: FontWeight.w800, letterSpacing: 1.4, fontSize: 12)),
                const Text('THE NEXT GAME\nSTARTS HERE', style: TextStyle(fontSize: 40, height: 0.95, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                const Text('BIGGER BOLDER TOGETHER', style: TextStyle(letterSpacing: 1.2, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                Align(alignment: Alignment.centerLeft, child: FilledButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TeamPage())), child: const Text('BACK OUR TIGERS'))),
                const SectionTitle('NEXT MATCH'),
                if (upcoming == null) const ClubCard(child: Text('The next fixture will appear here as soon as it is confirmed.')) else ClubCard(onTap: () => openMatch(context, upcoming), child: _NextMatch(match: upcoming)),
                SectionTitle('MEET OUR TIGERS', action: 'View all', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TeamPage()))),
                SizedBox(height: 168, child: ListView.separated(scrollDirection: Axis.horizontal, itemCount: players.take(4).length, separatorBuilder: (_, _) => const SizedBox(width: 10), itemBuilder: (context, index) {
                  final player = players[index];
                  return GestureDetector(onTap: () => openPlayer(context, player), child: SizedBox(width: 110, child: Column(children: [RemoteImage(api.media(player['profileImage']), height: 96, radius: 14), const SizedBox(height: 6), Text('${player['jerseyNumber'] ?? 'UT'}', style: const TextStyle(color: gold, fontWeight: FontWeight.w800)), Text('${player['fullName']}', maxLines: 2, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12))])));
                })),
                const SectionTitle('VOTE FOR PLAYER OF THE MATCH'),
                ClubCard(onTap: poll == null ? null : () => openPoll(context, poll), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(poll?['question']?.toString() ?? 'Who lit up the game?', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)), const SizedBox(height: 6), const Text('Cast your vote and make your voice count.'), const SizedBox(height: 12), FilledButton(onPressed: poll == null ? null : () => openPoll(context, poll), child: const Text('CAST YOUR VOTE'))])),
                const SectionTitle('TIGERS NATION'),
                const ClubCard(child: Column(children: [
                  Row(children: [Expanded(child: _Stat('30K+', 'Fans worldwide')), Expanded(child: _Stat('6', 'Franchise teams'))]),
                  Row(children: [Expanded(child: _Stat('30+', 'T10 nations')), Expanded(child: _Stat('90', 'Minutes of thrill'))]),
                ])),
                const SizedBox(height: 10),
                const NationSignup(),
                SectionTitle('LATEST HIGHLIGHTS', action: 'View all', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NewsPage()))),
                ...news.take(3).map((story) => Padding(padding: const EdgeInsets.only(bottom: 10), child: ClubCard(onTap: () => openStory(context, story), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [RemoteImage(api.media(story['coverImage'])), const SizedBox(height: 8), Text(story['category']?.toString() ?? '', style: const TextStyle(color: gold, fontSize: 11)), Text(story['title'].toString(), style: const TextStyle(fontWeight: FontWeight.w800))])))),
                SectionTitle('FIXTURES & RESULTS', action: 'View all', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FixturesPage()))),
                ...listed.map((match) => Padding(padding: const EdgeInsets.only(bottom: 8), child: ClubCard(onTap: () => openMatch(context, match), child: _FixtureRow(match: match)))),
                SectionTitle('FEATURED KIT', action: 'Shop all', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ShopPage()))),
                ...products.where((product) => product['isFeatured'] == true).take(3).map((product) => Padding(padding: const EdgeInsets.only(bottom: 10), child: ClubCard(onTap: () => openProduct(context, product), child: Row(children: [SizedBox(width: 84, child: RemoteImage(api.media(product['image']), height: 84, radius: 12)), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(product['name'].toString(), style: const TextStyle(fontWeight: FontWeight.w800)), Text(money(product['price']), style: const TextStyle(color: orange))]))])))),
                SectionTitle('IN THE FRAME', action: 'Gallery', onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GalleryPage()))),
                SizedBox(height: 120, child: ListView.separated(scrollDirection: Axis.horizontal, itemCount: gallery.length, separatorBuilder: (_, _) => const SizedBox(width: 8), itemBuilder: (context, index) => SizedBox(width: 160, child: RemoteImage(api.media(gallery[index]['mediaUrl']), height: 120)))),
                if (contests.isNotEmpty) ...[
                  const SectionTitle('FAN CONTEST'),
                  ClubCard(onTap: () => openContest(context, contests.first), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(contests.first['title'].toString(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)), if (contests.first['prize'] != null) Text('Prize · ${contests.first['prize']}'), const SizedBox(height: 10), const Text('ENTER NOW', style: TextStyle(color: orange, fontWeight: FontWeight.w800))])),
                ],
                const SectionTitle('OUR PARTNERS'),
                Wrap(spacing: 8, runSpacing: 8, children: sponsors.map((sponsor) => Chip(label: Text(sponsor['name'].toString()))).toList()),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat(this.value, this.label);
  final String value;
  final String label;
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.only(bottom: 10), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(value, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: gold)), Text(label)]));
}

class _NextMatch extends StatelessWidget {
  const _NextMatch({required this.match});
  final Map<String, dynamic> match;
  @override
  Widget build(BuildContext context) {
    final venue = match['venue'];
    final venueName = venue is Map ? venue['name']?.toString() ?? 'Venue TBC' : 'Venue TBC';
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('United Tigers vs ${match['opponent']}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
      const SizedBox(height: 6),
      Text(when(match['date'])),
      Text(venueName),
      const SizedBox(height: 12),
      const Text('BUY TICKETS', style: TextStyle(color: orange, fontWeight: FontWeight.w800)),
    ]);
  }
}

class _FixtureRow extends StatelessWidget {
  const _FixtureRow({required this.match});
  final Map<String, dynamic> match;
  @override
  Widget build(BuildContext context) {
    final won = RegExp(r'united tigers won', caseSensitive: false).hasMatch(match['result']?.toString() ?? '');
    final label = match['status'] == 'LIVE' ? 'LIVE' : match['status'] == 'COMPLETED' ? (won ? 'WIN' : 'RESULT') : 'NEXT';
    return Row(children: [StatusChip(label), const SizedBox(width: 10), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('vs ${match['opponent']}', style: const TextStyle(fontWeight: FontWeight.w700)), Text(when(match['date']), style: const TextStyle(fontSize: 12))])), const SizedBox(width: 8), Flexible(child: Text(scoreLine(match), textAlign: TextAlign.right, style: const TextStyle(fontSize: 12)))]);
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
    return ClubCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('JOIN THE TIGERS NATION', style: TextStyle(fontWeight: FontWeight.w800)),
      const SizedBox(height: 10),
      ClubField(label: 'Email address', controller: email, email: true),
      FilledButton(onPressed: busy ? null : () async {
        setState(() => busy = true);
        try {
          final message = await ClubScope.of(context).api.post('/api/v1/contact', {'name': 'Tigers Nation', 'email': email.text.trim(), 'subject': 'Tigers Nation signup', 'message': 'Please add this email to Tigers Nation updates.'});
          if (context.mounted) await showClubMessage(context, message);
          email.clear();
        } catch (reason) {
          if (context.mounted) await showClubMessage(context, reason.toString().replaceFirst('Exception: ', ''));
        } finally {
          if (mounted) setState(() => busy = false);
        }
      }, child: Text(busy ? 'SENDING…' : 'SIGN UP')),
    ]));
  }
}
