import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:united_tigers/services/analytics.dart';
import 'package:united_tigers/cart_store.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/pages/club_pages.dart';
import 'package:united_tigers/services/stripe_payment.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/widgets.dart';

class _BagButton extends StatelessWidget {
  const _BagButton();

  @override
  Widget build(BuildContext context) {
    final cart = ClubScope.of(context).cart;
    return AnimatedBuilder(
      animation: cart,
      builder: (context, _) {
        final count = cart.lines.fold<int>(0, (sum, line) => sum + line.quantity);
        return IconButton(
          tooltip: 'Your bag',
          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartPage())),
          icon: Badge(
            isLabelVisible: count > 0,
            backgroundColor: pink,
            label: Text('$count'),
            child: const FaIcon(FontAwesomeIcons.bagShopping, color: goldLight, size: 19),
          ),
        );
      },
    );
  }
}

class ShopPage extends StatelessWidget {
  const ShopPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: ClubAppBar('Shop', actions: [
        IconButton(tooltip: 'Track your booking', onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TrackOrderPage())), icon: const FaIcon(FontAwesomeIcons.truckFast, color: goldLight, size: 18)),
        const _BagButton(),
      ]),
      body: AnimatedBuilder(
        animation: api,
        builder: (context, _) {
          final products = api.catalog.products;
          return RefreshIndicator(
            color: pink,
            onRefresh: api.refresh,
            child: CustomScrollView(
              scrollCacheExtent: pageCacheExtent,
              slivers: [
                const SliverToBoxAdapter(child: PageHero(eyebrow: 'Official merchandise', title: 'Wear the\nstripes.', intro: 'Pick your kit and pay securely by card. Your order is booked as soon as the payment goes through.')),
                if (products.isEmpty)
                  const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.all(16), child: EmptyPanel(title: 'Kit coming soon', message: 'Kit will appear here.')))
                else
                  SliverPadding(
                    padding: EdgeInsets.fromLTRB(16, 18, 16, 28 + navClearance(context)),
                    sliver: SliverGrid(
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: MediaQuery.sizeOf(context).shortestSide >= 600 ? 4 : 2, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: 0.64),
                      delegate: SliverChildBuilderDelegate((context, index) {
                        final product = products[index];
                        return ClubCard(
                          padding: const EdgeInsets.all(10),
                          highlight: product.isFeatured,
                          onTap: () => openProduct(context, product),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(child: RemoteImage(api.media(product.image), height: 150, radius: 12)),
                              const SizedBox(height: 10),
                              Text(product.category?.replaceAll('_', ' ').toUpperCase() ?? '', style: const TextStyle(color: goldLight, fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
                              Text(product.name.toUpperCase(), maxLines: 2, overflow: TextOverflow.ellipsis, style: displayStyle(16, color: Colors.white, height: 1.05)),
                              const SizedBox(height: 6),
                              GoldText(money(product.price), style: displayStyle(20)),
                            ],
                          ),
                        );
                      }, childCount: products.length),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

void openProduct(BuildContext context, Product product) {
  ClubAnalytics.viewProduct(product.slug, product.name, product.price);
  Navigator.push(context, MaterialPageRoute(builder: (_) => ProductPage(slug: product.slug, preview: product)));
}

class ProductPage extends StatefulWidget {
  const ProductPage({super.key, required this.slug, this.preview});
  final String slug;
  final Product? preview;

  @override
  State<ProductPage> createState() => _ProductPageState();
}

class _ProductPageState extends State<ProductPage> {
  Product? product;
  String color = '';
  String size = '';
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    if (widget.preview != null) _apply(widget.preview!);
    _load();
  }

  void _apply(Product value) {
    product = value;
    if (color.isEmpty && value.variants.isNotEmpty) {
      color = value.variants.first.color;
      size = value.variants.firstWhere((item) => item.color == color, orElse: () => value.variants.first).size;
    }
  }

  Future<void> _load() async {
    try {
      final loaded = await ClubScope.of(context).api.fetchProduct(widget.slug);
      if (mounted) setState(() => _apply(loaded));
    } catch (_) {}
  }

  Widget _choice(String label, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          gradient: selected ? accentGradient : null,
          color: selected ? null : purple.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: selected ? goldLight : gold.withValues(alpha: 0.3)),
        ),
        child: Text(label, style: TextStyle(fontWeight: FontWeight.w800, color: selected ? Colors.white : const Color(0xFFD9CCE6))),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final current = product;
    if (current == null) return const Scaffold(appBar: ClubAppBar('Shop'), body: LoadingView());
    final api = ClubScope.of(context).api;
    final colors = current.variants.map((item) => item.color).toSet().toList();
    final sizes = current.variants.where((item) => item.color == color).toList();
    final selected = sizes.where((item) => item.size == size).firstOrNull ?? (sizes.isEmpty ? null : sizes.first);
    final price = selected?.price ?? current.price;
    final photo = api.media(selected?.image ?? current.image);
    return Scaffold(
      appBar: const ClubAppBar('Shop', actions: [_BagButton()]),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          ClubCard(highlight: true, padding: const EdgeInsets.all(8), child: RemoteImage(photo, height: 320)),
          const SizedBox(height: 16),
          if (current.category != null) Eyebrow(current.category!.replaceAll('_', ' ')),
          const SizedBox(height: 8),
          GoldText(current.name.toUpperCase(), style: displayStyle(32, height: 0.95)),
          const SizedBox(height: 6),
          Text(money(price), style: displayStyle(26, color: Colors.white)),
          const SizedBox(height: 10),
          Text(current.description, style: const TextStyle(color: Color(0xFFE6DDF0), height: 1.5)),
          if (colors.isNotEmpty) ...[
            const SectionTitle('Colour'),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final item in colors)
                  _choice(item, item == color, () => setState(() {
                        color = item;
                        size = current.variants.firstWhere((variant) => variant.color == item).size;
                      })),
              ],
            ),
          ],
          if (sizes.isNotEmpty) ...[
            const SectionTitle('Size'),
            Wrap(spacing: 8, runSpacing: 8, children: [for (final item in sizes) _choice(item.size, item.size == size, () => setState(() => size = item.size))]),
          ],
          if (selected != null) Padding(padding: const EdgeInsets.only(top: 10), child: Text(selected.stock < 1 ? 'Sold out' : '${selected.stock} available', style: const TextStyle(color: goldLight, fontWeight: FontWeight.w700))),
          const SizedBox(height: 20),
          FilledButton(
            style: goldButtonStyle(),
            onPressed: selected == null || selected.stock < 1
                ? null
                : () async {
                    await ClubScope.of(context).cart.add(
                      CartLine(
                        variantId: selected.id,
                        name: current.name,
                        color: selected.color,
                        size: selected.size,
                        price: price,
                        image: photo,
                      ),
                    );
                    ClubAnalytics.addToCart(current.slug, current.name, price.toDouble(), 1);
                    if (context.mounted) await showClubMessage(context, 'Added to your bag.');
                  },
            child: const Text('ADD TO BAG'),
          ),
        ],
      ),
    );
  }
}

class CartPage extends StatelessWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context) {
    final cart = ClubScope.of(context).cart;
    return AnimatedBuilder(
      animation: cart,
      builder: (context, _) => Scaffold(
        appBar: const ClubAppBar('Your bag'),
        body: cart.lines.isEmpty
            ? const Padding(padding: EdgeInsets.all(16), child: EmptyPanel(title: 'Your bag is empty', message: 'Pick your kit from the shop.'))
            : ListView(
                scrollCacheExtent: pageCacheExtent,
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                children: [
                  ...cart.lines.map(
                    (line) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: ClubCard(
                        child: Row(
                          children: [
                            SizedBox(width: 64 * clubScale(context), height: 64 * clubScale(context), child: RemoteImage(line.image ?? '', height: 64, radius: 12)),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(line.name.toUpperCase(), style: displayStyle(16, color: Colors.white)),
                                  Text('${line.color} · ${line.size}', style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 12.5)),
                                  GoldText(money(line.price), style: displayStyle(17)),
                                ],
                              ),
                            ),
                            IconButton(onPressed: () => cart.setQuantity(line.variantId, line.quantity - 1), icon: const FaIcon(FontAwesomeIcons.circleMinus, color: goldLight, size: 20)),
                            Text('${line.quantity}', style: const TextStyle(fontWeight: FontWeight.w900)),
                            IconButton(onPressed: () => cart.setQuantity(line.variantId, line.quantity + 1), icon: const FaIcon(FontAwesomeIcons.circlePlus, color: goldLight, size: 20)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  ClubCard(
                    highlight: true,
                    child: Row(children: [const Expanded(child: Eyebrow('Total')), GoldText(money(cart.total), style: displayStyle(28))]),
                  ),
                  const SizedBox(height: 14),
                  FilledButton(style: goldButtonStyle(), onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CheckoutPage())), child: const Text('CHECKOUT')),
                ],
              ),
      ),
    );
  }
}

class OrderPaidPage extends StatefulWidget {
  const OrderPaidPage({super.key, required this.number, required this.email, required this.orderId});

  final String number;
  final String email;
  final String orderId;

  @override
  State<OrderPaidPage> createState() => _OrderPaidPageState();
}

class _OrderPaidPageState extends State<OrderPaidPage> {
  late Future<TrackedOrder?> order = _load();

  Future<TrackedOrder?> _load() async {
    final api = ClubScope.of(context).api;
    // Stripe can take a moment to settle the payment after the sheet closes.
    for (var attempt = 0; attempt < 3; attempt++) {
      try {
        await api.confirmCheckout(widget.orderId).catchError((_) => null);
        final found = await api.trackOrder(widget.number, widget.email);
        if (found.paymentStatus == 'PAID' || attempt == 2) return found;
      } catch (_) {
        if (attempt == 2) return null;
      }
      await Future<void>.delayed(const Duration(seconds: 2));
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const ClubAppBar('Checkout'),
      body: FutureBuilder<TrackedOrder?>(
        future: order,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator(color: goldLight));
          final found = snapshot.data;
          final paid = found?.paymentStatus == 'PAID';
          return ListView(
            scrollCacheExtent: pageCacheExtent,
            padding: const EdgeInsets.only(bottom: 32),
            children: [
              PageHero(
                eyebrow: 'Checkout',
                title: paid ? 'Payment\nreceived.' : 'Checking your\npayment.',
                intro: paid ? 'Thanks for backing the Tigers. A confirmation is on its way to your email.' : 'We could not confirm this payment yet. If you were charged, your order will update shortly.',
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: ClubCard(
                  highlight: true,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Eyebrow(paid ? 'Paid' : 'Payment pending'),
                      const SizedBox(height: 8),
                      SelectableText(widget.number, style: displayStyle(30, color: Colors.white)),
                      const SizedBox(height: 8),
                      Text(
                        paid ? '${money(found!.total)} paid. Keep this number to track your order. The club will be in touch about delivery.' : 'Keep this number. You can check the payment status on the tracking page.',
                        style: const TextStyle(color: Color(0xFFE6DDF0), height: 1.5),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: FilledButton(
                  style: goldButtonStyle(),
                  onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => TrackOrderPage(number: widget.number, email: widget.email))),
                  child: const Text('TRACK THIS ORDER'),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                child: OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('BACK TO THE SHOP')),
              ),
            ],
          );
        },
      ),
    );
  }
}

class CheckoutPage extends StatefulWidget {
  const CheckoutPage({super.key});

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  final name = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();
  final address = TextEditingController();
  final city = TextEditingController();
  final country = TextEditingController(text: 'United Arab Emirates');
  final notes = TextEditingController();
  bool busy = false;

  @override
  void dispose() {
    for (final field in [name, email, phone, address, city, country, notes]) {
      field.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const ClubAppBar('Your details'),
      body: ListView(
        scrollCacheExtent: pageCacheExtent,
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          const Text('Name, email, phone and a delivery address, then pay securely by card with Stripe. Your items are held while you pay.', style: TextStyle(color: Color(0xFFE6DDF0), height: 1.5)),
          const SizedBox(height: 14),
          ClubField(label: 'Name', controller: name),
          ClubField(label: 'Email', controller: email, email: true),
          ClubField(label: 'Phone', controller: phone, phone: true),
          ClubField(label: 'Address', controller: address),
          ClubField(label: 'City', controller: city),
          ClubField(label: 'Country', controller: country),
          ClubField(label: 'Notes', controller: notes, lines: 3),
          AnimatedBuilder(
            animation: ClubScope.of(context).cart,
            builder: (context, _) => FilledButton(
              style: goldButtonStyle(),
              onPressed: busy || ClubScope.of(context).cart.lines.isEmpty ? null : _submit,
              child: Text(busy ? 'OPENING PAYMENT…' : 'PAY ${money(ClubScope.of(context).cart.total)} SECURELY'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    final scope = ClubScope.of(context);
    final cart = scope.cart;
    final api = scope.api;
    final buyer = email.text.trim();
    setState(() => busy = true);
    try {
      final start = await api.startCheckout({
        'name': name.text.trim(),
        'email': email.text.trim(),
        'phone': phone.text.trim(),
        'address': address.text.trim(),
        'city': city.text.trim(),
        'country': country.text.trim(),
        'notes': notes.text.trim(),
        'items': cart.lines.map((line) => {'variantId': line.variantId, 'quantity': line.quantity}).toList(),
      });
      PaymentOutcome outcome;
      String? failure;
      try {
        outcome = await payWithStripe(start, name: name.text.trim(), email: buyer, phone: phone.text.trim());
      } catch (reason) {
        outcome = PaymentOutcome.cancelled;
        failure = '$reason'.replaceFirst('Exception: ', '');
      }
      var paid = outcome == PaymentOutcome.paid;
      if (!paid) {
        // Frees the held stock; Stripe may still have taken the payment just before the sheet closed.
        final status = await api.cancelCheckout(start.orderId).catchError((_) => null);
        paid = status == 'PAID';
      }
      if (!mounted) return;
      if (!paid) {
        await showClubMessage(context, failure == null ? 'Payment was not completed, so nothing was charged. Your bag is still here.' : '$failure Nothing was charged and your bag is still here.');
        return;
      }
      await cart.clear();
      ClubAnalytics.event('purchase_completed');
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => OrderPaidPage(number: start.number, email: buyer, orderId: start.orderId)), (route) => route.isFirst);
    } catch (reason) {
      if (mounted) await showClubMessage(context, '$reason'.replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}
