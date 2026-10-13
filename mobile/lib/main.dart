import 'dart:ui' show PlatformDispatcher;

import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:united_tigers/api.dart';
import 'package:united_tigers/cart_store.dart';
import 'package:united_tigers/firebase_options.dart';
import 'package:united_tigers/services/analytics.dart';
import 'package:united_tigers/services/error_reporter.dart';
import 'package:united_tigers/services/notice_inbox.dart';
import 'package:united_tigers/services/push.dart';
import 'package:united_tigers/pages/fixtures_page.dart';
import 'package:united_tigers/pages/home_page.dart';
import 'package:united_tigers/pages/more_pages.dart';
import 'package:united_tigers/pages/shop_pages.dart';
import 'package:united_tigers/pages/team_page.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/widgets.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final options = DefaultFirebaseOptions.currentPlatform;
  if (options != null) {
    try {
      await Firebase.initializeApp(options: options);
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    } catch (reason) {
      debugPrint('Firebase unavailable: $reason');
    }
  }
  final flutterError = FlutterError.onError;
  FlutterError.onError = (details) {
    flutterError?.call(details);
    ErrorReporter.report(details.exceptionAsString(), details: details.stack);
  };
  PlatformDispatcher.instance.onError = (error, stack) {
    ErrorReporter.report('$error', details: stack);
    return true;
  };
  runApp(const UnitedTigersApp());
}

class UnitedTigersApp extends StatefulWidget {
  const UnitedTigersApp({super.key});

  @override
  State<UnitedTigersApp> createState() => _UnitedTigersAppState();
}

class _UnitedTigersAppState extends State<UnitedTigersApp> {
  final api = ClubApi();
  final cart = CartStore();

  @override
  void initState() {
    super.initState();
    ErrorReporter.init(() => api.client.base);
    NoticeInbox.instance.load();
    WidgetsBinding.instance.addPostFrameCallback((_) => ClubPush.start());
  }

  @override
  void dispose() {
    api.dispose();
    cart.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClubScope(
      api: api,
      cart: cart,
      child: MaterialApp(
        title: 'United Tigers',
        debugShowCheckedModeBanner: false,
        navigatorKey: ClubPush.navigatorKey,
        navigatorObservers: [ClubAnalytics.observer],
        theme: ThemeData(
          brightness: Brightness.dark,
          scaffoldBackgroundColor: Colors.transparent,
          canvasColor: night,
          colorScheme: const ColorScheme.dark(primary: orange, secondary: gold, surface: purple),
          iconTheme: const IconThemeData(color: gold),
          pageTransitionsTheme: const PageTransitionsTheme(
            builders: {TargetPlatform.android: ClubPageTransitions(), TargetPlatform.iOS: ClubPageTransitions(), TargetPlatform.windows: ClubPageTransitions(), TargetPlatform.macOS: ClubPageTransitions(), TargetPlatform.linux: ClubPageTransitions()},
          ),
          appBarTheme: AppBarTheme(
            backgroundColor: const Color(0xF22B074D),
            surfaceTintColor: Colors.transparent,
            foregroundColor: Colors.white,
            iconTheme: const IconThemeData(color: goldLight),
            elevation: 0,
            scrolledUnderElevation: 0,
            centerTitle: false,
            titleTextStyle: displayStyle(22, color: goldLight, spacing: 1),
            shape: Border(bottom: BorderSide(color: gold.withValues(alpha: 0.45))),
          ),
          navigationBarTheme: NavigationBarThemeData(
            backgroundColor: Colors.transparent,
            surfaceTintColor: Colors.transparent,
            elevation: 0,
            height: 68,
            indicatorColor: pink.withValues(alpha: 0.32),
            indicatorShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: goldLight.withValues(alpha: 0.35))),
            iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(color: states.contains(WidgetState.selected) ? goldLight : const Color(0xFFBDAED0), size: 24)),
            labelTextStyle: WidgetStateProperty.resolveWith((states) {
              final selected = states.contains(WidgetState.selected);
              return TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, letterSpacing: 0.4, color: selected ? goldLight : const Color(0xFFBDAED0));
            }),
          ),
          progressIndicatorTheme: const ProgressIndicatorThemeData(color: goldLight),
          dividerColor: gold.withValues(alpha: 0.2),
          listTileTheme: const ListTileThemeData(iconColor: goldLight),
          snackBarTheme: const SnackBarThemeData(backgroundColor: purple, contentTextStyle: TextStyle(color: Colors.white)),
          chipTheme: ChipThemeData(
            backgroundColor: Colors.white10,
            selectedColor: glow,
            labelStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
            side: BorderSide(color: gold.withValues(alpha: 0.45)),
          ),
          dialogTheme: const DialogThemeData(backgroundColor: purple),
          filledButtonTheme: FilledButtonThemeData(style: accentButtonStyle()),
          outlinedButtonTheme: OutlinedButtonThemeData(
            style: OutlinedButton.styleFrom(
              foregroundColor: goldLight,
              minimumSize: const Size.fromHeight(48),
              side: BorderSide(color: gold.withValues(alpha: 0.6)),
              backgroundColor: purple.withValues(alpha: 0.35),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              textStyle: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.8),
            ),
          ),
          textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(foregroundColor: goldLight, textStyle: const TextStyle(fontWeight: FontWeight.w800))),
          textTheme: const TextTheme(
            headlineMedium: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5),
            bodyMedium: TextStyle(color: Color(0xFFF7F4FB), height: 1.35),
          ),
        ),
        builder: (context, child) {
          final media = MediaQuery.of(context);
          final factor = media.textScaler.scale(deviceTextScale(media.size)).clamp(1.0, 2.0);
          return MediaQuery(
            data: media.copyWith(textScaler: TextScaler.linear(factor)),
            child: GlowClock(child: child ?? const SizedBox.shrink()),
          );
        },
        home: const ClubShell(),
      ),
    );
  }
}

class ClubShell extends StatefulWidget {
  const ClubShell({super.key});

  @override
  State<ClubShell> createState() => _ClubShellState();
}

class _ClubShellState extends State<ClubShell> {
  int index = 0;

  @override
  Widget build(BuildContext context) {
    final cart = ClubScope.of(context).cart;
    final pages = const [HomePage(), TeamPage(), FixturesPage(), ShopPage(), MorePage()];
    return AnimatedBuilder(
      animation: cart,
      builder: (context, _) => Scaffold(
        backgroundColor: Colors.transparent,
        extendBody: true,
        body: AnimatedSwitcher(
          duration: const Duration(milliseconds: 320),
          switchInCurve: Curves.easeOutCubic,
          layoutBuilder: (current, _) => current ?? const SizedBox.shrink(),
          transitionBuilder: (child, animation) => FadeTransition(
            opacity: animation,
            child: SlideTransition(position: Tween(begin: const Offset(0, 0.03), end: Offset.zero).animate(animation), child: child),
          ),
          child: KeyedSubtree(key: ValueKey(index), child: pages[index]),
        ),
        bottomNavigationBar: _ClubNavBar(
          index: index,
          cartCount: cart.count,
          onChanged: (value) {
            if (value == index) return;
            HapticFeedback.selectionClick();
            ClubAnalytics.screen(const ['home', 'team', 'fixtures', 'shop', 'more'][value]);
            setState(() => index = value);
          },
        ),
      ),
    );
  }
}

/// Floating capsule navigation: a gold lens slides to the chosen tab and lifts its icon above the bar.
class _ClubNavBar extends StatelessWidget {
  const _ClubNavBar({required this.index, required this.cartCount, required this.onChanged});
  final int index;
  final int cartCount;
  final ValueChanged<int> onChanged;

  static const _items = [
    (FontAwesomeIcons.house, 'Home'),
    (FontAwesomeIcons.peopleGroup, 'Team'),
    (FontAwesomeIcons.calendarDays, 'Fixtures'),
    (FontAwesomeIcons.bagShopping, 'Shop'),
    (FontAwesomeIcons.grip, 'More'),
  ];
  static const _lens = 52.0;
  static const _motion = Duration(milliseconds: 420);

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(14, 0, 14, bottom + 10),
      child: SizedBox(
        height: 84,
        child: LayoutBuilder(
          builder: (context, box) {
            final slot = box.maxWidth / _items.length;
            return Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned.fill(
                  top: 18,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(26),
                      boxShadow: [BoxShadow(color: const Color(0xFF0F021B).withValues(alpha: 0.65), blurRadius: 20, offset: const Offset(0, 10))],
                    ),
                    child: GlowFrame(
                      radius: 26,
                      width: 1.5,
                      bloom: 0.6,
                      child: const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFF3A0A66), Color(0xFF1C0432)]),
                        ),
                        child: SizedBox.expand(),
                      ),
                    ),
                  ),
                ),
                AnimatedPositioned(
                  duration: _motion,
                  curve: Curves.easeOutBack,
                  left: slot * index + (slot - _lens) / 2,
                  top: 0,
                  width: _lens,
                  height: _lens,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: goldSurface,
                      border: Border.all(color: const Color(0xFF2B074D), width: 3),
                      boxShadow: [BoxShadow(color: const Color(0xFFEEC873).withValues(alpha: 0.55), blurRadius: 18)],
                    ),
                  ),
                ),
                Row(
                  children: [
                    for (var i = 0; i < _items.length; i++)
                      Expanded(
                        child: Semantics(
                          button: true,
                          selected: i == index,
                          label: _items[i].$2,
                          child: GestureDetector(
                            behavior: HitTestBehavior.opaque,
                            onTap: () => onChanged(i),
                            child: _NavItem(icon: _items[i].$1, label: _items[i].$2, selected: i == index, badge: i == 3 ? cartCount : 0),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({required this.icon, required this.label, required this.selected, required this.badge});
  final FaIconData icon;
  final String label;
  final bool selected;
  final int badge;

  @override
  Widget build(BuildContext context) {
    final glyph = AnimatedScale(
      scale: selected ? 1.12 : 1,
      duration: _ClubNavBar._motion,
      curve: Curves.easeOutBack,
      child: FaIcon(icon, size: 19, color: selected ? ink : const Color(0xFFBDAED0)),
    );
    return Stack(
      clipBehavior: Clip.none,
      children: [
        AnimatedPositioned(
          duration: _ClubNavBar._motion,
          curve: Curves.easeOutBack,
          left: 0,
          right: 0,
          top: selected ? 16 : 32,
          child: Center(
            child: badge > 0 ? Badge(backgroundColor: pink, label: Text('$badge'), offset: const Offset(10, -8), child: glyph) : glyph,
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 10,
          child: AnimatedDefaultTextStyle(
            duration: _ClubNavBar._motion,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: selected ? 1 : 0.3,
              color: selected ? goldLight : const Color(0xFF9F8FB5),
            ),
            child: Text(label.toUpperCase(), textAlign: TextAlign.center, maxLines: 1),
          ),
        ),
      ],
    );
  }
}

