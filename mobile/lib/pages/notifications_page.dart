import 'package:flutter/material.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/pages/fan_pages.dart';
import 'package:united_tigers/pages/more_pages.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/services/notice_inbox.dart';
import 'package:united_tigers/services/push.dart';
import 'package:united_tigers/widgets.dart';

/// Club alerts, contests, polls and news the club has published, newest first.
class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final inbox = NoticeInbox.instance;
  Set<String>? fresh;

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: const ClubAppBar('Notifications'),
      body: AnimatedBuilder(
        animation: Listenable.merge([api, inbox]),
        builder: (context, _) {
          final notices = inbox.notices(api.catalog);
          if (fresh == null && !api.catalog.isEmpty) {
            fresh = notices
                .where(inbox.isUnread)
                .map((notice) => notice.key)
                .toSet();
            WidgetsBinding.instance.addPostFrameCallback(
              (_) => inbox.markSeen(notices),
            );
          }
          return RefreshIndicator(
            color: pink,
            onRefresh: api.refresh,
            child: ListView(
              scrollCacheExtent: pageCacheExtent,
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
              children: [
                if (notices.isEmpty)
                  const EmptyPanel(
                    title: 'You are all caught up.',
                    message:
                        'Club alerts, new contests, polls and club news will appear here.',
                  )
                else
                  for (final notice in notices)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _NoticeCard(
                        notice: notice,
                        fresh: fresh?.contains(notice.key) ?? false,
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

class _NoticeCard extends StatelessWidget {
  const _NoticeCard({required this.notice, required this.fresh});
  final ClubNotice notice;
  final bool fresh;

  static const _labels = {
    NoticeKind.alert: 'CLUB ALERT',
    NoticeKind.contest: 'FAN CONTEST',
    NoticeKind.poll: 'POLL',
    NoticeKind.news: 'NEWS',
  };
  static const _icons = {
    NoticeKind.alert: Icons.notifications_active_rounded,
    NoticeKind.contest: Icons.emoji_events_rounded,
    NoticeKind.poll: Icons.how_to_vote_rounded,
    NoticeKind.news: Icons.article_rounded,
  };

  void _open(BuildContext context) {
    switch (notice.source) {
      case final ClubAlert alert:
        ClubPush.openLink(context, alert.link);
      case final Contest contest:
        openContest(context, contest);
      case final Poll poll:
        openPoll(context, poll);
      case final NewsStory story:
        openStory(context, story);
    }
  }

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return ClubCard(
      highlight: fresh,
      onTap: () => _open(context),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox.square(
              dimension: 56,
              child: notice.image == null
                  ? DecoratedBox(
                      decoration: const BoxDecoration(gradient: goldSurface),
                      child: Icon(_icons[notice.kind], color: ink, size: 26),
                    )
                  : Image.network(
                      api.media(notice.image),
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => const DecoratedBox(
                        decoration: BoxDecoration(gradient: goldSurface),
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      _labels[notice.kind]!,
                      style: const TextStyle(
                        color: goldLight,
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                    if (fresh) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: pink,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'NEW',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                    ],
                    const Spacer(),
                    if (notice.date != null)
                      Text(
                        when(notice.date).split(' · ').first,
                        style: const TextStyle(
                          color: Color(0xFFBDAED0),
                          fontSize: 11,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  notice.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (notice.body.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    notice.body,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFFD9CCE6),
                      fontSize: 13,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
