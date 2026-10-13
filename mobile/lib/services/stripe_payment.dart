import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/widgets.dart';

enum PaymentOutcome { paid, cancelled }

/// Shows Stripe's native PaymentSheet for an order the server has already held.
/// Throws with a readable message when Stripe itself fails.
Future<PaymentOutcome> payWithStripe(CheckoutStart start, {required String name, required String email, required String phone}) async {
  if (Stripe.publishableKey != start.publishableKey) {
    Stripe.publishableKey = start.publishableKey;
    await Stripe.instance.applySettings();
  }
  try {
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
    throw Exception(error.error.localizedMessage ?? error.error.message ?? 'The payment could not be completed.');
  }
}
