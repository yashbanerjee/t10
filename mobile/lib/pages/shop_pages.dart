import 'package:flutter/material.dart';
import 'package:united_tigers/cart_store.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/widgets.dart';

class ShopPage extends StatelessWidget {
  const ShopPage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return Scaffold(
      appBar: AppBar(
        title: const Text('SHOP'),
        actions: [
          IconButton(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartPage())),
            icon: const Icon(Icons.shopping_bag_outlined),
          ),
        ],
      ),
      body: AnimatedBuilder(
        animation: api,
        builder: (context, _) {
          final products = api.catalog.products;
          if (products.isEmpty) return const Center(child: Text('Kit will appear here.'));
          return RefreshIndicator(
            onRefresh: api.refresh,
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: 0.68),
              itemCount: products.length,
              itemBuilder: (context, index) {
                final product = products[index];
                return ClubCard(
                  padding: const EdgeInsets.all(10),
                  onTap: () => openProduct(context, product),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      RemoteImage(api.media(product.image), height: 120, radius: 12),
                      const SizedBox(height: 8),
                      Text(product.category?.replaceAll('_', ' ') ?? '', style: const TextStyle(color: gold, fontSize: 11, fontWeight: FontWeight.w800)),
                      Text(product.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800)),
                      const Spacer(),
                      Text(money(product.price), style: const TextStyle(color: orange, fontWeight: FontWeight.w800)),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

void openProduct(BuildContext context, Product product) {
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

  @override
  Widget build(BuildContext context) {
    final current = product;
    if (current == null) return const Scaffold(body: LoadingView());
    final api = ClubScope.of(context).api;
    final colors = current.variants.map((item) => item.color).toSet().toList();
    final sizes = current.variants.where((item) => item.color == color).toList();
    final selected = sizes.where((item) => item.size == size).firstOrNull ?? (sizes.isEmpty ? null : sizes.first);
    final price = selected?.price ?? current.price;
    final photo = api.media(selected?.image ?? current.image);
    return Scaffold(
      appBar: AppBar(title: Text(current.name)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          RemoteImage(photo, height: 260),
          const SizedBox(height: 12),
          Text(money(price), style: const TextStyle(color: orange, fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text(current.description),
          const SizedBox(height: 12),
          const Text('COLOUR', style: TextStyle(fontWeight: FontWeight.w800)),
          Wrap(
            spacing: 8,
            children: colors
                .map(
                  (item) => ChoiceChip(
                    label: Text(item),
                    selected: item == color,
                    onSelected: (_) => setState(() {
                      color = item;
                      size = current.variants.firstWhere((variant) => variant.color == item).size;
                    }),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 8),
          const Text('SIZE', style: TextStyle(fontWeight: FontWeight.w800)),
          Wrap(
            spacing: 8,
            children: sizes
                .map(
                  (item) => ChoiceChip(
                    label: Text(item.size),
                    selected: item.size == size,
                    onSelected: (_) => setState(() => size = item.size),
                  ),
                )
                .toList(),
          ),
          if (selected != null) Text('${selected.stock} available'),
          const SizedBox(height: 16),
          FilledButton(
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
        appBar: AppBar(title: const Text('YOUR BAG')),
        body: cart.lines.isEmpty
            ? const Center(child: Text('Your bag is empty.'))
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  ...cart.lines.map(
                    (line) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: ClubCard(
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(line.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                                  Text('${line.color} · ${line.size}'),
                                  Text(money(line.price)),
                                ],
                              ),
                            ),
                            IconButton(onPressed: () => cart.setQuantity(line.variantId, line.quantity - 1), icon: const Icon(Icons.remove)),
                            Text('${line.quantity}'),
                            IconButton(onPressed: () => cart.setQuantity(line.variantId, line.quantity + 1), icon: const Icon(Icons.add)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text('Total ${money(cart.total)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),
                  FilledButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CheckoutPage())), child: const Text('CHECKOUT')),
                ],
              ),
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
      appBar: AppBar(title: const Text('YOUR DETAILS')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Name, email, phone and a delivery address. The club holds the stock and confirms payment with you.'),
          const SizedBox(height: 12),
          ClubField(label: 'Name', controller: name),
          ClubField(label: 'Email', controller: email, email: true),
          ClubField(label: 'Phone', controller: phone, phone: true),
          ClubField(label: 'Address', controller: address),
          ClubField(label: 'City', controller: city),
          ClubField(label: 'Country', controller: country),
          ClubField(label: 'Notes', controller: notes, lines: 3),
          FilledButton(onPressed: busy ? null : _submit, child: Text(busy ? 'BOOKING…' : 'BOOK ORDER')),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    final cart = ClubScope.of(context).cart;
    setState(() => busy = true);
    try {
      final message = await ClubScope.of(context).api.sendOrder({
        'name': name.text.trim(),
        'email': email.text.trim(),
        'phone': phone.text.trim(),
        'address': address.text.trim(),
        'city': city.text.trim(),
        'country': country.text.trim(),
        'notes': notes.text.trim(),
        'items': cart.lines.map((line) => {'variantId': line.variantId, 'quantity': line.quantity}).toList(),
      });
      await cart.clear();
      if (mounted) {
        await showClubMessage(context, message);
        if (mounted) Navigator.popUntil(context, (route) => route.isFirst);
      }
    } catch (reason) {
      if (mounted) await showClubMessage(context, '$reason'.replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}
