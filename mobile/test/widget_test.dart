import 'package:flutter_test/flutter_test.dart';
import 'package:united_tigers/main.dart';

void main() {
  testWidgets('shows the club navigation', (tester) async {
    await tester.pumpWidget(const UnitedTigersApp());
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Shop'), findsOneWidget);
  });
}
