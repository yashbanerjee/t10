import 'package:flutter/material.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/widgets.dart';

bool isOpen(DateTime? closesAt) => closesAt == null || closesAt.isAfter(DateTime.now());

/// Polls and contests, as on the website's Vote page.
class VotePage extends StatelessWidget {
  const VotePage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: const ClubAppBar('Vote'),
      body: AnimatedBuilder(
        animation: api,
        builder: (context, _) {
          final open = api.catalog.polls.where((poll) => isOpen(poll.closesAt)).toList();
          final closed = api.catalog.polls.where((poll) => !isOpen(poll.closesAt)).toList();
          final contests = api.catalog.contests;
          return RefreshIndicator(
            color: pink,
            onRefresh: api.refresh,
            child: ListView(
              scrollCacheExtent: pageCacheExtent,
              padding: EdgeInsets.zero,
              children: [
                const PageHero(
                  eyebrow: 'The vote',
                  title: 'Your call,\nTigers.',
                  intro: 'Pick your player of the match, have your say on the big club questions and enter club contests. One vote and one entry per fan, and your details stay with the team.',
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SectionTitle('Cast vote'),
                      if (open.isEmpty)
                        const EmptyPanel(title: 'No poll is open right now.', message: 'The next vote opens on match day. Check back after the first ball.')
                      else
                        ...open.map((poll) => Padding(padding: const EdgeInsets.only(bottom: 12), child: _PollCard(poll: poll))),
                      const SectionTitle('The prize'),
                      if (contests.isEmpty)
                        const EmptyPanel(title: 'The next contest is still in the dugout.')
                      else
                        ...contests.map((contest) => Padding(padding: const EdgeInsets.only(bottom: 12), child: _ContestCard(contest: contest))),
                      if (closed.isNotEmpty) ...[
                        const SectionTitle('Closed polls'),
                        ...closed.map((poll) => Padding(padding: const EdgeInsets.only(bottom: 12), child: _PollCard(poll: poll))),
                      ],
                    ],
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

class _PollCard extends StatelessWidget {
  const _PollCard({required this.poll});
  final Poll poll;

  @override
  Widget build(BuildContext context) {
    final open = isOpen(poll.closesAt);
    return ClubCard(
      highlight: open,
      onTap: () => openPoll(context, poll),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [StatusChip(open ? 'OPEN' : 'CLOSED'), const Spacer(), if (poll.totalVotes > 0) Text('${poll.totalVotes} ${poll.totalVotes == 1 ? 'vote' : 'votes'}', style: const TextStyle(color: Color(0xFFCDBFDD), fontSize: 12))]),
          const SizedBox(height: 12),
          Text(poll.question.toUpperCase(), style: displayStyle(24, color: Colors.white)),
          const SizedBox(height: 8),
          Text(poll.options.map((option) => option.label).join('  ·  '), style: const TextStyle(color: Color(0xFFD9CCE6))),
          const SizedBox(height: 14),
          Row(children: [Text(open ? 'VOTE' : 'SEE THE RESULT', style: const TextStyle(color: goldLight, fontWeight: FontWeight.w900, letterSpacing: 1)), const SizedBox(width: 6), const Icon(Icons.arrow_outward, size: 15, color: goldLight)]),
        ],
      ),
    );
  }
}

class _ContestCard extends StatelessWidget {
  const _ContestCard({required this.contest});
  final Contest contest;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final open = isOpen(contest.closesAt);
    return ClubCard(
      padding: EdgeInsets.zero,
      onTap: () => openContest(context, contest),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (contest.image != null) RemoteImage(api.media(contest.image), height: 150, radius: 16),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _PrizeTag(open ? contest.prize ?? 'Club contest' : 'Closed'),
                const SizedBox(height: 12),
                Text(contest.title.toUpperCase(), style: displayStyle(24, color: Colors.white)),
                const SizedBox(height: 8),
                Text(contest.description, style: const TextStyle(color: Color(0xFFD9CCE6))),
                const SizedBox(height: 14),
                Row(children: [Text(open ? 'ENTER' : 'VIEW', style: const TextStyle(color: goldLight, fontWeight: FontWeight.w900, letterSpacing: 1)), const SizedBox(width: 6), const Icon(Icons.arrow_outward, size: 15, color: goldLight)]),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PrizeTag extends StatelessWidget {
  const _PrizeTag(this.label);
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(gradient: goldSurface, borderRadius: BorderRadius.circular(10)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [const Icon(Icons.emoji_events_rounded, size: 14, color: ink), const SizedBox(width: 5), Text(label.toUpperCase(), style: const TextStyle(color: ink, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.6))]),
    );
  }
}

/// The Fan Zone has no content of its own yet, so it announces itself and points fans to the Vote screen.
class FanZonePage extends StatelessWidget {
  const FanZonePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const ClubAppBar('Fan Zone'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: [
          const PageHero(eyebrow: 'Fan zone', title: 'Fan zone is\ncoming soon.', intro: 'A home for Tigers supporters is on its way. Until it opens, you can vote in club polls and enter contests on the Vote page.'),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 28),
            child: ClubCard(
              highlight: true,
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Image.asset('assets/brand/tiger-gold.png', height: 56 * clubScale(context)),
                  const SizedBox(height: 16),
                  GoldText('STAY TUNED, TIGERS.', style: displayStyle(30)),
                  const SizedBox(height: 10),
                  const Text('We will announce the Fan Zone on our social channels as soon as it is ready.', style: TextStyle(color: Color(0xFFE6DDF0))),
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const VotePage())),
                    icon: const Icon(Icons.how_to_vote_rounded),
                    label: const Text('VOTE & CONTESTS'),
                  ),
                ],
              ),
            ),
          ),
        ],
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
    if (current == null) return const Scaffold(appBar: ClubAppBar('Vote'), body: LoadingView());
    final open = isOpen(current.closesAt);
    return Scaffold(
      appBar: const ClubAppBar('Vote'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: [
          PageHero(
            eyebrow: open ? 'Open now' : 'Closed',
            title: current.question,
            intro: [if (current.description != null) current.description!, if (current.closesAt != null) '${open ? 'Closes' : 'Closed'} ${when(current.closesAt)}'].join('\n'),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SectionTitle(open ? 'Pick one' : 'The result'),
                ...current.options.map((option) {
                  final share = current.totalVotes == 0 ? 0.0 : option.votes / current.totalVotes;
                  final selected = choice == option.id;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: ClubCard(
                      highlight: selected,
                      onTap: open ? () => setState(() => choice = option.id) : null,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(selected ? Icons.radio_button_checked : Icons.radio_button_off, color: selected ? goldLight : const Color(0xFFBDAED0), size: 20),
                              const SizedBox(width: 10),
                              Expanded(child: Text(option.label, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15.5))),
                              Text('${(share * 100).round()}%', style: const TextStyle(color: goldLight, fontWeight: FontWeight.w900)),
                            ],
                          ),
                          const SizedBox(height: 10),
                          _ShareBar(share: share),
                        ],
                      ),
                    ),
                  );
                }),
                if (open) ...[
                  const SectionTitle('Your details'),
                  ClubField(label: 'Name', controller: name),
                  ClubField(label: 'Email', controller: email, email: true),
                  ClubField(label: 'Phone', controller: phone, phone: true),
                  const SizedBox(height: 4),
                  FilledButton(onPressed: busy || choice == null ? null : () => _submit(current), child: Text(busy ? 'SENDING…' : 'CAST VOTE')),
                  const SizedBox(height: 10),
                  const Text('One vote per email. Your details stay with the team.', style: TextStyle(color: Color(0xFFBDAED0), fontSize: 12.5)),
                ],
              ],
            ),
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

class _ShareBar extends StatelessWidget {
  const _ShareBar({required this.share});
  final double share;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: SizedBox(
        height: 8,
        child: Stack(
          children: [
            Container(color: Colors.white.withValues(alpha: 0.08)),
            FractionallySizedBox(widthFactor: share.clamp(0.0, 1.0), child: const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(colors: [Color(0xFFF4DB96), Color(0xFFD2A95A), pink])))),
          ],
        ),
      ),
    );
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
    if (current == null) return const Scaffold(appBar: ClubAppBar('Contest'), body: LoadingView());
    final api = ClubScope.of(context).api;
    final open = isOpen(current.closesAt);
    return Scaffold(
      appBar: const ClubAppBar('Contest'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: EdgeInsets.zero,
        children: [
          PageHero(eyebrow: current.prize ?? 'Contest', title: current.title, intro: current.description),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (current.image != null) ...[RemoteImage(api.media(current.image), height: 190, radius: 16), const SizedBox(height: 14)],
                Wrap(spacing: 8, runSpacing: 8, children: [
                  if (current.prize != null) _PrizeTag(current.prize!),
                  if (current.closesAt != null) StatusChip(open ? 'CLOSES ${when(current.closesAt).split(' · ').first.toUpperCase()}' : 'CLOSED'),
                ]),
                const SectionTitle('Your entry'),
                ClubCard(child: Text(current.prompt, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5))),
                const SizedBox(height: 14),
                if (open) ...[
                  ClubField(label: 'Name', controller: name),
                  ClubField(label: 'Email', controller: email, email: true),
                  ClubField(label: 'Phone', controller: phone, phone: true),
                  ClubField(label: 'Your answer', controller: answer, lines: 4),
                  FilledButton(style: goldButtonStyle(), onPressed: busy ? null : () => _submit(current), child: Text(busy ? 'SENDING…' : 'ENTER NOW')),
                  const SizedBox(height: 10),
                  const Text('One entry per email. Winners are contacted using the details on their entry.', style: TextStyle(color: Color(0xFFBDAED0), fontSize: 12.5)),
                ] else
                  const EmptyPanel(title: 'This contest has closed.', message: 'Keep an eye on the Vote page for the next one.'),
              ],
            ),
          ),
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
