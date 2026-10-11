import 'dart:async';
import 'dart:io' show Platform;

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:united_tigers/firebase_options.dart';
import 'package:united_tigers/pages/home_page.dart';
import 'package:united_tigers/pages/more_pages.dart';
import 'package:united_tigers/services/analytics.dart';

/// Runs in its own isolate when a push arrives while the app is in the background or closed.
/// The system already shows `notification` payloads, so this only has to bring Firebase up.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  final options = DefaultFirebaseOptions.currentPlatform;
  if (options != null && Firebase.apps.isEmpty) await Firebase.initializeApp(options: options);
}

/// Firebase Cloud Messaging for the club app.
///
/// Every install joins the `all` topic plus `matches` and `news`, so the club can broadcast from the
/// Firebase console. A push may carry a `link` data field with a website path such as `/news/slug`,
/// `/fixtures` or `/shop`; tapping the notification opens the matching screen.
class ClubPush {
  ClubPush._();

  static final navigatorKey = GlobalKey<NavigatorState>();
  static const topics = ['all', 'matches', 'news'];

  static const _channel = AndroidNotificationChannel(
    'club_news',
    'Club news & match alerts',
    description: 'Match reminders, results and news from United Tigers.',
    importance: Importance.high,
  );

  static final _local = FlutterLocalNotificationsPlugin();
  static String? token;
  static bool _started = false;

  static Future<void> start() async {
    if (_started || Firebase.apps.isEmpty) return;
    _started = true;
    final messaging = FirebaseMessaging.instance;

    await _local.initialize(
      settings: const InitializationSettings(
        android: AndroidInitializationSettings('ic_notification'),
        iOS: DarwinInitializationSettings(requestAlertPermission: false, requestBadgePermission: false, requestSoundPermission: false),
      ),
      onDidReceiveNotificationResponse: (response) => _open(response.payload, source: 'foreground'),
    );
    await _local.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.createNotificationChannel(_channel);

    final settings = await messaging.requestPermission();
    final allowed = settings.authorizationStatus == AuthorizationStatus.authorized || settings.authorizationStatus == AuthorizationStatus.provisional;
    unawaited(ClubAnalytics.setNotificationsAllowed(allowed));
    await messaging.setForegroundNotificationPresentationOptions(alert: true, badge: true, sound: true);

    FirebaseMessaging.onMessage.listen(_showInForeground);
    FirebaseMessaging.onMessageOpenedApp.listen((message) => _open(message.data['link'] as String?, source: 'background'));
    messaging.onTokenRefresh.listen((value) => token = value);

    unawaited(_register(messaging));

    final initial = await messaging.getInitialMessage();
    if (initial != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _open(initial.data['link'] as String?, source: 'terminated'));
    }
  }

  /// Token and topics need APNs on iOS, which can lag a few seconds after launch; failures only
  /// mean this device misses pushes until the next start, so they're logged rather than surfaced.
  static Future<void> _register(FirebaseMessaging messaging) async {
    try {
      if (Platform.isIOS) {
        for (var attempt = 0; attempt < 5 && await messaging.getAPNSToken() == null; attempt++) {
          await Future<void>.delayed(const Duration(seconds: 2));
        }
      }
      token = await messaging.getToken();
      for (final topic in topics) {
        await messaging.subscribeToTopic(topic);
      }
      debugPrint('Push ready; subscribed to ${topics.join(', ')}');
    } catch (reason) {
      debugPrint('Push registration skipped: $reason');
    }
  }

  /// Android doesn't display pushes while the app is open, so mirror them as local notifications.
  /// iOS shows them itself through the presentation options above.
  static Future<void> _showInForeground(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null || !Platform.isAndroid) return;
    await _local.show(
      id: notification.hashCode,
      title: notification.title,
      body: notification.body,
      payload: message.data['link'] as String?,
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: 'ic_notification',
          color: const Color(0xFFC9177E),
        ),
      ),
    );
  }

  static void _open(String? link, {required String source}) {
    unawaited(ClubAnalytics.event('notification_open', {'source': source, 'link': link ?? ''}));
    final path = link?.trim() ?? '';
    final context = navigatorKey.currentContext;
    if (path.isEmpty || context == null) return;
    const shellPaths = ['/fixtures', '/matches', '/shop', '/team', '/players', '/fan'];
    if (shellPaths.any(path.startsWith)) {
      openClubPath(context, path);
    } else {
      openSiteLink(context, path);
    }
  }
}
