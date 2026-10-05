import 'package:flutter/material.dart';
import 'package:united_tigers/pages/admin_pages.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/pages/fan_pages.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/widgets.dart';

class MorePage extends StatelessWidget {
  const MorePage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return AnimatedBuilder(
      animation: api,
      builder: (context, _) => Scaffold(
      appBar: AppBar(title: const Text('UNITED TIGERS')),
      body: ListView(
        children: [
          ListTile(leading: const Icon(Icons.how_to_vote_outlined), title: const Text('Fan zone'), subtitle: const Text('Polls and contests'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FanPage()))),
          ListTile(leading: const Icon(Icons.newspaper_outlined), title: const Text('News'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NewsPage()))),
          ListTile(leading: const Icon(Icons.campaign_outlined), title: const Text('Tigers Daily'), subtitle: const Text('Training and team updates'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const UpdatesPage()))),
          ListTile(leading: const Icon(Icons.photo_library_outlined), title: const Text('Gallery'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GalleryPage()))),
          ListTile(leading: const Icon(Icons.handshake_outlined), title: const Text('Sponsors'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PartnersPage()))),
          ListTile(leading: const Icon(Icons.leaderboard_outlined), title: const Text('Stats'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StatsPage()))),
          ListTile(leading: const Icon(Icons.emoji_events_outlined), title: const Text('Records'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RecordsPage()))),
          ListTile(leading: const Icon(Icons.table_chart_outlined), title: const Text('Points table'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PointsPage()))),
          ListTile(leading: const Icon(Icons.info_outline), title: const Text('About'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AboutPage()))),
          ListTile(leading: const Icon(Icons.mail_outline), title: const Text('Contact'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ContactPage()))),
          ListTile(leading: const Icon(Icons.admin_panel_settings_outlined), title: const Text('Admin'), subtitle: Text(api.adminSession == null ? 'Sign in' : api.adminSession!.roleLabel), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminHomePage()))),
          ListTile(leading: const Icon(Icons.dns_outlined), title: const Text('Server'), subtitle: Text(api.base), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ServerPage()))),
        ],
      ),
    ),
    );
  }
}

class NewsPage extends StatelessWidget {
  const NewsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: AppBar(title: const Text('NEWSROOM')),
      body: AnimatedBuilder(
        animation: api,
        builder: (context, _) {
          final stories = api.catalog.news;
          if (stories.isEmpty) return const Center(child: Text('Stories will appear here.'));
          return RefreshIndicator(
            onRefresh: api.refresh,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: stories.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final story = stories[index];
                return ClubCard(
                  onTap: () => openStory(context, story),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      RemoteImage(api.media(story.coverImage)),
                      const SizedBox(height: 8),
                      Text(story.category ?? '', style: const TextStyle(color: gold, fontSize: 11)),
                      Text(story.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                      Text(story.excerpt),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

void openStory(BuildContext context, NewsStory story) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => StoryPage(slug: story.slug, preview: story)));
}

class StoryPage extends StatefulWidget {
  const StoryPage({super.key, required this.slug, this.preview});
  final String slug;
  final NewsStory? preview;

  @override
  State<StoryPage> createState() => _StoryPageState();
}

class _StoryPageState extends State<StoryPage> {
  NewsStory? story;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    story = widget.preview;
    ClubScope.of(context).api.fetchNews(widget.slug).then((loaded) {
      if (mounted) setState(() => story = loaded);
    }).catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final current = story;
    if (current == null) return const Scaffold(body: LoadingView());
    return Scaffold(
      appBar: AppBar(title: Text(current.category ?? 'NEWS')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          RemoteImage(ClubScope.of(context).api.media(current.coverImage), height: 220),
          const SizedBox(height: 12),
          Text(current.title, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
          if (current.authorName != null || current.publishedAt != null)
            Text([
              if (current.authorName != null) current.authorName!,
              if (current.publishedAt != null) when(current.publishedAt),
            ].join(' · ')),
          const SizedBox(height: 8),
          Text(current.content.isEmpty ? current.excerpt : current.content),
        ],
      ),
    );
  }
}

void openUpdate(BuildContext context, TeamUpdate update) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => UpdatePage(update: update)));
}

class UpdatesPage extends StatelessWidget {
  const UpdatesPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: AppBar(title: const Text('TIGERS DAILY')),
      body: AnimatedBuilder(
        animation: api,
        builder: (context, _) {
          final updates = api.catalog.updates;
          if (updates.isEmpty) return const Center(child: Text('Check back soon for training notes and team news.'));
          return RefreshIndicator(
            onRefresh: api.refresh,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: updates.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final update = updates[index];
                return ClubCard(
                  onTap: () => openUpdate(context, update),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (update.image != null) RemoteImage(api.media(update.image)),
                      const SizedBox(height: 8),
                      Text(update.category?.replaceAll('_', ' ') ?? 'UPDATE', style: const TextStyle(color: gold, fontSize: 11, fontWeight: FontWeight.w800)),
                      Text(update.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                      Text(when(update.publishedAt)),
                      Text(update.description),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class UpdatePage extends StatefulWidget {
  const UpdatePage({super.key, required this.update});
  final TeamUpdate update;

  @override
  State<UpdatePage> createState() => _UpdatePageState();
}

class _UpdatePageState extends State<UpdatePage> {
  TeamUpdate? current;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    current = widget.update;
    if (widget.update.slug.isEmpty) return;
    ClubScope.of(context).api.fetchUpdate(widget.update.slug).then((loaded) {
      if (mounted) setState(() => current = loaded);
    }).catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final update = current ?? widget.update;
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: AppBar(title: Text(update.category?.replaceAll('_', ' ') ?? 'UPDATE')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (update.image != null) RemoteImage(api.media(update.image), height: 220),
          const SizedBox(height: 12),
          Text(update.title, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
          Text(when(update.publishedAt)),
          if (update.playerName != null) Text(update.playerName!),
          const SizedBox(height: 8),
          Text(update.content.isEmpty ? update.description : update.content),
          if (update.video != null) ...[
            const SizedBox(height: 16),
            FilledButton(onPressed: () => openExternal(api.media(update.video)), child: const Text('WATCH')),
          ],
        ],
      ),
    );
  }
}

class GalleryPage extends StatelessWidget {
  const GalleryPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final items = api.catalog.gallery;
    return Scaffold(
      appBar: AppBar(title: const Text('GALLERY')),
      body: items.isEmpty
          ? const Center(child: Text('Photos and videos will appear here.'))
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 0.82),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                return GestureDetector(
                  onTap: item.isVideo ? () => openExternal(api.media(item.mediaUrl)) : null,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            RemoteImage(api.media(item.isVideo ? null : item.mediaUrl), height: 120, radius: 12),
                            if (item.isVideo) const Center(child: Icon(Icons.play_circle_fill, color: gold, size: 36)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(item.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                );
              },
            ),
    );
  }
}

class PartnersPage extends StatelessWidget {
  const PartnersPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final sponsors = api.catalog.sponsors;
    return Scaffold(
      appBar: AppBar(title: const Text('PARTNERS')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: sponsors
            .map(
              (sponsor) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: ClubCard(
                  onTap: sponsor.website == null ? null : () => openExternal(sponsor.website!),
                  child: Row(
                    children: [
                      SizedBox(width: 72, height: 48, child: RemoteImage(api.media(sponsor.logoUrl), height: 48, radius: 8)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(sponsor.category ?? 'PARTNER', style: const TextStyle(color: gold, fontSize: 11)),
                            Text(sponsor.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('OUR STORY')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Text('BUILT FOR THE MOMENT', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800)),
          SizedBox(height: 12),
          Text('United Tigers are a new Abu Dhabi T10 franchise announced for the 2026 season. The club brings a fresh identity to a format built for pace, energy and unforgettable moments.'),
          SizedBox(height: 12),
          Text('Fakhar Zaman has been announced as the team’s icon player. As the squad takes shape, the club’s story will be written alongside its players, partners and fans.'),
          SizedBox(height: 16),
          _Pillar('01', 'OUR MISSION', 'Bring people together through fast, fearless cricket and a shared pride in the Tigers.'),
          _Pillar('02', 'OUR VISION', 'Build a team and fan community that grows stronger with every season.'),
          _Pillar('03', 'OUR VALUES', 'Play with courage. Move with purpose. Make room for everyone in the pride.'),
        ],
      ),
    );
  }
}

class _Pillar extends StatelessWidget {
  const _Pillar(this.index, this.title, this.body);
  final String index;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: ClubCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(index, style: const TextStyle(color: gold, fontWeight: FontWeight.w800)),
            Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
            Text(body),
          ],
        ),
      ),
    );
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
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('For partnership, media and supporter enquiries, leave a message for the team.'),
          const SizedBox(height: 8),
          const Text('Based in Abu Dhabi, United Arab Emirates'),
          TextButton(onPressed: () => openExternal('https://www.instagram.com/unitedtigers.ae/'), child: const Text('@unitedtigers.ae')),
          ClubField(label: 'Name', controller: name),
          ClubField(label: 'Email', controller: email, email: true),
          ClubField(label: 'Phone', controller: phone, phone: true),
          ClubField(label: 'Subject', controller: subject),
          ClubField(label: 'Message', controller: message, lines: 5),
          FilledButton(onPressed: busy ? null : _submit, child: Text(busy ? 'SENDING…' : 'SEND')),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    setState(() => busy = true);
    try {
      final reply = await ClubScope.of(context).api.sendContact({
        'name': name.text.trim(),
        'email': email.text.trim(),
        'phone': phone.text.trim(),
        'subject': subject.text.trim(),
        'message': message.text.trim(),
      });
      if (mounted) await showClubMessage(context, reply);
    } catch (reason) {
      if (mounted) await showClubMessage(context, '$reason'.replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => busy = false);
    }
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
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Point the app at the United Tigers API. On an Android emulator, use http://10.0.2.2:3001. On a phone, use your computer’s address.'),
          const SizedBox(height: 12),
          ClubField(label: 'API address', controller: address!),
          FilledButton(
            onPressed: () async {
              await ClubScope.of(context).api.setBase(address!.text);
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('SAVE'),
          ),
        ],
      ),
    );
  }
}

class StatsPage extends StatefulWidget {
  const StatsPage({super.key});

  @override
  State<StatsPage> createState() => _StatsPageState();
}

class _StatsPageState extends State<StatsPage> {
  List<PlayerStat> rows = [];
  String? error;
  bool loading = true;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    ClubScope.of(context).api.fetchStats().then((data) {
      if (mounted) setState(() { rows = data; loading = false; });
    }).catchError((reason) {
      if (mounted) setState(() { error = '$reason'.replaceFirst('Exception: ', ''); loading = false; });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('STATS')),
      body: error != null
          ? MessageView(error!)
          : loading
              ? const LoadingView()
              : rows.isEmpty
                  ? const Center(child: Text('The numbers will appear once scorecards are entered.'))
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: rows.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final row = rows[index];
                        String rate(double? value) => value == null ? '–' : value.toStringAsFixed(2);
                        return ClubCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(row.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                              Text('${row.matches} matches · ${row.runs} runs · ${row.wickets} wickets'),
                              Text('Avg ${rate(row.average)} · SR ${rate(row.strikeRate)} · Econ ${rate(row.economy)}'),
                            ],
                          ),
                        );
                      },
                    ),
    );
  }
}

class RecordsPage extends StatefulWidget {
  const RecordsPage({super.key});

  @override
  State<RecordsPage> createState() => _RecordsPageState();
}

class _RecordsPageState extends State<RecordsPage> {
  List<ClubRecord> rows = [];
  bool loading = true;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    ClubScope.of(context).api.fetchRecords().then((data) {
      if (mounted) setState(() { rows = data; loading = false; });
    }).catchError((_) {
      if (mounted) setState(() => loading = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('RECORDS')),
      body: loading
          ? const LoadingView()
          : rows.isEmpty
              ? const Center(child: Text('The record book is open.'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: rows
                      .map(
                        (record) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: ClubCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (record.category != null) Text(record.category!, style: const TextStyle(color: gold, fontSize: 11, fontWeight: FontWeight.w800)),
                                Text(record.value, style: const TextStyle(color: gold, fontSize: 22, fontWeight: FontWeight.w800)),
                                Text(record.title, style: const TextStyle(fontWeight: FontWeight.w800)),
                                Text(record.playerName ?? 'United Tigers'),
                                if (record.seasonYear != null) Text('${record.seasonYear}'),
                              ],
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
    );
  }
}

class PointsPage extends StatefulWidget {
  const PointsPage({super.key});

  @override
  State<PointsPage> createState() => _PointsPageState();
}

class _PointsPageState extends State<PointsPage> {
  List<PointsRow> rows = [];
  bool loading = true;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    ClubScope.of(context).api.fetchPoints().then((data) {
      if (mounted) setState(() { rows = data; loading = false; });
    }).catchError((_) {
      if (mounted) setState(() => loading = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('POINTS')),
      body: loading
          ? const LoadingView()
          : rows.isEmpty
              ? const Center(child: Text('The table appears after completed matches.'))
              : ListView(
                  children: rows
                      .map(
                        (row) => ListTile(
                          leading: Text('${row.position}'),
                          title: Text(row.teamName),
                          subtitle: Text('P ${row.played}  W ${row.won}  L ${row.lost}  NRR ${row.netRunRate.toStringAsFixed(3)}'),
                          trailing: Text('${row.points}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
                        ),
                      )
                      .toList(),
                ),
    );
  }
}
