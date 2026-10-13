import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:united_tigers/widgets.dart';

enum PaymentOutcome { paid, cancelled }

/// Hosts the Stripe Checkout page. Stripe sends the fan back to the website's
/// success or cancel address, which is where the app takes over again.
class StripeCheckoutPage extends StatefulWidget {
  const StripeCheckoutPage({super.key, required this.url});

  final String url;

  @override
  State<StripeCheckoutPage> createState() => _StripeCheckoutPageState();
}

class _StripeCheckoutPageState extends State<StripeCheckoutPage> {
  late final WebViewController controller;
  bool loading = true;
  bool confirming = false;
  bool finished = false;

  @override
  void initState() {
    super.initState();
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: _route,
          onPageStarted: (_) {
            if (mounted) setState(() => loading = true);
          },
          onPageFinished: (url) {
            if (!mounted) return;
            setState(() => loading = false);
            // The success page confirms the payment on the server while it renders.
            if (_isSuccess(Uri.tryParse(url))) _finish(PaymentOutcome.paid);
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  bool _isSuccess(Uri? uri) => uri != null && uri.path.endsWith('/checkout/success');

  bool _isCancel(Uri? uri) => uri != null && uri.path.endsWith('/checkout') && uri.queryParameters.containsKey('cancelled');

  NavigationDecision _route(NavigationRequest request) {
    final uri = Uri.tryParse(request.url);
    if (_isCancel(uri)) {
      _finish(PaymentOutcome.cancelled);
      return NavigationDecision.prevent;
    }
    if (_isSuccess(uri)) {
      setState(() => confirming = true);
      return NavigationDecision.navigate;
    }
    if (uri != null && uri.scheme != 'http' && uri.scheme != 'https' && uri.scheme != 'about' && uri.scheme != 'data') {
      // Bank and wallet apps used for card authentication.
      openExternal(request.url);
      return NavigationDecision.prevent;
    }
    return NavigationDecision.navigate;
  }

  void _finish(PaymentOutcome outcome) {
    if (finished || !mounted) return;
    finished = true;
    Navigator.pop(context, outcome);
  }

  Future<void> _leave() async {
    if (confirming) return;
    final leave = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Leave payment?'),
        content: const Text('Your order is only booked once the payment goes through. If you leave now, nothing is charged and your bag stays as it is.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('KEEP PAYING')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('LEAVE')),
        ],
      ),
    );
    if (leave == true) _finish(PaymentOutcome.cancelled);
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _leave();
      },
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: night,
          foregroundColor: Colors.white,
          title: const Text('Secure payment'),
          leading: IconButton(tooltip: 'Close', icon: const Icon(Icons.close), onPressed: _leave),
        ),
        body: Stack(
          children: [
            WebViewWidget(controller: controller),
            if (loading && !confirming) const LinearProgressIndicator(color: pink, backgroundColor: Colors.transparent),
            if (confirming)
              const ColoredBox(
                color: night,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(color: goldLight),
                      SizedBox(height: 18),
                      Text('Confirming your payment…', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
