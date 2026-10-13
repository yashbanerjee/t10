import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:united_tigers/models.dart';

enum NoticeKind { contest, poll, news }

/// One entry in the in-app Notifications list, built from content the club has published.
class ClubNotice {
  const ClubNotice({required this.kind, required this.key, required this.title, required this.body, this.date, this.image, required this.source});

  final NoticeKind kind;
  final String key;
  final String title;
  final String body;
  final DateTime? date;
  final String? image;
  final Object source;
}

/// Lists open contests, open polls and news, and remembers on the device which ones the fan has already seen.
class NoticeInbox extends ChangeNotifier {
  NoticeInbox._();
  static final instance = NoticeInbox._();

  static const _prefsKey = 'seen_notices';
  static const _newsLimit = 10;

  Set<String> _seen = {};
  bool _loaded = false;

  Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _seen = (prefs.getStringList(_prefsKey) ?? const []).toSet();
    } catch (_) {}
    _loaded = true;
    notifyListeners();
  }

  List<ClubNotice> notices(ClubCatalog catalog) {
    final now = DateTime.now();
    bool open(DateTime? closesAt) => closesAt == null || closesAt.isAfter(now);
    final items = <ClubNotice>[
      for (final contest in catalog.contests.where((item) => open(item.closesAt)))
        ClubNotice(
          kind: NoticeKind.contest,
          key: 'contest:${contest.slug}',
          title: contest.title,
          body: contest.prize == null ? contest.description : 'Prize: ${contest.prize}. ${contest.description}',
          date: contest.createdAt,
          image: contest.image,
          source: contest,
        ),
      for (final poll in catalog.polls.where((item) => open(item.closesAt)))
        ClubNotice(kind: NoticeKind.poll, key: 'poll:${poll.slug}', title: poll.question, body: poll.description ?? 'Cast your vote.', date: poll.createdAt, source: poll),
      for (final story in catalog.news.take(_newsLimit))
        ClubNotice(kind: NoticeKind.news, key: 'news:${story.slug}', title: story.title, body: story.excerpt, date: story.publishedAt, image: story.coverImage, source: story),
    ];
    final epoch = DateTime.fromMillisecondsSinceEpoch(0);
    items.sort((left, right) => (right.date ?? epoch).compareTo(left.date ?? epoch));
    return items;
  }

  bool isUnread(ClubNotice notice) => _loaded && !_seen.contains(notice.key);

  int unreadCount(ClubCatalog catalog) => notices(catalog).where(isUnread).length;

  Future<void> markSeen(Iterable<ClubNotice> items) async {
    final before = _seen.length;
    _seen = {..._seen, ...items.map((item) => item.key)};
    if (_seen.length == before) return;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_prefsKey, _seen.toList());
    } catch (_) {}
  }
}
