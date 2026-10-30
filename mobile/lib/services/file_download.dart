import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

/// Saves a remote file into the device Downloads folder when possible.
/// Returns the absolute path that was written.
Future<String> saveUrlToDownloads(String url, {required String fileName}) async {
  if (kIsWeb) throw Exception('Download is not available on web.');
  final safeName = _safeFileName(fileName, url);
  final response = await http.get(Uri.parse(url));
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw Exception('The file could not be downloaded right now.');
  }
  final bytes = response.bodyBytes;
  if (bytes.isEmpty) throw Exception('The downloaded file was empty.');

  if (Platform.isAndroid) {
    final granted = await _ensureAndroidStorage();
    if (!granted) throw Exception('Storage permission is needed to save into Downloads.');
    final downloads = Directory('/storage/emulated/0/Download');
    if (!await downloads.exists()) await downloads.create(recursive: true);
    final target = File(p.join(downloads.path, safeName));
    await target.writeAsBytes(bytes, flush: true);
    return target.path;
  }

  if (Platform.isIOS) {
    final docs = await getApplicationDocumentsDirectory();
    final target = File(p.join(docs.path, safeName));
    await target.writeAsBytes(bytes, flush: true);
    return target.path;
  }

  final dir = await getDownloadsDirectory() ?? await getApplicationDocumentsDirectory();
  final target = File(p.join(dir.path, safeName));
  await target.writeAsBytes(bytes, flush: true);
  return target.path;
}

Future<bool> _ensureAndroidStorage() async {
  // Android 10+ scoped storage allows writing to the public Download folder without
  // a broad storage permission for many devices; still request on older releases.
  if (Platform.isAndroid) {
    final info = await Permission.storage.status;
    if (info.isGranted || info.isLimited) return true;
    final asked = await Permission.storage.request();
    if (asked.isGranted || asked.isLimited || asked.isRestricted) return true;
    // On newer Android the Download write may still succeed without the legacy permission.
    return true;
  }
  return true;
}

String _safeFileName(String preferred, String url) {
  var name = preferred.trim().replaceAll(RegExp(r'[\\/:*?"<>|]+'), '_');
  if (name.isEmpty) {
    name = Uri.tryParse(url)?.pathSegments.where((part) => part.isNotEmpty).lastOrNull ?? 'united-tigers-theme';
  }
  if (!name.contains('.')) {
    final fromUrl = Uri.tryParse(url)?.pathSegments.where((part) => part.isNotEmpty).lastOrNull ?? '';
    final ext = p.extension(fromUrl);
    if (ext.isNotEmpty) name = '$name$ext';
  }
  return name;
}
