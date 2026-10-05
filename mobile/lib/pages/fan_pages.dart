import 'package:flutter/material.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/widgets.dart';

class FanPage extends StatelessWidget {
  const FanPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: AppBar(title: const Text('FAN ZONE')),
      body: AnimatedBuilder(
        animation: api,
        builder: (context, _) {
          return RefreshIndicator(
            onRefresh: api.refresh,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('Vote in the club poll and enter a contest. Your name, email and phone stay with the team.'),
                const SectionTitle('THE VOTE'),
                ...api.catalog.polls.map(
                  (poll) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: ClubCard(
                      onTap: () => openPoll(context, poll),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('OPEN', style: TextStyle(color: gold, fontSize: 11, fontWeight: FontWeight.w800)),
                          Text(poll.question, style: const TextStyle(fontWeight: FontWeight.w800)),
                          Text(poll.options.map((option) => option.label).join(' · ')),
                        ],
                      ),
                    ),
                  ),
                ),
                const SectionTitle('THE PRIZE'),
                ...api.catalog.contests.map(
                  (contest) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: ClubCard(
                      onTap: () => openContest(context, contest),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(contest.prize ?? 'CONTEST', style: const TextStyle(color: gold, fontSize: 11, fontWeight: FontWeight.w800)),
                          Text(contest.title, style: const TextStyle(fontWeight: FontWeight.w800)),
                          Text(contest.description),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

void openPoll(BuildContext context, Poll poll) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => PollPage(slug: poll.slug, preview: poll)));
}

class PollPage extends StatefulWidget {
  const PollPage({super.key, required this.slug, this.preview});
  final String slug;
  final Poll? preview;

  @override
  State<PollPage> createState() => _PollPageState();
}

class _PollPageState extends State<PollPage> {
  Poll? poll;
  String? choice;
  final name = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();
  bool busy = false;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    poll = widget.preview;
    _load();
  }

  Future<void> _load() async {
    try {
      final loaded = await ClubScope.of(context).api.fetchPoll(widget.slug);
      if (mounted) setState(() => poll = loaded);
    } catch (_) {}
  }

  @override
  void dispose() {
    name.dispose();
    email.dispose();
    phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final current = poll;
    if (current == null) return const Scaffold(body: LoadingView());
    return Scaffold(
      appBar: AppBar(title: const Text('VOTE')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(current.question, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
          if (current.description != null) Text(current.description!),
          if (current.closesAt != null) Text('Closes ${when(current.closesAt)}'),
          const SizedBox(height: 12),
          ...current.options.map((option) {
            final share = current.totalVotes == 0 ? 0.0 : option.votes / current.totalVotes;
            final selected = choice == option.id;
            return ListTile(
              contentPadding: EdgeInsets.zero,
              selected: selected,
              onTap: () => setState(() => choice = option.id),
              leading: Icon(selected ? Icons.radio_button_checked : Icons.radio_button_off, color: selected ? orange : null),
              title: Text(option.label),
              subtitle: LinearProgressIndicator(value: share, color: gold, backgroundColor: glow),
              trailing: Text('${(share * 100).round()}%'),
            );
          }),
          ClubField(label: 'Name', controller: name),
          ClubField(label: 'Email', controller: email, email: true),
          ClubField(label: 'Phone', controller: phone, phone: true),
          FilledButton(
            onPressed: busy || choice == null ? null : () => _submit(current),
            child: Text(busy ? 'SENDING…' : 'CAST YOUR VOTE'),
          ),
        ],
      ),
    );
  }

  Future<void> _submit(Poll current) async {
    setState(() => busy = true);
    try {
      final message = await ClubScope.of(context).api.sendVote(current.slug, {
        'optionId': choice,
        'name': name.text.trim(),
        'email': email.text.trim(),
        'phone': phone.text.trim(),
      });
      if (mounted) await showClubMessage(context, message);
      await _load();
    } catch (reason) {
      if (mounted) await showClubMessage(context, '$reason'.replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}

void openContest(BuildContext context, Contest contest) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => ContestPage(slug: contest.slug, preview: contest)));
}

class ContestPage extends StatefulWidget {
  const ContestPage({super.key, required this.slug, this.preview});
  final String slug;
  final Contest? preview;

  @override
  State<ContestPage> createState() => _ContestPageState();
}

class _ContestPageState extends State<ContestPage> {
  Contest? contest;
  final name = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();
  final answer = TextEditingController();
  bool busy = false;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    contest = widget.preview;
    _load();
  }

  Future<void> _load() async {
    try {
      final loaded = await ClubScope.of(context).api.fetchContest(widget.slug);
      if (mounted) setState(() => contest = loaded);
    } catch (_) {}
  }

  @override
  void dispose() {
    name.dispose();
    email.dispose();
    phone.dispose();
    answer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final current = contest;
    if (current == null) return const Scaffold(body: LoadingView());
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: AppBar(title: Text(current.title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (current.image != null) RemoteImage(api.media(current.image), height: 180),
          if (current.prize != null) Text('Prize · ${current.prize}', style: const TextStyle(color: gold, fontWeight: FontWeight.w800)),
          Text(current.description),
          const SizedBox(height: 8),
          Text(current.prompt, style: const TextStyle(fontWeight: FontWeight.w700)),
          if (current.closesAt != null) Text('Closes ${when(current.closesAt)}'),
          const SizedBox(height: 12),
          ClubField(label: 'Name', controller: name),
          ClubField(label: 'Email', controller: email, email: true),
          ClubField(label: 'Phone', controller: phone, phone: true),
          ClubField(label: 'Your answer', controller: answer, lines: 4),
          FilledButton(onPressed: busy ? null : () => _submit(current), child: Text(busy ? 'SENDING…' : 'ENTER NOW')),
        ],
      ),
    );
  }

  Future<void> _submit(Contest current) async {
    setState(() => busy = true);
    try {
      final message = await ClubScope.of(context).api.sendEntry(current.slug, {
        'name': name.text.trim(),
        'email': email.text.trim(),
        'phone': phone.text.trim(),
        'answer': answer.text.trim(),
      });
      if (mounted) await showClubMessage(context, message);
    } catch (reason) {
      if (mounted) await showClubMessage(context, '$reason'.replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}
