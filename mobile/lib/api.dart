import 'package:flutter/foundation.dart';
import 'package:united_tigers/api/admin_repository.dart';
import 'package:united_tigers/api/api_client.dart';
import 'package:united_tigers/api/club_repository.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/models/admin_models.dart';

class ClubApi extends ChangeNotifier {
  ClubApi() : client = ApiClient() {
    repository = ClubRepository(client);
    admin = AdminRepository(client);
    _load();
  }

  final ApiClient client;
  late ClubRepository repository;
  late AdminRepository admin;
  String? error;
  bool loading = true;
  ClubCatalog catalog = ClubCatalog.empty;
  HomeBanner banner = HomeBanner.fallback;
  AdminSession? adminSession;

  String get base => client.base;

  Future<void> _load() async {
    await client.loadSavedBase();
    await client.loadToken();
    await refresh();
    await restoreAdmin();
  }

  Future<void> restoreAdmin() async {
    if (client.token == null || client.token!.isEmpty) return;
    try {
      adminSession = await admin.me();
    } catch (_) {
      adminSession = null;
      await client.clearToken();
    }
    notifyListeners();
  }

  Future<void> signIn(String email, String password) async {
    adminSession = await admin.signIn(email, password);
    notifyListeners();
  }

  Future<void> signOut() async {
    await admin.signOut();
    adminSession = null;
    notifyListeners();
  }

  Future<void> setBase(String value) async {
    await client.saveBase(value);
    notifyListeners();
    await refresh();
  }

  String media(String? path) => client.media(path);

  Future<String> post(String path, Map<String, dynamic> payload) => client.post(path, payload);

  Future<String> sendContact(Map<String, dynamic> payload) => repository.contact(payload);

  Future<String> sendVote(String slug, Map<String, dynamic> payload) => repository.vote(slug, payload);

  Future<String> sendEntry(String slug, Map<String, dynamic> payload) => repository.enterContest(slug, payload);

  Future<String> sendOrder(Map<String, dynamic> payload) => repository.checkout(payload);

  Future<void> refresh() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final loaded = await Future.wait([
        repository.loadCatalog(),
        repository.loadBanner().catchError((_) => HomeBanner.fallback),
      ]);
      catalog = loaded[0] as ClubCatalog;
      banner = loaded[1] as HomeBanner;
    } catch (reason) {
      error = reason.toString().replaceFirst('Exception: ', '');
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Poll? get featuredPoll {
    if (catalog.polls.isEmpty) return null;
    int matches(Poll poll) => poll.options.where((option) => _matchesPlayer(option.label)).length;
    final ranked = [...catalog.polls]..sort((left, right) => matches(right).compareTo(matches(left)));
    return ranked.first;
  }

  bool _matchesPlayer(String label) {
    final needle = label.trim().toLowerCase();
    return catalog.players.any((player) {
      final name = player.fullName.toLowerCase();
      return name == needle || needle.contains(name) || name.contains(needle);
    });
  }

  Future<Player> fetchPlayer(String slug) => repository.player(slug);

  Future<PlayerReport> fetchPlayerStats(String slug) => repository.playerStats(slug);

  Future<TeamUpdate> fetchUpdate(String slug) => repository.update(slug);

  Future<ClubMatch> fetchMatch(String slug) => repository.match(slug);

  Future<NewsStory> fetchNews(String slug) => repository.news(slug);

  Future<Product> fetchProduct(String slug) => repository.product(slug);

  Future<Poll> fetchPoll(String slug) => repository.poll(slug);

  Future<Contest> fetchContest(String slug) => repository.contest(slug);

  Future<List<PlayerStat>> fetchStats() => repository.stats();

  Future<List<ClubRecord>> fetchRecords() => repository.records();

  Future<List<PointsRow>> fetchPoints() => repository.points();
}
