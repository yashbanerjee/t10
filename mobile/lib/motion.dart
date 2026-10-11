import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:united_tigers/widgets.dart';

const neonGold = [Color(0xFFFED57A), Color(0xFFFB3BA6), Color(0xFF9B5CFF), Color(0xFF3FD8FF), Color(0xFFFED57A)];
const neonPink = [Color(0xFFFB3BA6), Color(0xFF2A074B), Color(0xFF9B5CFF), Color(0xFF2A074B), Color(0xFFFB3BA6)];

/// Quiet running light for everyday cards: a gold spark and a pink spark chasing round a dim rim.
const softRim = [Color(0xFFF4DB96), Color(0x55D2A95A), Color(0x33C9177E), Color(0xFFFB3BA6), Color(0x339B5CFF), Color(0x55D2A95A), Color(0xFFF4DB96)];

/// One shared clock for every looping effect, so dozens of glowing cards cost a single ticker.
/// A full cycle is 24 seconds; effects take faster multiples of it.
class GlowClock extends StatefulWidget {
  const GlowClock({super.key, required this.child});
  final Widget child;

  static const cycle = Duration(seconds: 24);

  static Animation<double> of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<_GlowClockScope>()?.clock ?? kAlwaysCompleteAnimation;

  @override
  State<GlowClock> createState() => _GlowClockState();
}

class _GlowClockState extends State<GlowClock> with SingleTickerProviderStateMixin {
  late final AnimationController _clock = AnimationController(vsync: this, duration: GlowClock.cycle)..repeat();

  @override
  void dispose() {
    _clock.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => _GlowClockScope(clock: _clock, child: widget.child);
}

class _GlowClockScope extends InheritedWidget {
  const _GlowClockScope({required this.clock, required super.child});
  final Animation<double> clock;

  @override
  bool updateShouldNotify(_GlowClockScope oldWidget) => clock != oldWidget.clock;
}

/// Paints a rotating sweep-gradient rim with a soft bloom, driven by [GlowClock].
class GlowBorderPainter extends CustomPainter {
  GlowBorderPainter({required this.clock, required this.radius, required this.width, required this.colors, this.offset = 0, this.bloom = 0.55, this.speed = 4})
      : super(repaint: clock);

  final Animation<double> clock;
  final double radius;
  final double width;
  final List<Color> colors;
  final double offset;
  final double bloom;

  /// Turns per [GlowClock.cycle].
  final double speed;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final rrect = RRect.fromRectAndRadius(rect.deflate(width / 2), Radius.circular(math.max(0, radius - width / 2)));
    final turn = (clock.value * speed + offset) % 1;
    final shader = SweepGradient(colors: colors, transform: GradientRotation(turn * 2 * math.pi)).createShader(rect);
    if (bloom > 0) {
      canvas.drawRRect(
        rrect,
        Paint()
          ..shader = shader
          ..style = PaintingStyle.stroke
          ..strokeWidth = width + 3
          ..color = Colors.white.withValues(alpha: bloom)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 7),
      );
    }
    canvas.drawRRect(
      rrect,
      Paint()
        ..shader = shader
        ..style = PaintingStyle.stroke
        ..strokeWidth = width,
    );
  }

  @override
  bool shouldRepaint(GlowBorderPainter oldDelegate) =>
      oldDelegate.radius != radius || oldDelegate.width != width || oldDelegate.colors != colors || oldDelegate.offset != offset || oldDelegate.bloom != bloom;
}

/// A border with a light running round it, like the website's dashboard cards.
class GlowFrame extends StatelessWidget {
  const GlowFrame({super.key, required this.child, this.radius = 18, this.width = 2, this.colors = neonGold, this.offset = 0, this.bloom = 0.7});

  final Widget child;
  final double radius;
  final double width;
  final List<Color> colors;
  final double bloom;

  /// Starting angle as a fraction of a full turn, so neighbouring frames don't spin in step.
  final double offset;

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: CustomPaint(
        foregroundPainter: GlowBorderPainter(clock: GlowClock.of(context), radius: radius, width: width, colors: colors, offset: offset, bloom: bloom),
        child: Padding(
          padding: EdgeInsets.all(width),
          child: ClipRRect(borderRadius: BorderRadius.circular(math.max(0, radius - width)), child: RepaintBoundary(child: child)),
        ),
      ),
    );
  }
}

/// Fades and lifts (or slides) its child into place once, after an optional stagger delay.
class Reveal extends StatefulWidget {
  const Reveal({super.key, required this.child, this.delay = Duration.zero, this.offset = 24, this.dx = 0, this.scale = 1, this.duration = const Duration(milliseconds: 650)});
  final Widget child;
  final Duration delay;
  final double offset;
  final double dx;
  final Duration duration;

  /// Starting scale; values below 1 give a pop-in.
  final double scale;

  @override
  State<Reveal> createState() => _RevealState();
}

class _RevealState extends State<Reveal> with SingleTickerProviderStateMixin {
  late final AnimationController _in = AnimationController(vsync: this, duration: widget.duration);
  late final CurvedAnimation _ease = CurvedAnimation(parent: _in, curve: Curves.easeOutCubic);
  late final CurvedAnimation _pop = CurvedAnimation(parent: _in, curve: Curves.easeOutBack);

  @override
  void initState() {
    super.initState();
    if (widget.delay == Duration.zero) {
      _in.forward();
    } else {
      Future.delayed(widget.delay, () {
        if (mounted) _in.forward();
      });
    }
  }

  @override
  void dispose() {
    _ease.dispose();
    _pop.dispose();
    _in.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _in,
      child: widget.child,
      builder: (context, child) {
        if (_in.isCompleted) return child!;
        final t = _ease.value;
        return Opacity(
          opacity: t,
          child: Transform.translate(
            offset: Offset(widget.dx * (1 - t), widget.offset * (1 - t)),
            child: widget.scale == 1 ? child : Transform.scale(scale: widget.scale + (1 - widget.scale) * _pop.value, alignment: Alignment.bottomCenter, child: child),
          ),
        );
      },
    );
  }
}

/// Endless gentle up-and-down drift.
class Floating extends StatefulWidget {
  const Floating({super.key, required this.child, this.distance = 4, this.period = const Duration(milliseconds: 2600), this.phase = 0});
  final Widget child;
  final double distance;
  final Duration period;
  final double phase;

  @override
  State<Floating> createState() => _FloatingState();
}

class _FloatingState extends State<Floating> with SingleTickerProviderStateMixin {
  late final AnimationController _bob = AnimationController(vsync: this, duration: widget.period, value: widget.phase)..repeat(reverse: true);

  @override
  void dispose() {
    _bob.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _bob,
      child: widget.child,
      builder: (context, child) => Transform.translate(offset: Offset(0, -widget.distance * Curves.easeInOut.transform(_bob.value)), child: child),
    );
  }
}

/// Shrinks slightly while pressed, for tappable cards.
class Pressable extends StatefulWidget {
  const Pressable({super.key, required this.child, required this.onTap});
  final Widget child;
  final VoidCallback onTap;

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _down = true),
      onTapCancel: () => setState(() => _down = false),
      onTapUp: (_) => setState(() => _down = false),
      onTap: widget.onTap,
      child: AnimatedScale(scale: _down ? 0.95 : 1, duration: const Duration(milliseconds: 140), curve: Curves.easeOut, child: widget.child),
    );
  }
}

/// Gold display text with a bright sheen sweeping across it every few seconds.
class SheenText extends StatelessWidget {
  const SheenText(this.text, {super.key, required this.style, this.maxLines});
  final String text;
  final TextStyle style;
  final int? maxLines;

  @override
  Widget build(BuildContext context) {
    final clock = GlowClock.of(context);
    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: clock,
        child: Text(text, maxLines: maxLines, overflow: maxLines == null ? null : TextOverflow.ellipsis, style: style.copyWith(color: Colors.white)),
        builder: (context, child) {
          final sweep = (clock.value * 4) % 1 * 2.4 - 0.7;
          return ShaderMask(
            blendMode: BlendMode.srcIn,
            shaderCallback: (bounds) => LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: const [Color(0xFFFFE8AC), Color(0xFFD2A95A), Color(0xFFFFFBEA), Color(0xFFD2A95A), Color(0xFFAC884A)],
              stops: [0, (sweep - 0.12).clamp(0, 1), sweep.clamp(0, 1), (sweep + 0.12).clamp(0, 1), 1],
            ).createShader(bounds),
            child: child,
          );
        },
      ),
    );
  }
}

/// Counts a figure such as "125", "4.25" or "100%" up from zero; text that isn't a number shows as is.
class CountUp extends StatelessWidget {
  const CountUp(this.value, {super.key, required this.builder});
  final String value;
  final Widget Function(String text) builder;

  static final _number = RegExp(r'^(\d+)(\.\d+)?(.*)$');

  @override
  Widget build(BuildContext context) {
    final match = _number.firstMatch(value.trim());
    if (match == null) return builder(value);
    final fraction = match.group(2);
    final decimals = fraction == null ? 0 : fraction.length - 1;
    final target = double.parse('${match.group(1)}${fraction ?? ''}');
    final suffix = match.group(3) ?? '';
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: target),
      duration: const Duration(milliseconds: 1200),
      curve: Curves.easeOutCubic,
      builder: (context, current, _) => builder('${current.toStringAsFixed(decimals)}$suffix'),
    );
  }
}

/// Soft breathing glow, used for live dots and accent marks.
class Pulse extends StatelessWidget {
  const Pulse({super.key, required this.child, this.color = const Color(0xFFFB3BA6), this.speed = 12});
  final Widget child;
  final Color color;
  final double speed;

  @override
  Widget build(BuildContext context) {
    final clock = GlowClock.of(context);
    return AnimatedBuilder(
      animation: clock,
      child: child,
      builder: (context, child) {
        final wave = 0.5 + 0.5 * math.sin(clock.value * speed * 2 * math.pi);
        return DecoratedBox(
          decoration: BoxDecoration(shape: BoxShape.circle, boxShadow: [BoxShadow(color: color.withValues(alpha: 0.25 + 0.55 * wave), blurRadius: 6 + 10 * wave, spreadRadius: wave * 2)]),
          child: child,
        );
      },
    );
  }
}

/// Fade-and-rise route transition used for every pushed screen.
class ClubPageTransitions extends PageTransitionsBuilder {
  const ClubPageTransitions();

  @override
  Widget buildTransitions<T>(PageRoute<T> route, BuildContext context, Animation<double> animation, Animation<double> secondaryAnimation, Widget child) {
    final enter = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic, reverseCurve: Curves.easeInCubic);
    final leave = CurvedAnimation(parent: secondaryAnimation, curve: Curves.easeOutCubic);
    return FadeTransition(
      opacity: Tween<double>(begin: 1, end: 0.6).animate(leave),
      child: FadeTransition(
        opacity: enter,
        child: SlideTransition(
          position: Tween(begin: const Offset(0, 0.06), end: Offset.zero).animate(enter),
          child: ScaleTransition(scale: Tween<double>(begin: 1, end: 0.96).animate(leave), child: ClubAtmosphere(child: child)),
        ),
      ),
    );
  }
}
