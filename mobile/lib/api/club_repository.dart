import 'package:united_tigers/api/api_client.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';

/// Loads the same public collections the website reads for each screen.
class ClubRepository {
  ClubRepository(this.client);

  final ApiClient client;

  Future<ClubCatalog> loadCatalog() async {
    final results = await Future.wait([
      client.get('/api/v1/players'),
      client.get('/api/v1/staff'),
      client.get('/api/v1/matches'),
      client.get('/api/v1/news'),
      client.get('/api/v1/updates'),
      client.get('/api/v1/products'),
      client.get('/api/v1/polls'),
      client.get('/api/v1/contests'),
      client.get('/api/v1/gallery'),
      client.get('/api/v1/sponsors'),
    ]);
    return ClubCatalog(
      players: Player.list(results[0]),
      staff: StaffMember.list(results[1]),
      matches: ClubMatch.list(results[2]),
      news: NewsStory.list(results[3]),
      updates: TeamUpdate.list(results[4]),
      products: Product.list(results[5]),
      polls: Poll.list(results[6]),
      contests: Contest.list(results[7]),
      gallery: GalleryItem.list(results[8]),
      sponsors: Sponsor.list(results[9]),
    );
  }

  Future<SiteContent> loadSettings() async {
    final data = await client.get('/api/v1/settings');
    final settings = data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};
    final legal = settings['legal'] is Map ? Map<String, dynamic>.from(settings['legal'] as Map) : <String, dynamic>{};
    return SiteContent(banner: HomeBanner.fromJson(settings['homepage']), brochure: asText(settings['brochure']), privacy: LegalPage.fromJson(legal['privacy']), terms: LegalPage.fromJson(legal['terms']));
  }

  Future<Player> player(String slug) async => Player.fromJson(_map(await client.get('/api/v1/players/$slug')));

  Future<PlayerReport> playerStats(String slug) async => PlayerReport.fromJson(await client.get('/api/v1/players/$slug/stats'));

  Future<TeamUpdate> update(String slug) async => TeamUpdate.fromJson(_map(await client.get('/api/v1/updates/$slug')));

  Future<ClubMatch> match(String slug) async => ClubMatch.fromJson(_map(await client.get('/api/v1/matches/$slug')));

  Future<NewsStory> news(String slug) async => NewsStory.fromJson(_map(await client.get('/api/v1/news/$slug')));

  Future<Product> product(String slug) async => Product.fromJson(_map(await client.get('/api/v1/products/$slug')));

  Future<Poll> poll(String slug) async => Poll.fromJson(_map(await client.get('/api/v1/polls/$slug')));

  Future<Contest> contest(String slug) async => Contest.fromJson(_map(await client.get('/api/v1/contests/$slug')));

  Future<List<PlayerStat>> stats({int season = 2026}) async => PlayerStat.list(await client.get('/api/v1/stats/players?season=$season'));

  Future<List<ClubRecord>> records() async => ClubRecord.list(await client.get('/api/v1/records'));

  Future<List<PointsRow>> points() async => PointsRow.list(await client.get('/api/v1/points'));

  Future<List<Franchise>> franchises() async => Franchise.list(await client.get('/api/v1/franchises'));

  Future<TrackedOrder> trackOrder(String number, String email) async => TrackedOrder.fromJson(_map(await client.postData('/api/v1/shop/track', {'number': number, 'email': email})));

  /// Returns the brochure link when the club has uploaded one.
  Future<String?> partnerRequest(Map<String, dynamic> payload) async => asText(_map(await client.postData('/api/v1/partners/brochure', payload))['brochureUrl']);

  Future<String> contact(Map<String, dynamic> payload) => client.post('/api/v1/contact', payload);

  Future<String> vote(String slug, Map<String, dynamic> payload) => client.post('/api/v1/polls/$slug/vote', payload);

  Future<String> enterContest(String slug, Map<String, dynamic> payload) => client.post('/api/v1/contests/$slug/enter', payload);

  /// Reserves the stock and opens a Stripe session; the order only counts once Stripe reports it paid.
  Future<CheckoutStart> checkout(Map<String, dynamic> payload) async => CheckoutStart.fromJson(_map(await client.postData('/api/v1/shop/checkout', payload)));

  /// Closes an unpaid Stripe session and frees the stock. Returns the order's payment status ('PAID' if it was paid after all).
  Future<String?> cancelCheckout(String orderId) async => asText(_map(await client.postData('/api/v1/shop/checkout/cancel', {'orderId': orderId}))['paymentStatus']);

  Map<String, dynamic> _map(dynamic value) => Map<String, dynamic>.from(value as Map);
}
