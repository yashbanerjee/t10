String money(dynamic value) {
  final amount = double.tryParse(value?.toString() ?? '') ?? 0;
  return 'AED ${amount.toStringAsFixed(2)}';
}

String when(DateTime? date) {
  if (date == null) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final local = date.toLocal();
  final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
  final minute = local.minute.toString().padLeft(2, '0');
  final suffix = local.hour >= 12 ? 'pm' : 'am';
  return '${local.day.toString().padLeft(2, '0')} ${months[local.month - 1]} ${local.year} · $hour:$minute $suffix';
}

String roleLabel(String? role) {
  final value = (role ?? '').trim();
  if (value.isEmpty) return 'Player';
  return value.replaceAll('_', ' ');
}

/// CMS fields can contain HTML. Flutter screens only show the readable text.
String readable(dynamic value) {
  var text = value?.toString() ?? '';
  text = text.replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n');
  text = text.replaceAll(RegExp(r'</p>|</div>|</li>|</h[1-6]>', caseSensitive: false), '\n');
  text = text.replaceAll(RegExp(r'<[^>]+>'), '');
  text = text
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&amp;', '&')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>');
  return text.replaceAll(RegExp(r'[ \t]+\n'), '\n').replaceAll(RegExp(r'\n{3,}'), '\n\n').trim();
}

DateTime? asDate(dynamic value) => DateTime.tryParse(value?.toString() ?? '');

int asInt(dynamic value) => int.tryParse(value?.toString() ?? '') ?? 0;

double asDouble(dynamic value) => double.tryParse(value?.toString() ?? '') ?? 0;

bool asBool(dynamic value) => value == true || value == 'true';

String? asText(dynamic value) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? null : text;
}

Map<String, dynamic> asMap(dynamic value) {
  if (value is Map) return Map<String, dynamic>.from(value);
  return {};
}

List<Map<String, dynamic>> asList(dynamic value) {
  if (value is! List) return [];
  return value.whereType<Map>().map((item) => Map<String, dynamic>.from(item)).toList();
}
