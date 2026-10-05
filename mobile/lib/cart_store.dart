import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CartLine {
  CartLine({required this.variantId, required this.name, required this.color, required this.size, required this.price, this.image, this.quantity = 1});

  final String variantId;
  final String name;
  final String color;
  final String size;
  final double price;
  final String? image;
  int quantity;

  Map<String, dynamic> toJson() => {
        'variantId': variantId,
        'name': name,
        'color': color,
        'size': size,
        'price': price,
        'image': image,
        'quantity': quantity,
      };

  factory CartLine.fromJson(Map<String, dynamic> json) => CartLine(
        variantId: json['variantId'].toString(),
        name: json['name'].toString(),
        color: json['color'].toString(),
        size: json['size'].toString(),
        price: double.tryParse(json['price'].toString()) ?? 0,
        image: json['image']?.toString(),
        quantity: int.tryParse(json['quantity'].toString()) ?? 1,
      );
}

class CartStore extends ChangeNotifier {
  CartStore() {
    _load();
  }

  static const _key = 'ut-cart';
  final List<CartLine> lines = [];

  int get count => lines.fold(0, (sum, line) => sum + line.quantity);
  double get total => lines.fold(0, (sum, line) => sum + line.price * line.quantity);

  Future<void> _load() async {
    final SharedPreferences prefs;
    try {
      prefs = await SharedPreferences.getInstance();
    } catch (_) {
      return;
    }
    final raw = prefs.getString(_key);
    if (raw == null) return;
    final decoded = jsonDecode(raw);
    if (decoded is! List) return;
    lines
      ..clear()
      ..addAll(decoded.whereType<Map>().map((item) => CartLine.fromJson(Map<String, dynamic>.from(item))));
    notifyListeners();
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(lines.map((line) => line.toJson()).toList()));
    notifyListeners();
  }

  Future<void> add(CartLine line) async {
    final existing = lines.where((item) => item.variantId == line.variantId).firstOrNull;
    if (existing == null) {
      lines.add(line);
    } else {
      existing.quantity += line.quantity;
    }
    await _save();
  }

  Future<void> setQuantity(String variantId, int quantity) async {
    final line = lines.where((item) => item.variantId == variantId).firstOrNull;
    if (line == null) return;
    if (quantity < 1) {
      lines.remove(line);
    } else {
      line.quantity = quantity;
    }
    await _save();
  }

  Future<void> clear() async {
    lines.clear();
    await _save();
  }
}
