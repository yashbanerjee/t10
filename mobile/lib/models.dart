import 'package:united_tigers/format.dart';

class Player {
  const Player({
    required this.id,
    required this.slug,
    required this.fullName,
    this.shortName,
    this.displayName,
    this.profileImage,
    this.coverImage,
    this.jerseyNumber,
    this.country,
    this.nationality,
    this.dateOfBirth,
    this.role,
    this.battingStyle,
    this.bowlingStyle,
    this.heightCm,
    this.bio,
    this.isCaptain = false,
    this.isViceCaptain = false,
    this.isIconPlayer = false,
    this.t20Record,
    this.allT20Record,
  });

  final String id;
  final String slug;
  final String fullName;
  final String? shortName;
  final String? displayName;
  final String? profileImage;
  final String? coverImage;
  final int? jerseyNumber;
  final String? country;
  final String? nationality;
  final DateTime? dateOfBirth;
  final String? role;
  final String? battingStyle;
  final String? bowlingStyle;
  final int? heightCm;
  final String? bio;
  final bool isCaptain;
  final bool isViceCaptain;
  final bool isIconPlayer;

  /// T20 International record; never merged into club figures.
  final FigureSet? t20Record;

  /// Every recognised T20 the player has played: domestic, franchise and international.
  final FigureSet? allT20Record;

  String get heading => displayName ?? fullName;
  String get badge {
    if (isCaptain) return 'CAPTAIN';
    if (isViceCaptain) return 'VICE CAPTAIN';
    if (isIconPlayer) return 'ICON PLAYER';
    return 'UNITED TIGERS';
  }

  factory Player.fromJson(Map<String, dynamic> json) => Player(
        id: json['id']?.toString() ?? '',
        slug: json['slug']?.toString() ?? '',
        fullName: json['fullName']?.toString() ?? 'Player',
        shortName: asText(json['shortName']),
        displayName: asText(json['displayName']),
        profileImage: asText(json['profileImage']),
        coverImage: asText(json['coverImage']),
        jerseyNumber: json['jerseyNumber'] == null ? null : asInt(json['jerseyNumber']),
        country: asText(json['country']),
        nationality: asText(json['nationality']),
        dateOfBirth: asDate(json['dateOfBirth']),
        role: asText(json['role']),
        battingStyle: asText(json['battingStyle']),
        bowlingStyle: asText(json['bowlingStyle']),
        heightCm: json['heightCm'] == null ? null : asInt(json['heightCm']),
        bio: readable(json['bio']).isEmpty ? null : readable(json['bio']),
        isCaptain: asBool(json['isCaptain']),
        isViceCaptain: asBool(json['isViceCaptain']),
        isIconPlayer: asBool(json['isIconPlayer']),
        t20Record: json['t20Record'] is Map ? FigureSet.fromRecord(json['t20Record']) : null,
        allT20Record: json['allT20Record'] is Map ? FigureSet.fromRecord(json['allT20Record']) : null,
      );

  static List<Player> list(dynamic value) => asList(value).map(Player.fromJson).toList();
}

class StaffMember {
  const StaffMember({required this.fullName, required this.title, required this.category, this.bio, this.profileImage, this.facebook, this.instagram});

  final String fullName;
  final String title;
  final String category;
  final String? bio;
  final String? profileImage;
  final String? facebook;
  final String? instagram;

  factory StaffMember.fromJson(Map<String, dynamic> json) => StaffMember(
        fullName: json['fullName']?.toString() ?? 'Staff',
        title: json['title']?.toString() ?? '',
        category: json['category']?.toString() ?? '',
        bio: readable(json['bio']).isEmpty ? null : readable(json['bio']),
        profileImage: asText(json['profileImage']),
        facebook: asText(json['facebook']),
        instagram: asText(json['instagram']),
      );

  static List<StaffMember> list(dynamic value) => asList(value).map(StaffMember.fromJson).toList();
}

class BatterLine {
  const BatterLine({required this.name, required this.runs, required this.balls, required this.fours, required this.sixes, this.dismissal});

  final String name;
  final int runs;
  final int balls;
  final int fours;
  final int sixes;
  final String? dismissal;

  factory BatterLine.fromJson(Map<String, dynamic> json) {
    final player = asMap(json['player']);
    return BatterLine(
      name: player['fullName']?.toString() ?? 'Batter',
      runs: asInt(json['runs']),
      balls: asInt(json['balls']),
      fours: asInt(json['fours']),
      sixes: asInt(json['sixes']),
      dismissal: asText(json['dismissal']),
    );
  }
}

class BowlerLine {
  const BowlerLine({required this.name, required this.overs, required this.maidens, required this.runs, required this.wickets});

  final String name;
  final String overs;
  final int maidens;
  final int runs;
  final int wickets;

  factory BowlerLine.fromJson(Map<String, dynamic> json) {
    final player = asMap(json['player']);
    return BowlerLine(
      name: player['fullName']?.toString() ?? 'Bowler',
      overs: json['overs']?.toString() ?? '0',
      maidens: asInt(json['maidens']),
      runs: asInt(json['runs']),
      wickets: asInt(json['wickets']),
    );
  }
}

class InningsCard {
  const InningsCard({required this.number, required this.battingTeam, required this.runs, required this.wickets, required this.overs, required this.batting, required this.bowling});

  final int number;
  final String battingTeam;
  final int runs;
  final int wickets;
  final String overs;
  final List<BatterLine> batting;
  final List<BowlerLine> bowling;

  String get summary => '$runs/$wickets ($overs)';

  factory InningsCard.fromJson(Map<String, dynamic> json) => InningsCard(
        number: asInt(json['number']),
        battingTeam: json['battingTeam']?.toString() ?? '',
        runs: asInt(json['runs']),
        wickets: asInt(json['wickets']),
        overs: json['overs']?.toString() ?? '0',
        batting: asList(json['batting']).map(BatterLine.fromJson).toList(),
        bowling: asList(json['bowling']).map(BowlerLine.fromJson).toList(),
      );
}

const _leagueTeams = {'arabian aces', 'emirates eagles', 'royal desert champions', 'uae bulls', 'united tigers', 'yas lions'};

/// Logo path for a 2026 Abu Dhabi T10 franchise, matching the website's league identity sheet.
String? _leagueLogo(String? name) {
  final key = (name ?? '').toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), ' ').trim();
  return _leagueTeams.contains(key) ? '/brand/teams/${key.replaceAll(' ', '-')}.png' : null;
}

class ClubMatch {
  const ClubMatch({
    required this.slug,
    required this.date,
    required this.status,
    required this.opponent,
    this.opponentShort,
    this.opponentLogoUrl,
    this.competition,
    this.venueName,
    this.venueCity,
    this.toss,
    this.result,
    this.innings = const [],
  });

  final String slug;
  final DateTime? date;
  final String status;
  final String opponent;
  final String? opponentShort;

  /// Club crest from Admin, or the league identity sheet path for the six franchises.
  final String? opponentLogoUrl;
  final String? competition;
  final String? venueName;
  final String? venueCity;
  final String? toss;
  final String? result;
  final List<InningsCard> innings;

  bool get isCompleted => status == 'COMPLETED';
  bool get isLive => status == 'LIVE';
  bool get won => RegExp(r'united tigers won', caseSensitive: false).hasMatch(result ?? '');

  /// Both sides of a knockout whose teams are not decided yet, for example "2nd Position vs 3rd Position".
  /// Null for a normal Tigers fixture.
  List<String>? get knockoutSides {
    if (!RegExp(r'qualifier|semi|eliminator|final', caseSensitive: false).hasMatch(competition ?? '')) return null;
    final sides = opponent.split(RegExp(r'\s+vs\.?\s+', caseSensitive: false)).map((side) => side.trim()).where((side) => side.isNotEmpty).toList();
    return sides.length == 2 ? sides : null;
  }

  /// One-line title: "United Tigers vs Yas Lions", or "Final: 1st Position vs Qualifier Winner".
  String get title => knockoutSides == null ? 'United Tigers vs $opponent' : '${competition ?? 'Knockout'}: $opponent';

  String get scoreLine {
    if (innings.isEmpty) return result ?? competition ?? 'Abu Dhabi T10';
    return innings.map((item) => item.summary).join(' – ');
  }

  String get statusLabel {
    if (isLive) return 'LIVE';
    if (isCompleted) return won ? 'WIN' : 'RESULT';
    return 'NEXT';
  }

  factory ClubMatch.fromJson(Map<String, dynamic> json) {
    final venue = asMap(json['venue']);
    return ClubMatch(
      slug: json['slug']?.toString() ?? '',
      date: asDate(json['date']),
      status: json['status']?.toString() ?? 'UPCOMING',
      opponent: json['opponent']?.toString() ?? 'Opponent',
      opponentShort: asText(json['opponentShort']),
      opponentLogoUrl: asText(json['opponentLogoUrl']) ?? _leagueLogo(json['opponent']?.toString()),
      competition: asText(json['competition']),
      venueName: asText(venue['name']),
      venueCity: asText(venue['city']),
      toss: asText(json['toss']),
      result: asText(json['result']),
      innings: asList(json['innings']).map(InningsCard.fromJson).toList(),
    );
  }

  static List<ClubMatch> list(dynamic value) => asList(value).map(ClubMatch.fromJson).toList();
}

class NewsStory {
  const NewsStory({required this.slug, required this.title, required this.excerpt, required this.content, this.coverImage, this.category, this.authorName, this.publishedAt, this.isFeatured = false});

  final String slug;
  final String title;
  final String excerpt;
  final String content;
  final String? coverImage;
  final String? category;
  final String? authorName;
  final DateTime? publishedAt;
  final bool isFeatured;

  factory NewsStory.fromJson(Map<String, dynamic> json) => NewsStory(
        slug: json['slug']?.toString() ?? '',
        title: json['title']?.toString() ?? 'News',
        excerpt: readable(json['excerpt']),
        content: readable(json['content']),
        coverImage: asText(json['coverImage']),
        category: asText(json['category']),
        authorName: asText(json['authorName']),
        publishedAt: asDate(json['publishedAt']),
        isFeatured: asBool(json['isFeatured']),
      );

  static List<NewsStory> list(dynamic value) => asList(value).map(NewsStory.fromJson).toList();
}

class TeamUpdate {
  const TeamUpdate({required this.slug, required this.title, required this.description, required this.content, this.image, this.video, this.category, this.publishedAt, this.playerName, this.playerImage});

  final String slug;
  final String title;
  final String description;
  final String content;
  final String? image;
  final String? video;
  final String? category;
  final DateTime? publishedAt;
  final String? playerName;
  final String? playerImage;

  TeamUpdate withImage(String image) => TeamUpdate(slug: slug, title: title, description: description, content: content, image: image, video: video, category: category, publishedAt: publishedAt, playerName: playerName, playerImage: playerImage);

  factory TeamUpdate.fromJson(Map<String, dynamic> json) {
    final player = asMap(json['player']);
    return TeamUpdate(
      slug: json['slug']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Update',
      description: readable(json['description']),
      content: readable(json['content']),
      image: asText(json['image']),
      video: asText(json['video']),
      category: asText(json['category']),
      publishedAt: asDate(json['publishedAt']),
      playerName: asText(player['fullName']),
      playerImage: asText(player['profileImage']),
    );
  }

  static List<TeamUpdate> list(dynamic value) => asList(value).map(TeamUpdate.fromJson).toList();
}

class ProductVariant {
  const ProductVariant({required this.id, required this.color, required this.size, required this.stock, this.price, this.image});

  final String id;
  final String color;
  final String size;
  final int stock;
  final double? price;
  final String? image;

  factory ProductVariant.fromJson(Map<String, dynamic> json) => ProductVariant(
        id: json['id']?.toString() ?? '',
        color: json['color']?.toString() ?? '',
        size: json['size']?.toString() ?? '',
        stock: asInt(json['stock']),
        price: json['price'] == null ? null : asDouble(json['price']),
        image: asText(json['image']),
      );
}

class Product {
  const Product({required this.slug, required this.name, required this.description, required this.price, this.image, this.category, this.isFeatured = false, this.variants = const []});

  final String slug;
  final String name;
  final String description;
  final double price;
  final String? image;
  final String? category;
  final bool isFeatured;
  final List<ProductVariant> variants;

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        slug: json['slug']?.toString() ?? '',
        name: json['name']?.toString() ?? 'Product',
        description: readable(json['description']),
        price: asDouble(json['price']),
        image: asText(json['image']),
        category: asText(json['category']),
        isFeatured: asBool(json['isFeatured']),
        variants: asList(json['variants']).map(ProductVariant.fromJson).toList(),
      );

  static List<Product> list(dynamic value) => asList(value).map(Product.fromJson).toList();
}

class ClubOwner {
  const ClubOwner({required this.slug, required this.name, required this.title, this.headline, this.summary, this.bio, this.quote, this.image, this.facebook, this.instagram});

  final String slug;
  final String name;
  final String title;
  final String? headline;
  final String? summary;
  final String? bio;
  final String? quote;
  final String? image;
  final String? facebook;
  final String? instagram;

  factory ClubOwner.fromJson(Map<String, dynamic> json) => ClubOwner(
        slug: json['slug']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        title: json['title']?.toString() ?? 'Owner',
        headline: asText(json['headline']),
        summary: asText(json['summary']),
        bio: asText(json['bio']),
        quote: asText(json['quote']),
        image: asText(json['image']),
        facebook: asText(json['facebook']),
        instagram: asText(json['instagram']),
      );

  static List<ClubOwner> list(dynamic value) => asList(value).map(ClubOwner.fromJson).toList();
}

class PollOption {
  const PollOption({required this.id, required this.label, required this.votes});

  final String id;
  final String label;
  final int votes;

  factory PollOption.fromJson(Map<String, dynamic> json) => PollOption(
        id: json['id']?.toString() ?? '',
        label: json['label']?.toString() ?? '',
        votes: asInt(json['votes']),
      );
}

class Poll {
  const Poll({required this.slug, required this.question, this.title, this.description, this.closesAt, this.createdAt, this.options = const []});

  final String slug;
  final String question;
  final String? title;
  final String? description;
  final DateTime? closesAt;
  final DateTime? createdAt;
  final List<PollOption> options;

  int get totalVotes => options.fold(0, (sum, option) => sum + option.votes);

  factory Poll.fromJson(Map<String, dynamic> json) => Poll(
        slug: json['slug']?.toString() ?? '',
        question: json['question']?.toString() ?? '',
        title: asText(json['title']),
        description: readable(json['description']).isEmpty ? null : readable(json['description']),
        closesAt: asDate(json['closesAt']),
        createdAt: asDate(json['createdAt']),
        options: asList(json['options']).map(PollOption.fromJson).toList(),
      );

  static List<Poll> list(dynamic value) => asList(value).map(Poll.fromJson).toList();
}

class Contest {
  const Contest({required this.slug, required this.title, required this.description, required this.prompt, this.prize, this.image, this.closesAt, this.createdAt, this.entries = 0});

  final String slug;
  final String title;
  final String description;
  final String prompt;
  final String? prize;
  final String? image;
  final DateTime? closesAt;
  final DateTime? createdAt;
  final int entries;

  factory Contest.fromJson(Map<String, dynamic> json) => Contest(
        slug: json['slug']?.toString() ?? '',
        title: json['title']?.toString() ?? 'Contest',
        description: readable(json['description']),
        prompt: readable(json['prompt']),
        prize: asText(json['prize']),
        image: asText(json['image']),
        closesAt: asDate(json['closesAt']),
        createdAt: asDate(json['createdAt']),
        entries: asInt(json['entries']),
      );

  static List<Contest> list(dynamic value) => asList(value).map(Contest.fromJson).toList();
}

class GalleryItem {
  const GalleryItem({required this.title, required this.mediaUrl, required this.type, this.category, this.isFeatured = false});

  final String title;
  final String mediaUrl;
  final String type;
  final String? category;
  final bool isFeatured;

  bool get isVideo => type == 'VIDEO';

  factory GalleryItem.fromJson(Map<String, dynamic> json) => GalleryItem(
        title: json['title']?.toString() ?? '',
        mediaUrl: json['mediaUrl']?.toString() ?? '',
        type: json['type']?.toString() ?? 'IMAGE',
        category: asText(json['category']),
        isFeatured: asBool(json['isFeatured']),
      );

  static List<GalleryItem> list(dynamic value) => asList(value).map(GalleryItem.fromJson).toList();
}

class Sponsor {
  const Sponsor({required this.name, this.category, this.logoUrl, this.website});

  final String name;
  final String? category;
  final String? logoUrl;
  final String? website;

  factory Sponsor.fromJson(Map<String, dynamic> json) => Sponsor(
        name: json['name']?.toString() ?? 'Partner',
        category: asText(json['category']),
        logoUrl: asText(json['logoUrl']),
        website: asText(json['website']),
      );

  static List<Sponsor> list(dynamic value) => asList(value).map(Sponsor.fromJson).toList();
}

/// A push notification the club sent from the admin, kept for the in-app Notifications list.
class ClubAlert {
  const ClubAlert({required this.id, required this.title, required this.body, this.imageUrl, this.link, this.sentAt});

  final String id;
  final String title;
  final String body;
  final String? imageUrl;
  final String? link;
  final DateTime? sentAt;

  factory ClubAlert.fromJson(Map<String, dynamic> json) => ClubAlert(
        id: json['id']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        body: json['body']?.toString() ?? '',
        imageUrl: asText(json['imageUrl']),
        link: asText(json['link']),
        sentAt: asDate(json['sentAt']),
      );

  static List<ClubAlert> list(dynamic value) => asList(value).map(ClubAlert.fromJson).where((alert) => alert.id.isNotEmpty).toList();
}

class ClubRecord {
  const ClubRecord({required this.title, required this.value, this.category, this.playerName, this.seasonYear});

  final String title;
  final String value;
  final String? category;
  final String? playerName;
  final int? seasonYear;

  factory ClubRecord.fromJson(Map<String, dynamic> json) => ClubRecord(
        title: json['title']?.toString() ?? '',
        value: json['value']?.toString() ?? '',
        category: asText(json['category']),
        playerName: asText(json['playerName']),
        seasonYear: json['seasonYear'] == null ? null : asInt(json['seasonYear']),
      );

  static List<ClubRecord> list(dynamic value) => asList(value).map(ClubRecord.fromJson).toList();
}

class PointsRow {
  const PointsRow({required this.teamName, required this.position, required this.played, required this.won, required this.lost, required this.points, required this.netRunRate});

  final String teamName;
  final int position;
  final int played;
  final int won;
  final int lost;
  final int points;
  final double netRunRate;

  factory PointsRow.fromJson(Map<String, dynamic> json) => PointsRow(
        teamName: json['teamName']?.toString() ?? '',
        position: asInt(json['position']),
        played: asInt(json['played']),
        won: asInt(json['won']),
        lost: asInt(json['lost']),
        points: asInt(json['points']),
        netRunRate: asDouble(json['netRunRate']),
      );

  static List<PointsRow> list(dynamic value) => asList(value).map(PointsRow.fromJson).toList();
}

/// One set of cricket figures in the leaderboard keys (`highestScore`, `bowlingOvers`, ...). Missing figures stay null.
class FigureSet {
  const FigureSet(this.values);
  final Map<String, dynamic> values;

  /// Reads a saved player record, whose keys use `bestScore` and `overs`.
  factory FigureSet.fromRecord(dynamic value) {
    final json = asMap(value);
    return FigureSet({...json, 'highestScore': json['bestScore'], 'bowlingOvers': json['overs']});
  }

  num? number(String key) {
    final value = values[key];
    if (value == null) return null;
    if (value is num) return value;
    return num.tryParse(value.toString());
  }

  String? text(String key) => asText(values[key]);

  bool get hasBowling => (number('wickets') ?? 0) > 0 || (number('bowlingRuns') ?? 0) > 0 || (text('bowlingOvers') ?? '0') != '0';
  bool get hasFielding => (number('catches') ?? 0) > 0 || (number('stumpings') ?? 0) > 0 || (number('runOuts') ?? 0) > 0;
  bool get played => (number('matches') ?? 0) > 0;
}

class PlayerStat {
  const PlayerStat({required this.name, required this.slug, required this.season, this.t20, this.allT20});

  final String name;
  final String slug;
  final FigureSet season;
  final FigureSet? t20;
  final FigureSet? allT20;

  int get matches => (season.number('matches') ?? 0).toInt();
  int get runs => (season.number('runs') ?? 0).toInt();
  int get wickets => (season.number('wickets') ?? 0).toInt();
  double? get average => season.number('average')?.toDouble();
  double? get strikeRate => season.number('strikeRate')?.toDouble();
  double? get economy => season.number('economy')?.toDouble();

  factory PlayerStat.fromJson(Map<String, dynamic> json) {
    final player = asMap(json['player']);
    return PlayerStat(
      name: player['fullName']?.toString() ?? 'Player',
      slug: player['slug']?.toString() ?? '',
      season: FigureSet(asMap(json['stats'])),
      t20: json['t20'] is Map ? FigureSet(asMap(json['t20'])) : null,
      allT20: json['allT20'] is Map ? FigureSet(asMap(json['allT20'])) : null,
    );
  }

  static List<PlayerStat> list(dynamic value) => asList(value).map(PlayerStat.fromJson).toList();
}

/// Public site settings the app shows: the homepage banner, the partnership brochure and the legal pages.
class SiteContent {
  const SiteContent({required this.banner, this.brochure, this.privacy, this.terms, this.themeSong, this.stripe = false, this.cashOnDelivery = false});
  final HomeBanner banner;
  final String? brochure;
  final LegalPage? privacy;
  final LegalPage? terms;
  final ThemeSong? themeSong;
  final bool stripe;
  final bool cashOnDelivery;

  bool get checkoutOpen => stripe || cashOnDelivery;

  static const fallback = SiteContent(banner: HomeBanner.fallback);
}

/// Homepage theme song: hosted audio, hosted video, or a YouTube link. Admin can change it in Site settings.
class ThemeSong {
  const ThemeSong({
    required this.title,
    required this.kind,
    required this.source,
    this.downloadUrl,
    this.fileName,
    this.poster,
  });

  final String title;
  final String kind;
  final String source;
  final String? downloadUrl;
  final String? fileName;
  final String? poster;

  bool get isYoutube => kind == 'youtube';
  bool get isVideo => kind == 'video';
  bool get isAudio => kind == 'audio' || (!isYoutube && !isVideo);
  bool get canDownload => !isYoutube && ((downloadUrl != null && downloadUrl!.isNotEmpty) || source.isNotEmpty);
  String get downloadSource => (downloadUrl != null && downloadUrl!.isNotEmpty) ? downloadUrl! : source;
  String get saveAs => (fileName != null && fileName!.trim().isNotEmpty) ? fileName!.trim() : 'united-tigers-theme';

  String? get youtubeId {
    final text = source.trim();
    final patterns = [
      RegExp(r'(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})', caseSensitive: false),
      RegExp(r'^([\w-]{11})$'),
    ];
    for (final pattern in patterns) {
      final match = pattern.firstMatch(text);
      if (match != null) return match.group(1);
    }
    return null;
  }

  String? get youtubeWatchUrl {
    final id = youtubeId;
    return id == null ? null : 'https://www.youtube.com/watch?v=$id';
  }

  static ThemeSong? fromJson(dynamic value) {
    final json = asMap(value);
    if (json.isEmpty) return null;
    final source = asText(json['source']);
    if (source == null) return null;
    final kind = asText(json['kind']) ?? 'audio';
    return ThemeSong(
      title: asText(json['title']) ?? 'Official theme song',
      kind: kind == 'video' || kind == 'youtube' ? kind : 'audio',
      source: source,
      downloadUrl: asText(json['downloadUrl']),
      fileName: asText(json['fileName']),
      poster: asText(json['poster']),
    );
  }
}

/// Privacy or Terms text, edited in Admin → Legal pages.
class LegalPage {
  const LegalPage({required this.title, required this.intro, required this.content, this.updatedOn});
  final String title;
  final String intro;
  final String content;
  final DateTime? updatedOn;

  static LegalPage? fromJson(dynamic value) {
    final json = asMap(value);
    final content = asText(json['content']);
    if (content == null) return null;
    return LegalPage(title: asText(json['title']) ?? '', intro: asText(json['intro']) ?? '', content: content, updatedOn: asDate(json['updatedOn']));
  }
}

class HomeBanner {
  const HomeBanner({
    required this.mode,
    required this.title,
    required this.accent,
    required this.tagline,
    required this.ctaLabel,
    required this.ctaHref,
    required this.image,
    required this.roar,
    this.showPlayers = true,
  });

  final String mode;
  final String title;
  final String accent;
  final String tagline;
  final String ctaLabel;
  final String ctaHref;
  final String image;
  final String roar;
  final bool showPlayers;

  bool get isImage => mode == 'image' && image.isNotEmpty;

  List<String> get titleLines {
    final words = title.trim().split(RegExp(r'\s+')).where((word) => word.isNotEmpty).toList();
    if (words.length < 2) return [title, ''];
    return [words.sublist(0, words.length - 1).join(' '), words.last];
  }

  static const fallback = HomeBanner(
    mode: 'static',
    title: 'THE NEXT GAME',
    accent: 'STARTS HERE',
    tagline: 'BIGGER BOLDER TOGETHER',
    ctaLabel: 'BACK OUR TIGERS',
    ctaHref: '/team',
    image: '',
    roar: "LET'S GO HUNT",
  );

  factory HomeBanner.fromJson(dynamic value) {
    final json = asMap(value);
    if (json.isEmpty) return fallback;
    return HomeBanner(
      mode: json['mode']?.toString() == 'image' ? 'image' : 'static',
      title: asText(json['title']) ?? fallback.title,
      accent: asText(json['accent']) ?? fallback.accent,
      tagline: asText(json['tagline']) ?? fallback.tagline,
      ctaLabel: asText(json['ctaLabel']) ?? fallback.ctaLabel,
      ctaHref: asText(json['ctaHref']) ?? fallback.ctaHref,
      image: asText(json['image']) ?? '',
      roar: asText(json['roar']) ?? fallback.roar,
      showPlayers: json['showPlayers'] == false ? false : true,
    );
  }
}

class CricketStats {
  const CricketStats({required this.matches, required this.runs, required this.wickets, required this.average, required this.strikeRate, required this.economy, required this.highestScore, required this.fours, required this.sixes, required this.catches, this.bestBowling, this.bowlingOvers});

  final int matches;
  final int runs;
  final int wickets;
  final double? average;
  final double? strikeRate;
  final double? economy;
  final int highestScore;
  final int fours;
  final int sixes;
  final int catches;
  final String? bestBowling;
  final String? bowlingOvers;

  factory CricketStats.fromJson(dynamic value) {
    final json = asMap(value);
    double? rate(dynamic number) => number == null ? null : asDouble(number);
    return CricketStats(
      matches: asInt(json['matches']),
      runs: asInt(json['runs']),
      wickets: asInt(json['wickets']),
      average: rate(json['average']),
      strikeRate: rate(json['strikeRate']),
      economy: rate(json['economy']),
      highestScore: asInt(json['highestScore']),
      fours: asInt(json['fours']),
      sixes: asInt(json['sixes']),
      catches: asInt(json['catches']),
      bestBowling: asText(json['bestBowling']),
      bowlingOvers: asText(json['bowlingOvers']),
    );
  }
}

class PlayerReport {
  const PlayerReport({this.currentSeason, this.career});

  final CricketStats? currentSeason;
  final CricketStats? career;

  factory PlayerReport.fromJson(dynamic value) {
    final json = asMap(value);
    return PlayerReport(
      currentSeason: json['currentSeason'] == null ? null : CricketStats.fromJson(json['currentSeason']),
      career: json['career'] == null ? null : CricketStats.fromJson(json['career']),
    );
  }
}

/// A franchise's social media post; the cover is a copy stored by the club.
class FranchisePost {
  const FranchisePost({required this.id, required this.url, required this.platform, this.imageUrl, this.caption});

  final String id;
  final String url;
  final String platform;
  final String? imageUrl;
  final String? caption;

  static final _video = RegExp(r'/(reels?|tv|videos?|watch|shorts)\b|/share/[vr]/|fb\.watch|youtu\.be', caseSensitive: false);
  bool get isVideo => _video.hasMatch(url);

  factory FranchisePost.fromJson(Map<String, dynamic> json) => FranchisePost(
        id: json['id']?.toString() ?? '',
        url: json['url']?.toString() ?? '',
        platform: json['platform']?.toString() ?? 'LINK',
        imageUrl: asText(json['imageUrl']),
        caption: asText(json['caption']),
      );
}

/// Every franchise's posts together, one from each franchise in turn so no single club fills the row.
List<(Franchise, FranchisePost)> franchisePostFeed(List<Franchise> franchises) {
  final feed = <(Franchise, FranchisePost)>[];
  for (var round = 0; franchises.any((franchise) => franchise.posts.length > round); round++) {
    for (final franchise in franchises) {
      if (franchise.posts.length > round) feed.add((franchise, franchise.posts[round]));
    }
  }
  return feed;
}

class Franchise {
  const Franchise({required this.name, required this.slug, required this.league, this.logoUrl, this.facebook, this.instagram, this.x, this.youtube, this.posts = const []});

  final String name;
  final String slug;
  final String league;
  final String? logoUrl;
  final String? facebook;
  final String? instagram;
  final String? x;
  final String? youtube;
  final List<FranchisePost> posts;

  bool get isHome => slug == 'united-tigers';

  List<(String, String)> get channels => [
        if (facebook != null) ('Facebook', facebook!),
        if (instagram != null) ('Instagram', instagram!),
        if (x != null) ('X', x!),
        if (youtube != null) ('YouTube', youtube!),
      ];

  factory Franchise.fromJson(Map<String, dynamic> json) => Franchise(
        name: json['name']?.toString() ?? '',
        slug: json['slug']?.toString() ?? '',
        league: json['league']?.toString() ?? '',
        logoUrl: asText(json['logoUrl']),
        facebook: asText(json['facebook']),
        instagram: asText(json['instagram']),
        x: asText(json['x']),
        youtube: asText(json['youtube']),
        posts: asList(json['posts']).map(FranchisePost.fromJson).where((post) => post.url.isNotEmpty).toList(),
      );

  static List<Franchise> list(dynamic value) => asList(value).map(Franchise.fromJson).toList();
}

class TrackedItem {
  const TrackedItem({required this.productName, required this.color, required this.size, required this.quantity, required this.unitPrice});

  final String productName;
  final String color;
  final String size;
  final int quantity;
  final double unitPrice;

  factory TrackedItem.fromJson(Map<String, dynamic> json) => TrackedItem(
        productName: json['productName']?.toString() ?? '',
        color: json['color']?.toString() ?? '',
        size: json['size']?.toString() ?? '',
        quantity: asInt(json['quantity']),
        unitPrice: asDouble(json['unitPrice']),
      );
}

/// What the public tracking endpoint reveals about a booking: no address or contact details.
/// A country offered in checkout, with its phone dialling code. Managed in admin.
class CheckoutCountry {
  const CheckoutCountry({required this.id, required this.name, required this.dialCode, this.isoCode});

  final String id;
  final String name;
  final String dialCode;
  final String? isoCode;

  static List<CheckoutCountry> list(dynamic value) => asList(value)
      .where((json) => asText(json['name']) != null && asText(json['dialCode']) != null)
      .map((json) => CheckoutCountry(id: json['id']?.toString() ?? json['name'].toString(), name: asText(json['name'])!, dialCode: asText(json['dialCode'])!, isoCode: asText(json['isoCode'])))
      .toList();
}

/// The server's reply to checkout: a cash booking, or a held order with the Stripe PaymentIntent for the PaymentSheet.
class CheckoutStart {
  const CheckoutStart({required this.number, required this.orderId, required this.paymentMethod, this.clientSecret, this.publishableKey});

  final String number;
  final String orderId;
  final String paymentMethod;
  final String? clientSecret;
  final String? publishableKey;

  bool get isCash => paymentMethod == 'cash';

  factory CheckoutStart.fromJson(Map<String, dynamic> json) {
    final orderId = asText(json['orderId']);
    if (orderId == null) throw Exception('Checkout is not available right now. Please try again shortly.');
    final method = asText(json['paymentMethod']) ?? 'stripe';
    if (method == 'cash') {
      return CheckoutStart(number: json['number']?.toString() ?? '', orderId: orderId, paymentMethod: 'cash');
    }
    final secret = asText(json['clientSecret']);
    final key = asText(json['publishableKey']);
    if (secret == null || key == null) throw Exception('Online payment is not available right now. Please try again shortly.');
    return CheckoutStart(number: json['number']?.toString() ?? '', orderId: orderId, paymentMethod: 'stripe', clientSecret: secret, publishableKey: key);
  }
}

class TrackedOrder {
  const TrackedOrder({required this.number, required this.status, required this.paymentStatus, required this.name, required this.total, this.paymentMethod, this.createdAt, this.paidAt, this.city, this.country, this.items = const []});

  final String number;
  final String status;
  final String paymentStatus;
  final String? paymentMethod;
  final String name;
  final double total;
  final DateTime? createdAt;
  final DateTime? paidAt;
  final String? city;
  final String? country;
  final List<TrackedItem> items;

  factory TrackedOrder.fromJson(Map<String, dynamic> json) => TrackedOrder(
        number: json['number']?.toString() ?? '',
        status: json['status']?.toString() ?? 'PENDING',
        paymentStatus: json['paymentStatus']?.toString() ?? 'UNPAID',
        paymentMethod: asText(json['paymentMethod']),
        name: json['name']?.toString() ?? '',
        total: asDouble(json['total']),
        createdAt: asDate(json['createdAt']),
        paidAt: asDate(json['paidAt']),
        city: asText(json['city']),
        country: asText(json['country']),
        items: asList(json['items']).map(TrackedItem.fromJson).toList(),
      );
}

class ClubCatalog {
  const ClubCatalog({
    this.players = const [],
    this.staff = const [],
    this.matches = const [],
    this.news = const [],
    this.updates = const [],
    this.products = const [],
    this.polls = const [],
    this.contests = const [],
    this.gallery = const [],
    this.sponsors = const [],
    this.alerts = const [],
  });

  final List<Player> players;
  final List<StaffMember> staff;
  final List<ClubMatch> matches;
  final List<NewsStory> news;
  final List<TeamUpdate> updates;
  final List<Product> products;
  final List<Poll> polls;
  final List<Contest> contests;
  final List<GalleryItem> gallery;
  final List<Sponsor> sponsors;
  final List<ClubAlert> alerts;

  static const empty = ClubCatalog();

  bool get isEmpty => players.isEmpty && matches.isEmpty && news.isEmpty && products.isEmpty;

  /// Drops Tigers Daily posts that still point at stock demo files.
  /// A captain story keeps its place, using the squad portrait from the backend.
  ClubCatalog withoutDemoStories() {
    String? captain;
    for (final player in players) {
      final photo = player.profileImage;
      if (player.isCaptain && photo != null && !_demoAsset(photo)) {
        captain = photo;
        break;
      }
    }
    final live = <TeamUpdate>[];
    for (final update in updates) {
      if (_demoAsset(update.video)) continue;
      if (!_demoAsset(update.image)) {
        live.add(update);
        continue;
      }
      final linked = update.playerImage;
      final aboutCaptain = update.slug.toLowerCase().contains('captain') || update.title.toLowerCase().contains('captain');
      final replacement = linked != null && !_demoAsset(linked) ? linked : (aboutCaptain ? captain : null);
      if (replacement != null) live.add(update.withImage(replacement));
    }
    return withUpdates(live);
  }

  ClubCatalog withAlerts(List<ClubAlert> alerts) => ClubCatalog(
        players: players,
        staff: staff,
        matches: matches,
        news: news,
        updates: updates,
        products: products,
        polls: polls,
        contests: contests,
        gallery: gallery,
        sponsors: sponsors,
        alerts: alerts,
      );

  ClubCatalog withUpdates(List<TeamUpdate> updates) => ClubCatalog(
        players: players,
        staff: staff,
        matches: matches,
        news: news,
        updates: updates,
        products: products,
        polls: polls,
        contests: contests,
        gallery: gallery,
        sponsors: sponsors,
        alerts: alerts,
      );
}

/// Keeps the card and the story on one photo. A real upload wins over a demo file.
String? matchingUpdateImage(String? outside, String? inside) {
  final card = outside != null && outside.isNotEmpty ? outside : null;
  final story = inside != null && inside.isNotEmpty ? inside : null;
  if (card != null && !_demoAsset(card) && (story == null || _demoAsset(story) || story == card)) return card;
  if (story != null && !_demoAsset(story)) return story;
  return card ?? story;
}

bool _demoAsset(String? path) => path != null && path.contains('/images/demo/');
