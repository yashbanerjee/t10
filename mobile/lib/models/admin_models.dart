import 'package:united_tigers/format.dart';

class AdminSession {
  const AdminSession({required this.id, required this.email, required this.name, required this.role, this.demo = false});

  final String id;
  final String email;
  final String name;
  final String role;
  final bool demo;

  String get roleLabel => role.replaceAll('_', ' ');

  factory AdminSession.fromJson(Map<String, dynamic> json) => AdminSession(
        id: json['sub']?.toString() ?? '',
        email: json['email']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        role: json['role']?.toString() ?? '',
        demo: asBool(json['demo']),
      );
}

class DashboardSummary {
  const DashboardSummary({
    required this.players,
    required this.matches,
    required this.news,
    required this.updates,
    required this.gallery,
    required this.sponsors,
    required this.unreadMessages,
    this.upcoming,
  });

  final int players;
  final int matches;
  final int news;
  final int updates;
  final int gallery;
  final int sponsors;
  final int unreadMessages;
  final String? upcoming;

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    final match = asMap(json['upcoming']);
    final opponent = asText(match['opponent']);
    return DashboardSummary(
      players: asInt(json['players']),
      matches: asInt(json['matches']),
      news: asInt(json['news']),
      updates: asInt(json['updates']),
      gallery: asInt(json['gallery']),
      sponsors: asInt(json['sponsors']),
      unreadMessages: asInt(json['unreadMessages']),
      upcoming: opponent,
    );
  }
}

class AdminRole {
  const AdminRole({required this.id, required this.name, required this.description, required this.permissions});

  final String id;
  final String name;
  final String description;
  final List<String> permissions;

  factory AdminRole.fromJson(Map<String, dynamic> json) => AdminRole(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        description: json['description']?.toString() ?? '',
        permissions: (json['permissions'] is List) ? (json['permissions'] as List).map((item) => item.toString()).toList() : const [],
      );

  static List<AdminRole> list(dynamic value) => asList(value).map(AdminRole.fromJson).toList();
}

class AdminAccount {
  const AdminAccount({required this.id, required this.name, required this.email, required this.role, required this.isActive, this.lastLoginAt});

  final String id;
  final String name;
  final String email;
  final String role;
  final bool isActive;
  final DateTime? lastLoginAt;

  factory AdminAccount.fromJson(Map<String, dynamic> json) => AdminAccount(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        email: json['email']?.toString() ?? '',
        role: json['role']?.toString() ?? '',
        isActive: asBool(json['isActive']),
        lastLoginAt: asDate(json['lastLoginAt']),
      );

  static List<AdminAccount> list(dynamic value) => asList(value).map(AdminAccount.fromJson).toList();
}

class AdminRecord {
  const AdminRecord({required this.id, required this.title, required this.subtitle, required this.fields});

  final String id;
  final String title;
  final String subtitle;
  final Map<String, String> fields;

  factory AdminRecord.fromJson(Map<String, dynamic> json) {
    final title = _firstText(json, const ['fullName', 'title', 'name', 'opponent', 'question', 'key', 'email']) ?? 'Record';
    final subtitle = _firstText(json, const ['role', 'category', 'status', 'email', 'slug']) ?? '';
    final fields = <String, String>{};
    json.forEach((key, value) {
      if (value == null || value is Map || value is List) return;
      final text = value.toString().trim();
      if (text.isEmpty || key == 'passwordHash') return;
      fields[key] = text;
    });
    return AdminRecord(id: json['id']?.toString() ?? '', title: title, subtitle: subtitle, fields: fields);
  }

  static List<AdminRecord> list(dynamic value) => asList(value).map(AdminRecord.fromJson).toList();
}

class ScorecardSheet {
  const ScorecardSheet({required this.opponent, required this.status, required this.innings, required this.players});

  final String opponent;
  final String status;
  final List<String> innings;
  final List<AdminRecord> players;

  factory ScorecardSheet.fromJson(Map<String, dynamic> json) {
    final match = asMap(json['match']);
    final innings = asList(match['innings']).map((entry) {
      final batting = asList(entry['batting']).length;
      final bowling = asList(entry['bowling']).length;
      return 'Innings ${entry['number']} · ${entry['battingTeam']} · ${entry['runs']}/${entry['wickets']} (${entry['overs']}) · $batting batters · $bowling bowlers';
    }).toList();
    return ScorecardSheet(
      opponent: match['opponent']?.toString() ?? 'Match',
      status: match['status']?.toString() ?? '',
      innings: innings,
      players: AdminRecord.list(json['players']),
    );
  }
}

class UploadedMedia {
  const UploadedMedia({required this.url, required this.mediaId});

  final String url;
  final String mediaId;

  factory UploadedMedia.fromJson(Map<String, dynamic> json) => UploadedMedia(
        url: json['url']?.toString() ?? '',
        mediaId: json['mediaId']?.toString() ?? '',
      );
}

String? _firstText(Map<String, dynamic> json, List<String> keys) {
  for (final key in keys) {
    final value = asText(json[key]);
    if (value != null) return value;
  }
  return null;
}
