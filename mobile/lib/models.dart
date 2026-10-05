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
      );

  static List<Player> list(dynamic value) => asList(value).map(Player.fromJson).toList();
}

class StaffMember {
  const StaffMember({required this.fullName, required this.title, required this.category, this.bio, this.profileImage});

  final String fullName;
  final String title;
  final String category;
  final String? bio;
  final String? profileImage;

  factory StaffMember.fromJson(Map<String, dynamic> json) => StaffMember(
        fullName: json['fullName']?.toString() ?? 'Staff',
        title: json['title']?.toString() ?? '',
        category: json['category']?.toString() ?? '',
        bio: readable(json['bio']).isEmpty ? null : readable(json['bio']),
        profileImage: asText(json['profileImage']),
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

class ClubMatch {
  const ClubMatch({
    required this.slug,
    required this.date,
    required this.status,
    required this.opponent,
    this.opponentShort,
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
  final String? competition;
  final String? venueName;
  final String? venueCity;
  final String? toss;
  final String? result;
  final List<InningsCard> innings;

  bool get isCompleted => status == 'COMPLETED';
  bool get isLive => status == 'LIVE';
  bool get won => RegExp(r'united tigers won', caseSensitive: false).hasMatch(result ?? '');

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
  const TeamUpdate({required this.slug, required this.title, required this.description, required this.content, this.image, this.video, this.category, this.publishedAt, this.playerName});

  final String slug;
  final String title;
  final String description;
  final String content;
  final String? image;
  final String? video;
  final String? category;
  final DateTime? publishedAt;
  final String? playerName;

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
  const Poll({required this.slug, required this.question, this.title, this.description, this.closesAt, this.options = const []});

  final String slug;
  final String question;
  final String? title;
  final String? description;
  final DateTime? closesAt;
  final List<PollOption> options;

  int get totalVotes => options.fold(0, (sum, option) => sum + option.votes);

  factory Poll.fromJson(Map<String, dynamic> json) => Poll(
        slug: json['slug']?.toString() ?? '',
        question: json['question']?.toString() ?? '',
        title: asText(json['title']),
        description: readable(json['description']).isEmpty ? null : readable(json['description']),
        closesAt: asDate(json['closesAt']),
        options: asList(json['options']).map(PollOption.fromJson).toList(),
      );

  static List<Poll> list(dynamic value) => asList(value).map(Poll.fromJson).toList();
}

class Contest {
  const Contest({required this.slug, required this.title, required this.description, required this.prompt, this.prize, this.image, this.closesAt, this.entries = 0});

  final String slug;
  final String title;
  final String description;
  final String prompt;
  final String? prize;
  final String? image;
  final DateTime? closesAt;
  final int entries;

  factory Contest.fromJson(Map<String, dynamic> json) => Contest(
        slug: json['slug']?.toString() ?? '',
        title: json['title']?.toString() ?? 'Contest',
        description: readable(json['description']),
        prompt: readable(json['prompt']),
        prize: asText(json['prize']),
        image: asText(json['image']),
        closesAt: asDate(json['closesAt']),
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

class PlayerStat {
  const PlayerStat({required this.name, required this.matches, required this.runs, required this.wickets, required this.average, required this.strikeRate, required this.economy});

  final String name;
  final int matches;
  final int runs;
  final int wickets;
  final double? average;
  final double? strikeRate;
  final double? economy;

  factory PlayerStat.fromJson(Map<String, dynamic> json) {
    final player = asMap(json['player']);
    final stats = asMap(json['stats']);
    double? rate(dynamic value) {
      if (value == null) return null;
      return asDouble(value);
    }

    return PlayerStat(
      name: player['fullName']?.toString() ?? 'Player',
      matches: asInt(stats['matches']),
      runs: asInt(stats['runs']),
      wickets: asInt(stats['wickets']),
      average: rate(stats['average']),
      strikeRate: rate(stats['strikeRate']),
      economy: rate(stats['economy']),
    );
  }

  static List<PlayerStat> list(dynamic value) => asList(value).map(PlayerStat.fromJson).toList();
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
  });

  final String mode;
  final String title;
  final String accent;
  final String tagline;
  final String ctaLabel;
  final String ctaHref;
  final String image;
  final String roar;

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
    roar: 'UNITED TIGERS',
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
    );
  }
}

class CricketStats {
  const CricketStats({required this.matches, required this.runs, required this.wickets, required this.average, required this.strikeRate, required this.economy, required this.highestScore, required this.fours, required this.sixes, required this.catches});

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

  static const empty = ClubCatalog();

  bool get isEmpty => players.isEmpty && matches.isEmpty && news.isEmpty && products.isEmpty;
}
