import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/motion.dart';
import 'package:url_launcher/url_launcher.dart';

export 'package:united_tigers/motion.dart';

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

/// Keeps sections built well beyond the screen edge, so scrolling back doesn't rebuild heavy cards and images.
const pageCacheExtent = ScrollCacheExtent.pixels(1500);

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

/// Room to leave under a tab page's last item so it can scroll clear of the floating navigation bar.
double navClearance(BuildContext context) => MediaQuery.paddingOf(context).bottom;

TextStyle displayStyle(double size, {Color? color, double height = 0.95, double spacing = 0.5}) =>
    TextStyle(fontFamily: display, fontSize: size, height: height, letterSpacing: spacing, color: color);

/// Type is drawn for a 390×844 phone. Larger screens grow it from both width and height,
/// so an iPad does not keep phone-sized text. Phones stay at 1.
double deviceTextScale(Size size) {
  const phoneWidth = 390.0;
  const phoneHeight = 844.0;
  final scale = math.sqrt((size.width / phoneWidth) * (size.height / phoneHeight));
  return scale.clamp(1.0, 1.5);
}

/// The scale already applied to text, so images and fixed strips use the same size.
double clubScale(BuildContext context) => MediaQuery.textScalerOf(context).scale(1);

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
        const Positioned.fill(child: RepaintBoundary(child: _Aurora())),
        Positioned.fill(child: child),
      ],
    );
  }
}

/// The three pink glows behind every screen, drifting slowly like the website's aurora.
class _Aurora extends StatelessWidget {
  const _Aurora();

  @override
  Widget build(BuildContext context) => IgnorePointer(child: CustomPaint(painter: _AuroraPainter(GlowClock.of(context))));
}

/// Fills only each glow's circle rather than three full-screen gradients.
class _AuroraPainter extends CustomPainter {
  _AuroraPainter(this.clock) : super(repaint: clock);
  final Animation<double> clock;

  @override
  void paint(Canvas canvas, Size size) {
    final a = clock.value * 2 * math.pi;
    final glows = [
      (Alignment(1.1 + 0.12 * math.sin(a), -0.72 + 0.1 * math.cos(a)), 0.95, 0.34 + 0.08 * math.sin(a * 2)),
      (Alignment(-1.2 + 0.15 * math.cos(a), 0.25 + 0.14 * math.sin(a)), 0.8, 0.2),
      (Alignment(0.5 - 0.18 * math.sin(a), 1.15 - 0.08 * math.cos(a)), 0.9, 0.2 + 0.06 * math.cos(a * 2)),
    ];
    for (final (center, radius, alpha) in glows) {
      final origin = center.withinRect(Offset.zero & size);
      final reach = radius * size.shortestSide;
      canvas.drawCircle(origin, reach, Paint()..shader = ui.Gradient.radial(origin, reach, [pink.withValues(alpha: alpha), pink.withValues(alpha: 0)]));
    }
  }

  @override
  bool shouldRepaint(_AuroraPainter oldDelegate) => oldDelegate.clock != clock;
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
            child: Reveal(
              offset: 0,
              dx: 60,
              duration: const Duration(milliseconds: 1100),
              child: Floating(
                distance: 6,
                period: const Duration(milliseconds: 3800),
                child: Image.asset('assets/brand/united-tigers.png', fit: BoxFit.contain, opacity: const AlwaysStoppedAnimation(0.22), cacheHeight: 600),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 22, 18, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Reveal(offset: 0, dx: -20, child: Eyebrow(eyebrow)),
                const SizedBox(height: 12),
                Reveal(delay: const Duration(milliseconds: 90), offset: 30, child: SheenText(title.toUpperCase(), style: displayStyle(40, height: 0.92))),
                if (intro != null && intro!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Reveal(delay: const Duration(milliseconds: 200), child: Text(intro!, style: const TextStyle(color: Color(0xFFE6DDF0), fontSize: 14.5, height: 1.45))),
                ],
                if (child != null) ...[const SizedBox(height: 16), Reveal(delay: const Duration(milliseconds: 300), child: child!)],
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
        Pulse(child: Container(width: 7, height: 7, decoration: const BoxDecoration(shape: BoxShape.circle, gradient: accentGradient))),
        const SizedBox(width: 8),
        Flexible(child: Text(text.toUpperCase(), style: const TextStyle(color: goldLight, fontSize: 11.5, fontWeight: FontWeight.w800, letterSpacing: 1.6))),
      ],
    );
  }
}

/// Every content box in the app: glass purple body, a glowing rim with a light running round it,
/// a rise-in when it scrolls into view and a press-in when tapped.
class ClubCard extends StatefulWidget {
  const ClubCard({super.key, required this.child, this.onTap, this.padding = const EdgeInsets.all(16), this.highlight = false});
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsets padding;

  /// Brighter neon rim for the card a screen wants to lead with.
  final bool highlight;

  @override
  State<ClubCard> createState() => _ClubCardState();
}

class _ClubCardState extends State<ClubCard> {
  static final _seed = math.Random();
  final double _offset = _seed.nextDouble();
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    const radius = 16.0;
    final rim = widget.highlight ? 1.8 : 1.2;
    final card = Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(radius),
      child: InkWell(
        onTap: widget.onTap,
        onHighlightChanged: widget.onTap == null ? null : (value) => setState(() => _down = value),
        borderRadius: BorderRadius.circular(radius),
        splashColor: pink.withValues(alpha: 0.18),
        highlightColor: goldLight.withValues(alpha: 0.05),
        child: Ink(
          width: double.infinity,
          padding: widget.padding,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(radius),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xEB33085E), Color(0xEB2A0750), Color(0xEB4B0C66)],
              stops: [0, 0.55, 1],
            ),
            border: Border.all(color: gold.withValues(alpha: 0.18), width: rim),
          ),
          child: widget.child,
        ),
      ),
    );
    return Reveal(
      offset: 40,
      scale: 0.96,
      fade: false,
      child: AnimatedScale(
        scale: _down ? 0.97 : 1,
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOut,
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(radius),
            boxShadow: widget.highlight ? [BoxShadow(color: pink.withValues(alpha: 0.22), blurRadius: 24, spreadRadius: -6)] : null,
          ),
          child: RepaintBoundary(
            child: CustomPaint(
              foregroundPainter: GlowBorderPainter(
                clock: GlowClock.of(context),
                radius: radius,
                width: rim,
                colors: widget.highlight ? neonGold : softRim,
                offset: _offset,
                bloom: widget.highlight ? 0.6 : 0.35,
                speed: widget.highlight ? 4 : 3,
              ),
              child: RepaintBoundary(child: card),
            ),
          ),
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
    return Reveal(
      offset: 0,
      dx: -26,
      child: Padding(
      padding: const EdgeInsets.only(top: 26, bottom: 12),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 22,
            margin: const EdgeInsets.only(right: 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(2),
              gradient: const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [goldLight, pink]),
              boxShadow: [BoxShadow(color: pink.withValues(alpha: 0.6), blurRadius: 8)],
            ),
          ),
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
    final size = style.fontSize ?? 14;
    final line = size * (style.height ?? 1.2);
    final paint = Paint()..shader = const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: goldColors, tileMode: TileMode.repeated).createShader(Rect.fromLTWH(0, 0, 1, line));
    return Text(
      text,
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: maxLines == null ? null : TextOverflow.ellipsis,
      style: TextStyle(
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        height: style.height,
        letterSpacing: style.letterSpacing,
        shadows: style.shadows,
        foreground: paint,
      ),
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

/// Team badge as on the website's match cards: our gold tiger on a purple disc, rival crests on white.
/// [logo] is a full URL; without one the rival shows its short name on purple.
class TeamCrest extends StatelessWidget {
  const TeamCrest({super.key, this.size = 84, this.ours = false, this.logo, this.label = ''});
  final double size;
  final bool ours;
  final String? logo;
  final String label;

  @override
  Widget build(BuildContext context) {
    final box = size * clubScale(context);
    final initials = Text(label, style: displayStyle(size * 0.28, color: goldLight));
    final onWhite = !ours && logo != null;
    return Container(
      width: box,
      height: box,
      padding: EdgeInsets.all(box * (ours ? 0.19 : 0.13)),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: onWhite
            ? const RadialGradient(center: Alignment(-0.36, -0.44), colors: [Colors.white, Color(0xFFEBE6F2)])
            : const RadialGradient(center: Alignment(-0.36, -0.44), colors: [Color(0xFF8830DB), Color(0xFF460B7D), Color(0xFF310858)], stops: [0, 0.58, 1]),
        border: Border.all(color: gold, width: box > 60 ? 2 : 1.5),
        boxShadow: [BoxShadow(color: pink.withValues(alpha: 0.45), blurRadius: box * 0.28)],
      ),
      child: ours
          ? Image.asset('assets/brand/tiger-gold.png', fit: BoxFit.contain)
          : logo == null
              ? initials
              : Image.network(logo!, fit: BoxFit.contain, errorBuilder: (_, _, _) => initials),
    );
  }
}

/// One-line fixture footer: kick-off day and time, then the host city.
class MatchMeta extends StatelessWidget {
  const MatchMeta({super.key, this.date, this.center = true});
  final DateTime? date;
  final bool center;

  @override
  Widget build(BuildContext context) {
    const style = TextStyle(color: Color(0xFFD3C8E6), fontSize: 13.5);
    return Row(
      mainAxisAlignment: center ? MainAxisAlignment.center : MainAxisAlignment.start,
      children: [
        const FaIcon(FontAwesomeIcons.calendarDays, size: 13, color: gold),
        const SizedBox(width: 6),
        Flexible(child: Text(date == null ? 'Date TBC' : matchWhen(date!), maxLines: 1, overflow: TextOverflow.ellipsis, style: style)),
        const SizedBox(width: 14),
        const FaIcon(FontAwesomeIcons.locationDot, size: 13, color: gold),
        const SizedBox(width: 6),
        const Text('Abu Dhabi', style: style),
      ],
    );
  }
}

class RemoteImage extends StatelessWidget {
  const RemoteImage(this.url, {super.key, this.height = 140, this.radius = 14, this.alignment = Alignment.center});
  final String url;
  final double height;
  final double radius;
  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final wanted = height.isFinite ? height * clubScale(context) : height;
        final resolved = constraints.maxHeight.isFinite ? math.min(wanted, constraints.maxHeight) : wanted;
        final placeholder = Container(
          height: resolved.isFinite ? resolved : null,
          decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [glow, Color(0xFF5A1170), purple])),
          alignment: Alignment.center,
          child: Image.asset('assets/brand/tiger-gold.png', height: (resolved.isFinite ? resolved : 140) * 0.45, fit: BoxFit.contain, opacity: const AlwaysStoppedAnimation(0.35)),
        );
        final ratio = MediaQuery.devicePixelRatioOf(context);
        return ClipRRect(
          borderRadius: BorderRadius.circular(radius),
          child: url.isEmpty
              ? placeholder
              : Image.network(
                  url,
                  height: resolved.isFinite ? resolved : null,
                  width: double.infinity,
                  cacheWidth: (MediaQuery.sizeOf(context).width * ratio).round(),
                  fit: BoxFit.cover,
                  alignment: alignment,
                  errorBuilder: (_, _, _) => placeholder,
                  frameBuilder: (context, child, frame, synchronous) => synchronous
                      ? child
                      : Stack(
                          fit: StackFit.passthrough,
                          children: [
                            if (frame == null) placeholder,
                            AnimatedOpacity(opacity: frame == null ? 0 : 1, duration: const Duration(milliseconds: 420), curve: Curves.easeOut, child: child),
                          ],
                        ),
                ),
        );
      },
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

/// Shimmering page skeleton shown while data loads: a hero block and a stack of card placeholders.
class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.hero = true, this.cards = 5});

  /// Set to false when the page already shows its own hero above the loading area.
  final bool hero;
  final int cards;

  @override
  Widget build(BuildContext context) {
    final skeleton = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (hero)
          const Padding(
            padding: EdgeInsets.fromLTRB(18, 22, 18, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Bone(width: 96, height: 10),
                SizedBox(height: 14),
                Bone(width: 230, height: 30),
                SizedBox(height: 8),
                Bone(width: 160, height: 30),
                SizedBox(height: 16),
                Bone(height: 10),
                SizedBox(height: 7),
                Bone(width: 250, height: 10),
              ],
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
          child: Column(children: [for (var i = 0; i < cards; i++) const _SkeletonCard()]),
        ),
      ],
    );
    return IgnorePointer(
      child: Shimmer(
        child: LayoutBuilder(
          builder: (context, constraints) => constraints.hasBoundedHeight
              ? ClipRect(child: OverflowBox(alignment: Alignment.topCenter, maxHeight: double.infinity, child: skeleton))
              : skeleton,
        ),
      ),
    );
  }
}

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0x8033085E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: gold.withValues(alpha: 0.14)),
      ),
      child: const Row(
        children: [
          Bone(width: 46, height: 46, radius: 23),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                FractionallySizedBox(widthFactor: 0.62, child: Bone(height: 14)),
                SizedBox(height: 8),
                FractionallySizedBox(widthFactor: 0.4, child: Bone(height: 10)),
                SizedBox(height: 8),
                FractionallySizedBox(widthFactor: 0.85, child: Bone(height: 10)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// A placeholder bar for skeleton layouts; place inside a [Shimmer] to animate it.
class Bone extends StatelessWidget {
  const Bone({super.key, this.width, required this.height, this.radius = 6});
  final double? width;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width ?? double.infinity,
      height: height,
      decoration: BoxDecoration(color: const Color(0x2EF4DB96), borderRadius: BorderRadius.circular(radius)),
    );
  }
}

/// Sweeps a soft gold highlight across whatever its child paints.
class Shimmer extends StatefulWidget {
  const Shimmer({super.key, required this.child});
  final Widget child;

  @override
  State<Shimmer> createState() => _ShimmerState();
}

class _ShimmerState extends State<Shimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _sweep = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500))..repeat();

  @override
  void dispose() {
    _sweep.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _sweep,
      child: widget.child,
      builder: (context, child) {
        final x = -3 + 5 * Curves.easeInOut.transform(_sweep.value);
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) => LinearGradient(
            begin: Alignment(x, -0.4),
            end: Alignment(x + 1.6, 0.4),
            colors: const [Color(0x00FFFFFF), Color(0x38FFE7A8), Color(0x00FFFFFF)],
          ).createShader(bounds),
          child: child,
        );
      },
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
            Image.asset('assets/brand/tiger-gold.png', height: 48 * clubScale(context)),
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
