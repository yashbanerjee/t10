import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/services/error_reporter.dart';
import 'package:united_tigers/widgets.dart';

enum PaymentOutcome { paid, cancelled }

/// The publishable key last given to the Stripe SDK. Reading `Stripe.publishableKey`
/// before it is set throws, so the app keeps its own copy.
String? _appliedKey;

/// Shows Stripe's native PaymentSheet for an order the server has already held.
/// The publishable key arrives with every checkout from the admin's Stripe settings,
/// so changing the keys in admin takes effect on the next payment without an app update.
/// Throws with a readable message when Stripe itself fails.
Future<PaymentOutcome> payWithStripe(CheckoutStart start, {required String name, required String email, required String phone}) async {
  try {
    if (_appliedKey != start.publishableKey) {
      Stripe.publishableKey = start.publishableKey;
      await Stripe.instance.applySettings();
      _appliedKey = start.publishableKey;
    }
    await Stripe.instance.initPaymentSheet(
      paymentSheetParameters: SetupPaymentSheetParameters(
        paymentIntentClientSecret: start.clientSecret,
        merchantDisplayName: 'United Tigers',
        style: ThemeMode.light,
        billingDetails: BillingDetails(name: name, email: email, phone: phone),
        appearance: const PaymentSheetAppearance(colors: PaymentSheetAppearanceColors(primary: pink)),
      ),
    );
    await Stripe.instance.presentPaymentSheet();
    return PaymentOutcome.paid;
  } on StripeException catch (error) {
    if (error.error.code == FailureCode.Canceled) return PaymentOutcome.cancelled;
    ErrorReporter.report('Stripe: ${error.error.code.name} ${error.error.message ?? ''}', details: error.error.localizedMessage);
    throw Exception(error.error.localizedMessage ?? error.error.message ?? 'The payment could not be completed.');
  } catch (error) {
    _appliedKey = null;
    ErrorReporter.report('Stripe setup failed: $error');
    throw Exception('Card payment could not start. Please try again shortly.');
  }
}
