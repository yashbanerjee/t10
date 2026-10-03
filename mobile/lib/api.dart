import 'dart:convert';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ClubApi extends ChangeNotifier {
  ClubApi() {
    _load();
  }

  static const _key = 'ut-api-base';
  String base = _defaultBase();
  String? error;
  bool loading = true;
  Map<String, dynamic> home = {};

  static String _defaultBase() {
    if (kIsWeb) return 'http://localhost:3001';
    if (Platform.isAndroid) return 'http://10.0.2.2:3001';
    return 'http://localhost:3001';
  }

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      base = prefs.getString(_key) ?? _defaultBase();
    } catch (_) {}
    await refresh();
  }

  Future<void> setBase(String value) async {
    base = value.trim().replaceAll(RegExp(r'/+$'), '');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, base);
    notifyListeners();
    await refresh();
  }

  String media(dynamic path) {
    final value = path?.toString() ?? '';
    if (value.isEmpty) return '';
    if (value.startsWith('http')) return value;
    return '$base$value';
  }

  Future<dynamic> get(String path) async {
    final response = await http.get(Uri.parse('$base$path'));
    final body = jsonDecode(response.body);
    if (response.statusCode >= 400 || body is! Map || body['success'] != true) {
      throw Exception(body is Map ? body['message'] ?? 'Request failed' : 'Request failed');
    }
    return body['data'];
  }

  Future<String> post(String path, Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$base$path'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode(payload),
    );
    final body = jsonDecode(response.body);
    if (response.statusCode >= 400 || body is! Map || body['success'] != true) {
      throw Exception(body is Map ? body['message'] ?? 'Request failed' : 'Request failed');
    }
    return body['message']?.toString() ?? 'Saved';
  }

  Future<void> refresh() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        get('/api/v1/players'),
        get('/api/v1/matches'),
        get('/api/v1/news'),
        get('/api/v1/products'),
        get('/api/v1/polls'),
        get('/api/v1/contests'),
        get('/api/v1/gallery'),
        get('/api/v1/sponsors'),
        get('/api/v1/staff'),
      ]);
      home = {
        'players': results[0],
        'matches': results[1],
        'news': results[2],
        'products': results[3],
        'polls': results[4],
        'contests': results[5],
        'gallery': results[6],
        'sponsors': results[7],
        'staff': results[8],
      };
    } catch (reason) {
      error = reason.toString().replaceFirst('Exception: ', '');
    } finally {
      loading = false;
      notifyListeners();
    }
  }
}

List<Map<String, dynamic>> asList(dynamic value) {
  if (value is! List) return [];
  return value.whereType<Map>().map((item) => Map<String, dynamic>.from(item)).toList();
}

String money(dynamic value) {
  final amount = double.tryParse(value?.toString() ?? '') ?? 0;
  return 'AED ${amount.toStringAsFixed(2)}';
}

String when(dynamic value) {
  final date = DateTime.tryParse(value?.toString() ?? '');
  if (date == null) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final local = date.toLocal();
  final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
  final minute = local.minute.toString().padLeft(2, '0');
  final suffix = local.hour >= 12 ? 'pm' : 'am';
  return '${local.day.toString().padLeft(2, '0')} ${months[local.month - 1]} ${local.year} · $hour:$minute $suffix';
}

String plain(dynamic value) {
  return (value?.toString() ?? '').replaceAll(RegExp(r'<[^>]+>'), ' ').replaceAll(RegExp(r'\s+'), ' ').trim();
}
