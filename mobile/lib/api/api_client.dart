import 'dart:convert';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Same JSON API the United Tigers website serves under `/api/v1`.
class ApiClient {
  ApiClient({String? base}) : base = base ?? _defaultBase();

  static const prefsKey = 'ut-api-base';
  static const tokenKey = 'ut-admin-token';

  String base;
  String? token;

  static String _defaultBase() {
    if (kIsWeb) return 'http://localhost:3001';
    if (Platform.isAndroid) return 'http://10.0.2.2:3001';
    return 'http://localhost:3001';
  }

  Future<void> loadSavedBase() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      base = prefs.getString(prefsKey) ?? _defaultBase();
    } catch (_) {}
  }

  Future<void> saveBase(String value) async {
    base = value.trim().replaceAll(RegExp(r'/+$'), '');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(prefsKey, base);
  }

  Future<void> loadToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      token = prefs.getString(tokenKey);
    } catch (_) {}
  }

  Future<void> saveToken(String value) async {
    token = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(tokenKey, value);
  }

  Future<void> clearToken() async {
    token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
  }

  Map<String, String> _headers({bool json = false}) {
    return {
      if (json) 'content-type': 'application/json',
      if (token != null && token!.isNotEmpty) 'authorization': 'Bearer $token',
    };
  }

  String media(String? path) {
    final value = path ?? '';
    if (value.isEmpty) return '';
    if (value.startsWith('http')) return value;
    return '$base$value';
  }

  Future<dynamic> get(String path) async => _data(await http.get(Uri.parse('$base$path'), headers: _headers()));

  Future<String> post(String path, Map<String, dynamic> payload) async {
    final body = _envelope(await http.post(Uri.parse('$base$path'), headers: _headers(json: true), body: jsonEncode(payload)));
    return body['message']?.toString() ?? 'Saved';
  }

  Future<dynamic> postData(String path, Map<String, dynamic> payload) async {
    return _data(await http.post(Uri.parse('$base$path'), headers: _headers(json: true), body: jsonEncode(payload)));
  }

  Future<dynamic> patch(String path, Map<String, dynamic> payload) async {
    return _data(await http.patch(Uri.parse('$base$path'), headers: _headers(json: true), body: jsonEncode(payload)));
  }

  Future<dynamic> put(String path, Map<String, dynamic> payload) async {
    return _data(await http.put(Uri.parse('$base$path'), headers: _headers(json: true), body: jsonEncode(payload)));
  }

  Future<dynamic> delete(String path) async {
    return _data(await http.delete(Uri.parse('$base$path'), headers: _headers()));
  }

  Future<dynamic> upload(String path, List<int> bytes, String filename, String contentType) async {
    final request = http.MultipartRequest('POST', Uri.parse('$base$path'))
      ..headers.addAll(_headers())
      ..files.add(http.MultipartFile.fromBytes('file', bytes, filename: filename, contentType: _mediaType(contentType)));
    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    return _data(response);
  }

  MediaType _mediaType(String contentType) {
    final parts = contentType.split('/');
    return MediaType(parts.first, parts.length > 1 ? parts.last : 'octet-stream');
  }

  dynamic _data(http.Response response) => _envelope(response)['data'];

  Map<String, dynamic> _envelope(http.Response response) {
    final body = jsonDecode(response.body);
    if (response.statusCode >= 400 || body is! Map || body['success'] != true) {
      throw Exception(body is Map ? body['message'] ?? 'Request failed' : 'Request failed');
    }
    return Map<String, dynamic>.from(body);
  }
}
