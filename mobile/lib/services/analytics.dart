import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

/// Firebase Analytics for the club app. Every call is a no-op when Firebase isn't running
/// (tests, web, desktop) and never throws into the UI.
class ClubAnalytics {
  ClubAnalytics._();

  static FirebaseAnalytics? get _analytics => Firebase.apps.isEmpty ? null : FirebaseAnalytics.instance;

  static final NavigatorObserver observer = _ScreenObserver();

  static Future<void> _safe(Future<void> Function(FirebaseAnalytics analytics) action) async {
    final analytics = _analytics;
    if (analytics == null) return;
    try {
      await action(analytics);
    } catch (reason) {
      debugPrint('Analytics skipped: $reason');
    }
  }

  static Future<void> screen(String name) => _safe((analytics) => analytics.logScreenView(screenName: name, screenClass: name));

  static Future<void> event(String name, [Map<String, Object>? parameters]) => _safe((analytics) => analytics.logEvent(name: name, parameters: parameters));

  static Future<void> viewPlayer(String slug, String name) =>
      _safe((analytics) => analytics.logSelectContent(contentType: 'player', itemId: slug, parameters: {'player_name': name}));

  static Future<void> viewMatch(String slug, String opponent) =>
      _safe((analytics) => analytics.logSelectContent(contentType: 'match', itemId: slug, parameters: {'opponent': opponent}));

  static Future<void> viewProduct(String slug, String name, double price) => _safe(
        (analytics) => analytics.logViewItem(currency: 'AED', value: price, items: [AnalyticsEventItem(itemId: slug, itemName: name, price: price)]),
      );

  static Future<void> addToCart(String slug, String name, double price, int quantity) => _safe(
        (analytics) => analytics.logAddToCart(
          currency: 'AED',
          value: price * quantity,
          items: [AnalyticsEventItem(itemId: slug, itemName: name, price: price, quantity: quantity)],
        ),
      );

  static Future<void> setNotificationsAllowed(bool allowed) =>
      _safe((analytics) => analytics.setUserProperty(name: 'push_enabled', value: allowed ? 'yes' : 'no'));
}

/// Names each pushed screen after its page widget, e.g. `PlayerPage` becomes `player`.
class _ScreenObserver extends NavigatorObserver {
  static final _suffix = RegExp(r'(Page|Screen)$');
  static final _camel = RegExp(r'(?<=[a-z0-9])(?=[A-Z])');

  String? _name(Route<dynamic> route) {
    final named = route.settings.name;
    if (named != null && named != '/') return named;
    if (route is! MaterialPageRoute) return null;
    final context = route.navigator?.context;
    if (context == null) return null;
    try {
      final type = route.builder(context).runtimeType.toString().replaceFirst(_suffix, '');
      return type.split(_camel).join('_').toLowerCase();
    } catch (_) {
      return null;
    }
  }

  void _log(Route<dynamic>? route) {
    if (route == null) return;
    final name = _name(route);
    if (name != null && name.isNotEmpty) ClubAnalytics.screen(name);
  }

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) => _log(route);

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) => _log(previousRoute);

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) => _log(newRoute);
}
