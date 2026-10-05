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
          appBarTheme: const AppBarTheme(backgroundColor: Colors.transparent, foregroundColor: Colors.white, elevation: 0, centerTitle: false),
          navigationBarTheme: NavigationBarThemeData(
            backgroundColor: const Color(0xF20B0016),
            indicatorColor: glow,
            labelTextStyle: WidgetStateProperty.resolveWith((states) {
              final selected = states.contains(WidgetState.selected);
              return TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: selected ? gold : Colors.white70);
            }),
          ),
          chipTheme: ChipThemeData(
            backgroundColor: Colors.white10,
            selectedColor: glow,
            labelStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
            side: BorderSide(color: gold.withValues(alpha: 0.45)),
          ),
          dialogTheme: const DialogThemeData(backgroundColor: purple),
          filledButtonTheme: FilledButtonThemeData(
            style: FilledButton.styleFrom(
              backgroundColor: orange,
              foregroundColor: Colors.white,
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              textStyle: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.6),
            ),
          ),
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
        bottomNavigationBar: NavigationBar(
          selectedIndex: index,
          onDestinationSelected: (value) => setState(() => index = value),
          destinations: [
            const NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
            const NavigationDestination(icon: Icon(Icons.groups_outlined), selectedIcon: Icon(Icons.groups), label: 'Team'),
            const NavigationDestination(icon: Icon(Icons.sports_cricket_outlined), selectedIcon: Icon(Icons.sports_cricket), label: 'Fixtures'),
            NavigationDestination(icon: Badge(isLabelVisible: cart.count > 0, label: Text('${cart.count}'), child: const Icon(Icons.shopping_bag_outlined)), label: 'Shop'),
            const NavigationDestination(icon: Icon(Icons.menu), label: 'More'),
          ],
        ),
      ),
    );
  }
}
