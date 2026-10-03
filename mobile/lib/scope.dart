import 'package:flutter/widgets.dart';
import 'package:united_tigers/api.dart';
import 'package:united_tigers/cart_store.dart';

class ClubScope extends InheritedWidget {
  const ClubScope({super.key, required this.api, required this.cart, required super.child});
  final ClubApi api;
  final CartStore cart;

  static ClubScope of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<ClubScope>()!;

  @override
  bool updateShouldNotify(ClubScope oldWidget) => api != oldWidget.api || cart != oldWidget.cart;
}
