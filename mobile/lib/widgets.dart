import 'package:flutter/material.dart';
import 'package:united_tigers/api.dart';

const night = Color(0xFF0B0016);
const purple = Color(0xFF21003E);
const glow = Color(0xFF4D087F);
const gold = Color(0xFFE8B53A);
const orange = Color(0xFFFF6A14);

class ClubCard extends StatelessWidget {
  const ClubCard({super.key, required this.child, this.onTap});
  final Widget child;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xCC110014),
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), border: Border.all(color: Colors.white12)),
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
          Expanded(child: Text(text, style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.6))),
          if (action != null) TextButton(onPressed: onAction, child: Text(action!)),
        ],
      ),
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
          : Image.network(url, height: height, width: double.infinity, fit: BoxFit.cover, errorBuilder: (_, _, _) => Container(height: height, color: glow)),
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
      decoration: BoxDecoration(color: win ? const Color(0xFF1F8A4C) : next ? orange : glow, borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800)),
    );
  }
}

class ClubField extends StatelessWidget {
  const ClubField({super.key, required this.label, required this.controller, this.email = false, this.phone = false, this.lines = 1});
  final String label;
  final TextEditingController controller;
  final bool email;
  final bool phone;
  final int lines;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        keyboardType: email ? TextInputType.emailAddress : phone ? TextInputType.phone : lines > 1 ? TextInputType.multiline : TextInputType.text,
        minLines: lines,
        maxLines: lines,
        decoration: InputDecoration(labelText: label, filled: true, fillColor: Colors.white10, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
      ),
    );
  }
}

Future<void> showClubMessage(BuildContext context, String message) {
  return showDialog(context: context, builder: (context) => AlertDialog(title: const Text('United Tigers'), content: Text(message), actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK'))]));
}

String scoreLine(Map<String, dynamic> match) {
  final innings = asList(match['innings']);
  if (innings.isEmpty) return match['result']?.toString() ?? match['competition']?.toString() ?? 'Abu Dhabi T10';
  return innings.map((item) => '${item['runs']}/${item['wickets']} (${item['overs']})').join(' – ');
}
