import 'dart:async';
import 'dart:convert';
import 'dart:io' show SocketException;

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

  static const liveBase = 'https://unitedtigers.ae';

  static String _defaultBase() => liveBase;

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

  static const timeout = Duration(seconds: 20);

  Future<http.Response> _send(Future<http.Response> Function() request, {Duration limit = timeout}) async {
    try {
      return await request().timeout(limit);
    } on TimeoutException {
      throw Exception('The club server is taking too long. Check your connection and try again.');
    } on http.ClientException {
      throw Exception('Could not reach the club server. Check your connection and try again.');
    } on SocketException {
      throw Exception('You are offline. Check your connection and try again.');
    }
  }

  Uri _uri(String path) => Uri.parse('$base$path');

  Future<dynamic> get(String path) async => _data(await _send(() => http.get(_uri(path), headers: _headers())));

  Future<String> post(String path, Map<String, dynamic> payload) async {
    final body = _envelope(await _send(() => http.post(_uri(path), headers: _headers(json: true), body: jsonEncode(payload))));
    return body['message']?.toString() ?? 'Saved';
  }

  Future<dynamic> postData(String path, Map<String, dynamic> payload) async {
    return _data(await _send(() => http.post(_uri(path), headers: _headers(json: true), body: jsonEncode(payload))));
  }

  Future<dynamic> patch(String path, Map<String, dynamic> payload, {Duration limit = timeout}) async {
    return _data(await _send(() => http.patch(_uri(path), headers: _headers(json: true), body: jsonEncode(payload)), limit: limit));
  }

  Future<dynamic> put(String path, Map<String, dynamic> payload) async {
    return _data(await _send(() => http.put(_uri(path), headers: _headers(json: true), body: jsonEncode(payload))));
  }

  Future<dynamic> delete(String path) async {
    return _data(await _send(() => http.delete(_uri(path), headers: _headers())));
  }

  Future<dynamic> upload(String path, List<int> bytes, String filename, String contentType) async {
    final request = http.MultipartRequest('POST', _uri(path))
      ..headers.addAll(_headers())
      ..files.add(http.MultipartFile.fromBytes('file', bytes, filename: filename, contentType: _mediaType(contentType)));
    return _data(await _send(() async => http.Response.fromStream(await request.send())));
  }

  MediaType _mediaType(String contentType) {
    final parts = contentType.split('/');
    return MediaType(parts.first, parts.length > 1 ? parts.last : 'octet-stream');
  }

  dynamic _data(http.Response response) => _envelope(response)['data'];

  Map<String, dynamic> _envelope(http.Response response) {
    dynamic body;
    try {
      body = jsonDecode(utf8.decode(response.bodyBytes));
    } on FormatException {
      throw Exception(response.statusCode >= 500 ? 'The club server is having a problem. Please try again shortly.' : 'Unexpected reply from the club server.');
    }
    if (response.statusCode >= 400 || body is! Map || body['success'] != true) {
      throw Exception(body is Map ? body['message'] ?? 'Request failed' : 'Request failed');
    }
    return Map<String, dynamic>.from(body);
  }
}
