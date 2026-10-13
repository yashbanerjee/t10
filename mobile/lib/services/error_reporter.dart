import 'dart:async';
import 'dart:convert';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';

/// Sends app failures to the website's error log (admin → App errors).
/// Reporting never throws and is throttled so a failing screen cannot flood the log.
class ErrorReporter {
  ErrorReporter._();

  static String Function()? base;
  static String? screen;
  static String? _version;
  static final _sent = <String, DateTime>{};

  static Future<void> init(String Function() serverBase) async {
    base = serverBase;
    try {
      final info = await PackageInfo.fromPlatform();
      _version = '${info.version}+${info.buildNumber}';
    } catch (_) {}
  }

  static String get _platform {
    if (kIsWeb) return 'web';
    try {
      return Platform.operatingSystem;
    } catch (_) {
      return 'unknown';
    }
  }

  static void report(String message, {String? method, String? endpoint, int? statusCode, Object? details}) {
    final root = base?.call();
    if (root == null || root.isEmpty || (endpoint?.contains('/app-errors') ?? false)) return;
    final key = '$method $endpoint $statusCode $message';
    final now = DateTime.now();
    final last = _sent[key];
    if (last != null && now.difference(last) < const Duration(minutes: 5)) return;
    _sent[key] = now;
    if (_sent.length > 200) _sent.removeWhere((_, at) => now.difference(at) > const Duration(minutes: 5));
    final text = details?.toString();
    final body = {
      'platform': _platform,
      'appVersion': _version,
      'screen': screen,
      'method': method,
      'endpoint': endpoint == null ? null : _cut(endpoint, 500),
      'statusCode': statusCode,
      'message': _cut(message.trim().isEmpty ? 'Unknown error' : message.trim(), 1000),
      'details': text == null ? null : _cut(text, 4000),
      'device': kIsWeb ? null : _cut('$_platform ${_osVersion()}', 200),
    };
    unawaited(
      http
          .post(Uri.parse('$root/api/v1/app-errors'), headers: {'content-type': 'application/json'}, body: jsonEncode(body))
          .timeout(const Duration(seconds: 10))
          .then((_) {}, onError: (_) {}),
    );
  }

  static String _osVersion() {
    try {
      return Platform.operatingSystemVersion;
    } catch (_) {
      return '';
    }
  }

  static String _cut(String value, int max) => value.length <= max ? value : value.substring(0, max);
}
