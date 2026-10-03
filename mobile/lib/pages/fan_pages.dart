import 'package:flutter/material.dart';
import 'package:united_tigers/api.dart';
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
          final polls = asList(api.home['polls']);
          final contests = asList(api.home['contests']);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('Vote in the club poll and enter a contest. Your name, email and phone stay with the team.'),
              const SectionTitle('THE VOTE'),
              ...polls.map((poll) => Padding(padding: const EdgeInsets.only(bottom: 8), child: ClubCard(onTap: () => openPoll(context, poll), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('OPEN', style: TextStyle(color: gold, fontSize: 11, fontWeight: FontWeight.w800)), Text(poll['question'].toString(), style: const TextStyle(fontWeight: FontWeight.w800)), Text(asList(poll['options']).map((option) => option['label']).join(' · '))])))),
              const SectionTitle('THE PRIZE'),
              ...contests.map((contest) => Padding(padding: const EdgeInsets.only(bottom: 8), child: ClubCard(onTap: () => openContest(context, contest), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(contest['prize']?.toString() ?? 'CONTEST', style: const TextStyle(color: gold, fontSize: 11, fontWeight: FontWeight.w800)), Text(contest['title'].toString(), style: const TextStyle(fontWeight: FontWeight.w800)), Text(plain(contest['description']))])))),
            ],
          );
        },
      ),
    );
  }
}

void openPoll(BuildContext context, Map<String, dynamic> poll) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => PollPage(poll: poll)));
}

class PollPage extends StatefulWidget {
  const PollPage({super.key, required this.poll});
  final Map<String, dynamic> poll;
  @override
  State<PollPage> createState() => _PollPageState();
}

class _PollPageState extends State<PollPage> {
  String? choice;
  final name = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();
  bool busy = false;

  @override
  void dispose() {
    name.dispose();
    email.dispose();
    phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final options = asList(widget.poll['options']);
    final total = options.fold<int>(0, (sum, option) => sum + (int.tryParse(option['votes'].toString()) ?? 0));
    return Scaffold(
      appBar: AppBar(title: const Text('VOTE')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(widget.poll['question'].toString(), style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
          if (plain(widget.poll['description']).isNotEmpty) Text(plain(widget.poll['description'])),
          const SizedBox(height: 12),
          ...options.map((option) {
            final votes = int.tryParse(option['votes'].toString()) ?? 0;
            final share = total == 0 ? 0.0 : votes / total;
            final selected = choice == option['id'].toString();
            return ListTile(
              contentPadding: EdgeInsets.zero,
              selected: selected,
              onTap: () => setState(() => choice = option['id'].toString()),
              leading: Icon(selected ? Icons.radio_button_checked : Icons.radio_button_off, color: selected ? orange : null),
              title: Text(option['label'].toString()),
              subtitle: LinearProgressIndicator(value: share),
              trailing: Text('${(share * 100).round()}%'),
            );
          }),
          ClubField(label: 'Name', controller: name),
          ClubField(label: 'Email', controller: email, email: true),
          ClubField(label: 'Phone', controller: phone, phone: true),
          FilledButton(onPressed: busy || choice == null ? null : () async {
            setState(() => busy = true);
            try {
              final message = await ClubScope.of(context).api.post('/api/v1/polls/${widget.poll['slug']}/vote', {'optionId': choice, 'name': name.text.trim(), 'email': email.text.trim(), 'phone': phone.text.trim()});
              if (context.mounted) await showClubMessage(context, message);
            } catch (reason) {
              if (context.mounted) await showClubMessage(context, reason.toString().replaceFirst('Exception: ', ''));
            } finally {
              if (mounted) setState(() => busy = false);
            }
          }, child: Text(busy ? 'SENDING…' : 'CAST YOUR VOTE')),
        ],
      ),
    );
  }
}

void openContest(BuildContext context, Map<String, dynamic> contest) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => ContestPage(contest: contest)));
}

class ContestPage extends StatefulWidget {
  const ContestPage({super.key, required this.contest});
  final Map<String, dynamic> contest;
  @override
  State<ContestPage> createState() => _ContestPageState();
}

class _ContestPageState extends State<ContestPage> {
  final name = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();
  final answer = TextEditingController();
  bool busy = false;

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
    return Scaffold(
      appBar: AppBar(title: Text(widget.contest['title'].toString())),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (widget.contest['prize'] != null) Text('Prize · ${widget.contest['prize']}', style: const TextStyle(color: gold, fontWeight: FontWeight.w800)),
          Text(plain(widget.contest['description'])),
          const SizedBox(height: 8),
          Text(plain(widget.contest['prompt']), style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ClubField(label: 'Name', controller: name),
          ClubField(label: 'Email', controller: email, email: true),
          ClubField(label: 'Phone', controller: phone, phone: true),
          ClubField(label: 'Your answer', controller: answer, lines: 4),
          FilledButton(onPressed: busy ? null : () async {
            setState(() => busy = true);
            try {
              final message = await ClubScope.of(context).api.post('/api/v1/contests/${widget.contest['slug']}/enter', {'name': name.text.trim(), 'email': email.text.trim(), 'phone': phone.text.trim(), 'answer': answer.text.trim()});
              if (context.mounted) await showClubMessage(context, message);
            } catch (reason) {
              if (context.mounted) await showClubMessage(context, reason.toString().replaceFirst('Exception: ', ''));
            } finally {
              if (mounted) setState(() => busy = false);
            }
          }, child: Text(busy ? 'SENDING…' : 'ENTER NOW')),
        ],
      ),
    );
  }
}
