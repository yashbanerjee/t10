import 'package:flutter/material.dart';
import 'package:united_tigers/api.dart';
import 'package:united_tigers/cart_store.dart';
import 'package:united_tigers/pages/fixtures_page.dart';
import 'package:united_tigers/pages/home_page.dart';
import 'package:united_tigers/pages/more_pages.dart';
import 'package:united_tigers/pages/shop_pages.dart';
import 'package:united_tigers/pages/team_page.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/widgets.dart';

void main() {
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
        theme: ThemeData(
          brightness: Brightness.dark,
          scaffoldBackgroundColor: Colors.transparent,
          canvasColor: night,
          colorScheme: const ColorScheme.dark(primary: orange, secondary: gold, surface: purple),
          iconTheme: const IconThemeData(color: gold),
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
        builder: (context, child) => ClubAtmosphere(child: child ?? const SizedBox.shrink()),
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
        body: pages[index],
        bottomNavigationBar: DecoratedBox(
          decoration: BoxDecoration(
            gradient: const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xF52B074D), Color(0xFA1C0432)]),
            boxShadow: [BoxShadow(color: const Color(0xFF12021F).withValues(alpha: 0.5), blurRadius: 20, offset: const Offset(0, -6))],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 2, width: double.infinity, child: DecoratedBox(decoration: BoxDecoration(gradient: collarGradient))),
              NavigationBar(
                selectedIndex: index,
                onDestinationSelected: (value) => setState(() => index = value),
                destinations: [
                  const NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home_rounded), label: 'Home'),
                  const NavigationDestination(icon: Icon(Icons.groups_outlined), selectedIcon: Icon(Icons.groups_rounded), label: 'Team'),
                  const NavigationDestination(icon: Icon(Icons.sports_cricket_outlined), selectedIcon: Icon(Icons.sports_cricket), label: 'Fixtures'),
                  NavigationDestination(icon: Badge(isLabelVisible: cart.count > 0, backgroundColor: pink, label: Text('${cart.count}'), child: const Icon(Icons.shopping_bag_outlined)), selectedIcon: Badge(isLabelVisible: cart.count > 0, backgroundColor: pink, label: Text('${cart.count}'), child: const Icon(Icons.shopping_bag_rounded)), label: 'Shop'),
                  const NavigationDestination(icon: Icon(Icons.grid_view_outlined), selectedIcon: Icon(Icons.grid_view_rounded), label: 'More'),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
