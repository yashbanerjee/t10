import 'package:flutter/material.dart';
import 'package:united_tigers/api.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/pages/fan_pages.dart';
import 'package:united_tigers/widgets.dart';

class MorePage extends StatelessWidget {
  const MorePage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: AppBar(title: const Text('UNITED TIGERS')),
      body: ListView(
        children: [
          ListTile(leading: const Icon(Icons.how_to_vote_outlined), title: const Text('Fan zone'), subtitle: const Text('Polls and contests'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FanPage()))),
          ListTile(leading: const Icon(Icons.newspaper_outlined), title: const Text('News'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NewsPage()))),
          ListTile(leading: const Icon(Icons.photo_library_outlined), title: const Text('Gallery'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GalleryPage()))),
          ListTile(leading: const Icon(Icons.handshake_outlined), title: const Text('Sponsors'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PartnersPage()))),
          ListTile(leading: const Icon(Icons.leaderboard_outlined), title: const Text('Stats'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StatsPage()))),
          ListTile(leading: const Icon(Icons.emoji_events_outlined), title: const Text('Records'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RecordsPage()))),
          ListTile(leading: const Icon(Icons.table_chart_outlined), title: const Text('Points table'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PointsPage()))),
          ListTile(leading: const Icon(Icons.info_outline), title: const Text('About'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AboutPage()))),
          ListTile(leading: const Icon(Icons.mail_outline), title: const Text('Contact'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ContactPage()))),
          ListTile(leading: const Icon(Icons.dns_outlined), title: const Text('Server'), subtitle: Text(api.base), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ServerPage()))),
        ],
      ),
    );
  }
}

class NewsPage extends StatelessWidget {
  const NewsPage({super.key});
  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final stories = asList(api.home['news']);
    return Scaffold(
      appBar: AppBar(title: const Text('NEWSROOM')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: stories.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final story = stories[index];
          return ClubCard(onTap: () => openStory(context, story), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [RemoteImage(api.media(story['coverImage'])), const SizedBox(height: 8), Text(story['category']?.toString() ?? '', style: const TextStyle(color: gold, fontSize: 11)), Text(story['title'].toString(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)), Text(plain(story['excerpt']))]));
        },
      ),
    );
  }
}

void openStory(BuildContext context, Map<String, dynamic> story) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => StoryPage(slug: story['slug'].toString(), preview: story)));
}

class StoryPage extends StatefulWidget {
  const StoryPage({super.key, required this.slug, required this.preview});
  final String slug;
  final Map<String, dynamic> preview;
  @override
  State<StoryPage> createState() => _StoryPageState();
}

class _StoryPageState extends State<StoryPage> {
  Map<String, dynamic>? story;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    story = widget.preview;
    ClubScope.of(context).api.get('/api/v1/news/${widget.slug}').then((data) {
      if (mounted && data is Map) setState(() => story = Map<String, dynamic>.from(data));
    }).catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final current = story ?? widget.preview;
    return Scaffold(
      appBar: AppBar(title: Text(current['category']?.toString() ?? 'NEWS')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        RemoteImage(ClubScope.of(context).api.media(current['coverImage']), height: 220),
        const SizedBox(height: 12),
        Text(current['title'].toString(), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        Text(plain(current['body'] ?? current['excerpt'])),
      ]),
    );
  }
}

class GalleryPage extends StatelessWidget {
  const GalleryPage({super.key});
  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final items = asList(api.home['gallery']);
    return Scaffold(
      appBar: AppBar(title: const Text('GALLERY')),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 8, crossAxisSpacing: 8),
        itemCount: items.length,
        itemBuilder: (context, index) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Expanded(child: RemoteImage(api.media(items[index]['mediaUrl']), height: 120, radius: 12)), Text(items[index]['title']?.toString() ?? '', maxLines: 1, overflow: TextOverflow.ellipsis)]),
      ),
    );
  }
}

class PartnersPage extends StatelessWidget {
  const PartnersPage({super.key});
  @override
  Widget build(BuildContext context) {
    final sponsors = asList(ClubScope.of(context).api.home['sponsors']);
    return Scaffold(appBar: AppBar(title: const Text('PARTNERS')), body: ListView(padding: const EdgeInsets.all(16), children: sponsors.map((sponsor) => Padding(padding: const EdgeInsets.only(bottom: 8), child: ClubCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(sponsor['category']?.toString() ?? 'PARTNER', style: const TextStyle(color: gold, fontSize: 11)), Text(sponsor['name'].toString(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800))])))).toList()));
  }
}

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: const Text('OUR STORY')), body: ListView(padding: const EdgeInsets.all(16), children: const [Text('BUILT FOR THE MOMENT', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800)), SizedBox(height: 12), Text('United Tigers are a new Abu Dhabi T10 franchise announced for the 2026 season. The club brings a fresh identity to a format built for pace, energy and unforgettable moments.'), SizedBox(height: 12), Text('Fakhar Zaman has been announced as the team’s icon player. As the squad takes shape, the club’s story will be written alongside its players, partners and fans.')]));
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
      appBar: AppBar(title: const Text('CONTACT')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        const Text('For partnership, media and supporter enquiries, leave a message for the team.'),
        const SizedBox(height: 12),
        ClubField(label: 'Name', controller: name),
        ClubField(label: 'Email', controller: email, email: true),
        ClubField(label: 'Phone', controller: phone, phone: true),
        ClubField(label: 'Subject', controller: subject),
        ClubField(label: 'Message', controller: message, lines: 5),
        FilledButton(onPressed: busy ? null : () async {
          setState(() => busy = true);
          try {
            final reply = await ClubScope.of(context).api.post('/api/v1/contact', {'name': name.text.trim(), 'email': email.text.trim(), 'phone': phone.text.trim(), 'subject': subject.text.trim(), 'message': message.text.trim()});
            if (context.mounted) await showClubMessage(context, reply);
          } catch (reason) {
            if (context.mounted) await showClubMessage(context, reason.toString().replaceFirst('Exception: ', ''));
          } finally {
            if (mounted) setState(() => busy = false);
          }
        }, child: Text(busy ? 'SENDING…' : 'SEND')),
      ]),
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
      appBar: AppBar(title: const Text('SERVER')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        const Text('Point the app at the United Tigers site. On an Android emulator, use http://10.0.2.2:3001. On a phone, use your computer’s address.'),
        const SizedBox(height: 12),
        ClubField(label: 'Site address', controller: address!),
        FilledButton(onPressed: () async {
          await ClubScope.of(context).api.setBase(address!.text);
          if (context.mounted) Navigator.pop(context);
        }, child: const Text('SAVE')),
      ]),
    );
  }
}

class StatsPage extends StatefulWidget {
  const StatsPage({super.key});
  @override
  State<StatsPage> createState() => _StatsPageState();
}

class _StatsPageState extends State<StatsPage> {
  List<Map<String, dynamic>> rows = [];
  String? error;
  bool started = false;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    ClubScope.of(context).api.get('/api/v1/stats/players?season=2026').then((data) {
      if (mounted) setState(() => rows = asList(data));
    }).catchError((reason) {
      if (mounted) setState(() => error = reason.toString().replaceFirst('Exception: ', ''));
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: const Text('STATS')), body: error != null ? Center(child: Text(error!)) : rows.isEmpty ? const Center(child: Text('The numbers will appear once scorecards are entered.')) : ListView.builder(itemCount: rows.length, itemBuilder: (context, index) {
      final row = rows[index];
      final player = row['player'];
      final name = player is Map ? player['fullName'] : 'Player';
      return ListTile(title: Text(name.toString()), subtitle: Text(row['stats']?.toString() ?? ''));
    }));
  }
}

class RecordsPage extends StatefulWidget {
  const RecordsPage({super.key});
  @override
  State<RecordsPage> createState() => _RecordsPageState();
}

class _RecordsPageState extends State<RecordsPage> {
  List<Map<String, dynamic>> rows = [];
  bool started = false;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    ClubScope.of(context).api.get('/api/v1/records').then((data) { if (mounted) setState(() => rows = asList(data)); });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: const Text('RECORDS')), body: rows.isEmpty ? const Center(child: Text('The record book is open.')) : ListView(padding: const EdgeInsets.all(16), children: rows.map((record) => Padding(padding: const EdgeInsets.only(bottom: 8), child: ClubCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(record['value']?.toString() ?? '', style: const TextStyle(color: gold, fontSize: 22, fontWeight: FontWeight.w800)), Text(record['title']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w800)), Text(record['playerName']?.toString() ?? 'United Tigers')])))).toList()));
  }
}

class PointsPage extends StatefulWidget {
  const PointsPage({super.key});
  @override
  State<PointsPage> createState() => _PointsPageState();
}

class _PointsPageState extends State<PointsPage> {
  List<Map<String, dynamic>> rows = [];
  bool started = false;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    ClubScope.of(context).api.get('/api/v1/points').then((data) { if (mounted) setState(() => rows = asList(data)); });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: const Text('POINTS')), body: rows.isEmpty ? const Center(child: Text('The table appears after completed matches.')) : ListView(children: rows.map((row) => ListTile(leading: Text('${row['position'] ?? ''}'), title: Text(row['teamName']?.toString() ?? ''), subtitle: Text('P ${row['played'] ?? 0}  W ${row['won'] ?? 0}  L ${row['lost'] ?? 0}'), trailing: Text('${row['points'] ?? 0}'))).toList()));
  }
}
