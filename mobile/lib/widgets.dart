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
const ink = Color(0xFF29064A);
const display = 'Fulham';

const goldColors = [Color(0xFFFFE8AC), Color(0xFFEEC873), Color(0xFFD2A95A), Color(0xFFAC884A)];

/// The website's metallic gold (`--gold-surface`): Beeswax highlight, Muted Gold mid, deeper gold base.
const goldSurface = LinearGradient(
  begin: Alignment.topCenter,
  end: Alignment.bottomCenter,
  colors: [Color(0xFFFFE8AC), Color(0xFFF4DB96), Color(0xFFD2A95A), Color(0xFFAC884A), Color(0xFFD2A95A)],
  stops: [0, 0.28, 0.56, 0.82, 1],
);

/// Medium Violet Red into royal purple, used for primary actions and selected states.
const accentGradient = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [Color(0xFFE02992), Color(0xFFC9177E), Color(0xFF8A1BA6)],
);

/// Jersey collar trim: gold stripe running into the pink edge, as under the website header.
const collarGradient = LinearGradient(colors: [Color(0xFFAC884A), Color(0xFFF4DB96), Color(0xFFD2A95A), pink]);

const headerGradient = LinearGradient(
  begin: Alignment.topCenter,
  end: Alignment.bottomCenter,
  colors: [Color(0xF52B074D), Color(0xEB23053E)],
);

TextStyle displayStyle(double size, {Color? color, double height = 0.95, double spacing = 0.5}) =>
    TextStyle(fontFamily: display, fontSize: size, height: height, letterSpacing: spacing, color: color);

class ClubAtmosphere extends StatelessWidget {
  const ClubAtmosphere({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF3D096D), Color(0xFF390966), Color(0xFF35085E)],
                stops: [0, 0.5, 1],
              ),
            ),
          ),
        ),
        Positioned.fill(child: _Glow(center: const Alignment(1.1, -0.72), radius: 0.95, alpha: 0.4)),
        Positioned.fill(child: _Glow(center: const Alignment(-1.2, 0.25), radius: 0.8, alpha: 0.2)),
        Positioned.fill(child: _Glow(center: const Alignment(0.5, 1.15), radius: 0.9, alpha: 0.22)),
        Positioned.fill(child: child),
      ],
    );
  }
}

class _Glow extends StatelessWidget {
  const _Glow({required this.center, required this.radius, required this.alpha});
  final Alignment center;
  final double radius;
  final double alpha;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: RadialGradient(center: center, radius: radius, colors: [pink.withValues(alpha: alpha), pink.withValues(alpha: 0)]),
        ),
      ),
    );
  }
}

/// Header used on every public screen: glass purple bar, gold display title and the gold-to-pink collar.
class ClubAppBar extends StatelessWidget implements PreferredSizeWidget {
  const ClubAppBar(this.title, {super.key, this.actions, this.tabs});
  final String title;
  final List<Widget>? actions;
  final List<String>? tabs;

  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight + 3 + (tabs == null ? 0 : 46));

  @override
  Widget build(BuildContext context) {
    const collar = SizedBox(height: 3, width: double.infinity, child: DecoratedBox(decoration: BoxDecoration(gradient: collarGradient)));
    final labels = tabs;
    return AppBar(
      titleSpacing: Navigator.canPop(context) ? 0 : 16,
      title: GoldText(title.toUpperCase(), style: displayStyle(22, spacing: 1), maxLines: 1),
      actions: actions,
      flexibleSpace: const DecoratedBox(decoration: BoxDecoration(gradient: headerGradient)),
      bottom: PreferredSize(
        preferredSize: Size.fromHeight(3 + (labels == null ? 0 : 46)),
        child: labels == null
            ? collar
            : Column(
                children: [
                  TabBar(
                    dividerColor: Colors.transparent,
                    indicatorSize: TabBarIndicatorSize.label,
                    indicator: const UnderlineTabIndicator(borderSide: BorderSide(color: pink, width: 3), borderRadius: BorderRadius.vertical(top: Radius.circular(3))),
                    labelColor: goldLight,
                    unselectedLabelColor: const Color(0xFFBDAED0),
                    labelStyle: const TextStyle(fontFamily: display, fontSize: 17, letterSpacing: 1),
                    tabs: [for (final label in labels) Tab(height: 46, text: label.toUpperCase())],
                  ),
                  collar,
                ],
              ),
      ),
    );
  }
}

/// Inner-page hero, as on the website: eyebrow, gold display headline, short intro and the crest watermark.
class PageHero extends StatelessWidget {
  const PageHero({super.key, required this.eyebrow, required this.title, this.intro, this.child});
  final String eyebrow;
  final String title;
  final String? intro;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: RadialGradient(center: const Alignment(0.9, -0.8), radius: 1.1, colors: [const Color(0xFFF4DB96).withValues(alpha: 0.16), pink.withValues(alpha: 0.12), Colors.transparent], stops: const [0, 0.45, 1]),
        border: Border(bottom: BorderSide(color: gold.withValues(alpha: 0.32))),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -8,
            top: 10,
            bottom: 10,
            child: Opacity(opacity: 0.22, child: Image.asset('assets/brand/united-tigers.png', fit: BoxFit.contain)),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 22, 18, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Eyebrow(eyebrow),
                const SizedBox(height: 12),
                GoldText(title.toUpperCase(), style: displayStyle(40, height: 0.92)),
                if (intro != null && intro!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(intro!, style: const TextStyle(color: Color(0xFFE6DDF0), fontSize: 14.5, height: 1.45)),
                ],
                if (child != null) ...[const SizedBox(height: 16), child!],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 7, height: 7, decoration: BoxDecoration(shape: BoxShape.circle, gradient: accentGradient, boxShadow: [BoxShadow(color: pink.withValues(alpha: 0.7), blurRadius: 8)])),
        const SizedBox(width: 8),
        Flexible(child: Text(text.toUpperCase(), style: const TextStyle(color: goldLight, fontSize: 11.5, fontWeight: FontWeight.w800, letterSpacing: 1.6))),
      ],
    );
  }
}

class ClubCard extends StatelessWidget {
  const ClubCard({super.key, required this.child, this.onTap, this.padding = const EdgeInsets.all(16), this.highlight = false});
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsets padding;

  /// Gold-to-pink frame for the card a screen wants to lead with.
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    const radius = 16.0;
    final card = Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(radius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius),
        splashColor: pink.withValues(alpha: 0.18),
        child: Ink(
          width: double.infinity,
          padding: padding,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(highlight ? radius - 1.4 : radius),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xEB33085E), Color(0xEB2A0750), Color(0xEB4B0C66)],
              stops: [0, 0.55, 1],
            ),
            border: highlight ? null : Border.all(color: gold.withValues(alpha: 0.28)),
          ),
          child: child,
        ),
      ),
    );
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        gradient: highlight ? collarGradient : null,
        boxShadow: [BoxShadow(color: const Color(0xFF12021F).withValues(alpha: 0.35), blurRadius: 18, offset: const Offset(0, 8))],
      ),
      child: Padding(padding: EdgeInsets.all(highlight ? 1.4 : 0), child: card),
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
      padding: const EdgeInsets.only(top: 26, bottom: 12),
      child: Row(
        children: [
          Container(width: 4, height: 22, margin: const EdgeInsets.only(right: 10), decoration: BoxDecoration(borderRadius: BorderRadius.circular(2), gradient: const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [goldLight, pink]))),
          Expanded(child: Text(text.toUpperCase(), style: displayStyle(21, color: Colors.white, spacing: 0.8))),
          if (action != null)
            InkWell(
              onTap: onAction,
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), border: Border.all(color: gold.withValues(alpha: 0.55)), color: purple.withValues(alpha: 0.45)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [Text(action!.toUpperCase(), style: const TextStyle(color: goldLight, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8)), const SizedBox(width: 4), const Icon(Icons.arrow_outward, size: 13, color: goldLight)]),
              ),
            ),
        ],
      ),
    );
  }
}

class GoldText extends StatelessWidget {
  const GoldText(this.text, {super.key, required this.style, this.textAlign, this.maxLines});
  final String text;
  final TextStyle style;
  final TextAlign? textAlign;
  final int? maxLines;

  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      blendMode: BlendMode.srcIn,
      shaderCallback: (bounds) => const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: goldColors).createShader(bounds),
      child: Text(text, textAlign: textAlign, maxLines: maxLines, overflow: maxLines == null ? null : TextOverflow.ellipsis, style: style.copyWith(color: Colors.white)),
    );
  }
}

/// Pill tabs used for filters such as stats scope or category; the selected pill carries the accent gradient.
class ClubTabs<T> extends StatelessWidget {
  const ClubTabs({super.key, required this.options, required this.value, required this.onChanged});
  final List<(T, String)> options;
  final T value;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final (key, label) in options)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: InkWell(
                onTap: () => onChanged(key),
                borderRadius: BorderRadius.circular(22),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(22),
                    gradient: key == value ? accentGradient : null,
                    color: key == value ? null : purple.withValues(alpha: 0.55),
                    border: Border.all(color: key == value ? Colors.transparent : gold.withValues(alpha: 0.4)),
                    boxShadow: key == value ? [BoxShadow(color: pink.withValues(alpha: 0.35), blurRadius: 14, offset: const Offset(0, 5))] : null,
                  ),
                  child: Text(label.toUpperCase(), style: TextStyle(color: key == value ? Colors.white : goldLight, fontSize: 11.5, fontWeight: FontWeight.w800, letterSpacing: 0.9)),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Metallic gold call to action with dark ink text, matching the website's primary buttons.
ButtonStyle goldButtonStyle() => FilledButton.styleFrom(
      foregroundColor: ink,
      backgroundColor: Colors.transparent,
      minimumSize: const Size.fromHeight(50),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.9),
    ).copyWith(
      backgroundBuilder: (context, states, child) => DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          gradient: states.contains(WidgetState.disabled) ? null : goldSurface,
          color: states.contains(WidgetState.disabled) ? Colors.white12 : null,
          boxShadow: states.contains(WidgetState.disabled) ? null : [BoxShadow(color: const Color(0xFFEEC873).withValues(alpha: 0.35), blurRadius: 18, offset: const Offset(0, 7))],
        ),
        child: child,
      ),
    );

/// Theme style for every FilledButton: the pink accent gradient with a soft glow.
ButtonStyle accentButtonStyle() => FilledButton.styleFrom(
      foregroundColor: Colors.white,
      backgroundColor: Colors.transparent,
      disabledForegroundColor: Colors.white54,
      minimumSize: const Size.fromHeight(50),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.9),
    ).copyWith(
      backgroundBuilder: (context, states, child) => DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          gradient: states.contains(WidgetState.disabled) ? null : accentGradient,
          color: states.contains(WidgetState.disabled) ? Colors.white12 : null,
          boxShadow: states.contains(WidgetState.disabled) ? null : [BoxShadow(color: pink.withValues(alpha: 0.38), blurRadius: 18, offset: const Offset(0, 7))],
        ),
        child: child,
      ),
    );

class MediaBadge extends StatelessWidget {
  const MediaBadge({super.key, required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 22,
      padding: const EdgeInsets.symmetric(horizontal: 9),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: const Color(0xE62B074D),
        borderRadius: BorderRadius.circular(11),
        border: Border.all(color: gold.withValues(alpha: 0.5)),
      ),
      child: Text(label, style: const TextStyle(color: goldLight, fontSize: 10.5, fontWeight: FontWeight.w800, height: 1, letterSpacing: 0.9)),
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
    final placeholder = Container(
      height: height,
      decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [glow, Color(0xFF5A1170), purple])),
      alignment: Alignment.center,
      child: Opacity(opacity: 0.35, child: Image.asset('assets/brand/tiger-gold.png', height: height * 0.45, fit: BoxFit.contain)),
    );
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: url.isEmpty
          ? placeholder
          : Image.network(
              url,
              height: height,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => placeholder,
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
    final next = label == 'NEXT' || label == 'UPCOMING' || label == 'LIVE' || label == 'OPEN';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        gradient: win ? const LinearGradient(colors: [Color(0xFF2BAA62), Color(0xFF1F8A4C)]) : next ? accentGradient : null,
        color: win || next ? null : glow,
        borderRadius: BorderRadius.circular(10),
        border: win || next ? null : Border.all(color: gold.withValues(alpha: 0.35)),
      ),
      child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.6)),
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
        cursorColor: goldLight,
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Color(0xFFCDBFDD)),
          floatingLabelStyle: const TextStyle(color: goldLight, fontWeight: FontWeight.w700),
          filled: true,
          fillColor: const Color(0x8C2B074D),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: gold.withValues(alpha: 0.3))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: goldLight, width: 1.6)),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
    );
  }
}

Future<void> showClubMessage(BuildContext context, String message) {
  return showDialog(
    context: context,
    builder: (context) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: gold.withValues(alpha: 0.45))),
      title: GoldText('UNITED TIGERS', style: displayStyle(22)),
      content: Text(message),
      actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK', style: TextStyle(color: goldLight, fontWeight: FontWeight.w800)))],
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
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Image.asset('assets/brand/tiger-gold.png', height: 54),
          const SizedBox(height: 14),
          const SizedBox(width: 120, child: LinearProgressIndicator(color: goldLight, backgroundColor: Color(0x33F4DB96), minHeight: 3)),
        ],
      ),
    );
  }
}

/// Friendly empty state in a card, as the website shows when a section has no records yet.
class EmptyPanel extends StatelessWidget {
  const EmptyPanel({super.key, required this.title, this.message, this.action, this.onAction});
  final String title;
  final String? message;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return ClubCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(), style: displayStyle(26, color: Colors.white)),
          if (message != null) ...[const SizedBox(height: 8), Text(message!, style: const TextStyle(color: Color(0xFFD9CCE6)))],
          if (action != null) ...[const SizedBox(height: 16), FilledButton(onPressed: onAction, child: Text(action!.toUpperCase()))],
        ],
      ),
    );
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
            Image.asset('assets/brand/tiger-gold.png', height: 48),
            const SizedBox(height: 14),
            Text(message, textAlign: TextAlign.center),
            if (onRetry != null) ...[
              const SizedBox(height: 14),
              FilledButton(onPressed: onRetry, child: const Text('TRY AGAIN')),
            ],
          ],
        ),
      ),
    );
  }
}

/// Renders the same safe Markdown subset as the website: headings, lists, quotes, images, bold, italic and links.
class ClubMarkdown extends StatelessWidget {
  const ClubMarkdown(this.content, {super.key, this.onLink, this.mediaUrl});
  final String content;

  /// Receives every tapped link; site paths start with `/`.
  final ValueChanged<String>? onLink;

  /// Turns a site path such as `/media/...` into a full image address.
  final String Function(String path)? mediaUrl;

  static final _heading = RegExp(r'^(?:\*\*)?(#{1,6})(?:\s+#{1,6})*\s+(.*?)(?:\*\*)?$');
  static final _bullet = RegExp(r'^[-*]\s+');
  static final _ordered = RegExp(r'^\d+\.\s+');
  static final _image = RegExp(r'^!\[([^\]]*)\]\(([^)]+)\)$');

  bool _blockStart(String line) => _heading.hasMatch(line) || line.startsWith('>') || _bullet.hasMatch(line) || _ordered.hasMatch(line);

  @override
  Widget build(BuildContext context) {
    const body = TextStyle(color: Color(0xFFE9E1F2), fontSize: 15.5, height: 1.6);
    final lines = content.replaceAll('\r', '').split('\n');
    final blocks = <Widget>[];
    var index = 0;
    while (index < lines.length) {
      final line = lines[index].trim();
      if (line.isEmpty) {
        index++;
        continue;
      }
      final image = _image.firstMatch(line);
      if (image != null) {
        final src = image.group(2)!;
        final url = src.startsWith('/') && mediaUrl != null ? mediaUrl!(src) : src;
        blocks.add(Padding(padding: const EdgeInsets.symmetric(vertical: 10), child: RemoteImage(url, height: 200)));
        index++;
        continue;
      }
      final heading = _heading.firstMatch(line);
      if (heading != null) {
        final level = heading.group(1)!.length;
        blocks.add(Padding(
          padding: const EdgeInsets.only(top: 22, bottom: 8),
          child: GoldText(heading.group(2)!.replaceAll(RegExp(r'\s*#+\s*$'), '').toUpperCase(), style: displayStyle(level >= 3 ? 19 : 23, spacing: 0.6)),
        ));
        index++;
        continue;
      }
      if (line.startsWith('>')) {
        blocks.add(Container(
          margin: const EdgeInsets.symmetric(vertical: 10),
          padding: const EdgeInsets.fromLTRB(14, 10, 12, 10),
          decoration: BoxDecoration(border: const Border(left: BorderSide(color: pink, width: 3)), color: purple.withValues(alpha: 0.5), borderRadius: const BorderRadius.horizontal(right: Radius.circular(10))),
          child: _inline(line.replaceFirst(RegExp(r'^>\s?'), ''), body.copyWith(fontStyle: FontStyle.italic)),
        ));
        index++;
        continue;
      }
      final ordered = _ordered.hasMatch(line);
      if (ordered || _bullet.hasMatch(line)) {
        var number = 1;
        while (index < lines.length && (ordered ? _ordered.hasMatch(lines[index].trim()) : _bullet.hasMatch(lines[index].trim()))) {
          final text = lines[index].trim().replaceFirst(ordered ? _ordered : _bullet, '');
          blocks.add(Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 6),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 22,
                  child: ordered
                      ? Text('$number.', style: body.copyWith(color: goldLight, fontWeight: FontWeight.w800))
                      : Padding(padding: const EdgeInsets.only(top: 9), child: Container(width: 6, height: 6, decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFFEEC873)))),
                ),
                Expanded(child: _inline(text, body)),
              ],
            ),
          ));
          number++;
          index++;
        }
        blocks.add(const SizedBox(height: 6));
        continue;
      }
      final paragraph = [line];
      index++;
      while (index < lines.length && lines[index].trim().isNotEmpty && !_blockStart(lines[index].trim())) {
        paragraph.add(lines[index].trim());
        index++;
      }
      blocks.add(Padding(padding: const EdgeInsets.only(bottom: 12), child: _inline(paragraph.join(' '), body)));
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: blocks);
  }

  Widget _inline(String text, TextStyle style) {
    final pattern = RegExp(r'\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`');
    final spans = <InlineSpan>[];
    var cursor = 0;
    for (final match in pattern.allMatches(text)) {
      if (match.start > cursor) spans.add(TextSpan(text: text.substring(cursor, match.start)));
      if (match.group(1) != null) {
        final href = match.group(2)!;
        spans.add(WidgetSpan(
          alignment: PlaceholderAlignment.baseline,
          baseline: TextBaseline.alphabetic,
          child: GestureDetector(
            onTap: () => onLink == null ? openExternal(href) : onLink!(href),
            child: Text(match.group(1)!, style: style.copyWith(color: goldLight, fontWeight: FontWeight.w700, decoration: TextDecoration.underline, decorationColor: goldLight)),
          ),
        ));
      } else if (match.group(3) != null) {
        spans.add(TextSpan(text: match.group(3), style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white)));
      } else if (match.group(4) != null) {
        spans.add(TextSpan(text: match.group(4), style: const TextStyle(fontStyle: FontStyle.italic)));
      } else {
        spans.add(TextSpan(text: match.group(5), style: const TextStyle(fontFamily: 'monospace', color: goldLight)));
      }
      cursor = match.end;
    }
    if (cursor < text.length) spans.add(TextSpan(text: text.substring(cursor)));
    return Text.rich(TextSpan(style: style, children: spans));
  }
}
