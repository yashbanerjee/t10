import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

const night = Color(0xFF1C0432);
const page = Color(0xFF390966);
const purple = Color(0xFF2B074D);
const glow = Color(0xFF460B7D);
const gold = Color(0xFFD2A95A);
const goldLight = Color(0xFFF4DB96);
const pink = Color(0xFFC9177E);
const orange = pink;

const goldColors = [Color(0xFFFFE8AC), Color(0xFFEEC873), Color(0xFFD2A95A), Color(0xFFAC884A)];

class ClubAtmosphere extends StatelessWidget {
  const ClubAtmosphere({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF3D096D), Color(0xFF390966), Color(0xFF35085E)],
          stops: [0, 0.34, 1],
        ),
      ),
      child: child,
    );
  }
}

class ClubCard extends StatelessWidget {
  const ClubCard({super.key, required this.child, this.onTap, this.padding = const EdgeInsets.all(16)});
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          width: double.infinity,
          padding: padding,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFF2F0755), Color(0xFF260644)],
            ),
            border: Border.all(color: gold.withValues(alpha: 0.28)),
          ),
          child: child,
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key, this.action, this.onAction});
  final String text;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 22, bottom: 10),
      child: Row(
        children: [
          Container(width: 8, height: 8, margin: const EdgeInsets.only(right: 8), decoration: const BoxDecoration(color: gold, shape: BoxShape.circle)),
          Expanded(child: Text(text, style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 1.1, fontSize: 13))),
          if (action != null) TextButton(onPressed: onAction, child: Text(action!, style: const TextStyle(color: gold, fontWeight: FontWeight.w800))),
        ],
      ),
    );
  }
}

class GoldText extends StatelessWidget {
  const GoldText(this.text, {super.key, required this.style, this.textAlign});
  final String text;
  final TextStyle style;
  final TextAlign? textAlign;

  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      shaderCallback: (bounds) => const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: goldColors).createShader(bounds),
      child: Text(text, textAlign: textAlign, style: style.copyWith(color: Colors.white)),
    );
  }
}

class MediaBadge extends StatelessWidget {
  const MediaBadge({super.key, required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 21,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: const Color(0xE62B074D),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: gold.withValues(alpha: 0.4)),
      ),
      child: Text(label, style: const TextStyle(color: goldLight, fontSize: 11, fontWeight: FontWeight.w800, height: 1, letterSpacing: 0.8)),
    );
  }
}

class RemoteImage extends StatelessWidget {
  const RemoteImage(this.url, {super.key, this.height = 140, this.radius = 14});
  final String url;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: url.isEmpty
          ? Container(height: height, color: glow)
          : Image.network(
              url,
              height: height,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => Container(height: height, color: glow),
            ),
    );
  }
}

class StatusChip extends StatelessWidget {
  const StatusChip(this.label, {super.key});
  final String label;

  @override
  Widget build(BuildContext context) {
    final win = label == 'WIN';
    final next = label == 'NEXT' || label == 'UPCOMING';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: win ? const Color(0xFF1F8A4C) : next ? orange : glow,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800)),
    );
  }
}

class ClubField extends StatelessWidget {
  const ClubField({super.key, required this.label, required this.controller, this.email = false, this.phone = false, this.secret = false, this.lines = 1});
  final String label;
  final TextEditingController controller;
  final bool email;
  final bool phone;
  final bool secret;
  final int lines;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        obscureText: secret,
        keyboardType: email ? TextInputType.emailAddress : phone ? TextInputType.phone : lines > 1 ? TextInputType.multiline : TextInputType.text,
        minLines: lines,
        maxLines: lines,
        decoration: InputDecoration(
          labelText: label,
          filled: true,
          fillColor: Colors.white10,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        ),
      ),
    );
  }
}

Future<void> showClubMessage(BuildContext context, String message) {
  return showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('United Tigers'),
      content: Text(message),
      actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK'))],
    ),
  );
}

Future<void> openExternal(String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null) return;
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}

class LoadingView extends StatelessWidget {
  const LoadingView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: CircularProgressIndicator(color: gold));
  }
}

class MessageView extends StatelessWidget {
  const MessageView(this.message, {super.key, this.onRetry});
  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(message, textAlign: TextAlign.center),
            if (onRetry != null) ...[
              const SizedBox(height: 12),
              FilledButton(onPressed: onRetry, child: const Text('TRY AGAIN')),
            ],
          ],
        ),
      ),
    );
  }
}
