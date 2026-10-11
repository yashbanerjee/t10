import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/widgets.dart';
import 'package:video_player/video_player.dart';

/// One photo or clip in the full-screen viewer. [url] is already resolved against the media host.
class MediaEntry {
  const MediaEntry({required this.url, required this.isVideo, this.title = ''});
  final String url;
  final bool isVideo;
  final String title;
}

/// Opens [items] in the viewer at the tapped one; [media] resolves upload paths against the media host.
Future<void> openGallery(BuildContext context, List<GalleryItem> items, GalleryItem tapped, String Function(String? path) media) {
  final entries = [for (final item in items) MediaEntry(url: media(item.mediaUrl), isVideo: item.isVideo, title: item.title)];
  return openMediaViewer(context, entries, initial: items.indexOf(tapped));
}

/// Opens photos and clips full screen: pinch or double-tap to zoom photos, a full player for clips,
/// and a swipe between every item of the collection the fan tapped in.
Future<void> openMediaViewer(BuildContext context, List<MediaEntry> entries, {int initial = 0}) {
  if (entries.isEmpty) return Future.value();
  return Navigator.of(context).push(
    PageRouteBuilder(
      opaque: true,
      transitionDuration: const Duration(milliseconds: 260),
      reverseTransitionDuration: const Duration(milliseconds: 220),
      pageBuilder: (_, _, _) => _MediaViewer(entries: entries, initial: initial.clamp(0, entries.length - 1)),
      transitionsBuilder: (_, animation, _, child) => FadeTransition(
        opacity: animation,
        child: ScaleTransition(scale: Tween(begin: 0.96, end: 1.0).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)), child: child),
      ),
    ),
  );
}

class _MediaViewer extends StatefulWidget {
  const _MediaViewer({required this.entries, required this.initial});
  final List<MediaEntry> entries;
  final int initial;

  @override
  State<_MediaViewer> createState() => _MediaViewerState();
}

class _MediaViewerState extends State<_MediaViewer> {
  late final PageController _pages = PageController(initialPage: widget.initial);
  late int _index = widget.initial;
  bool _zoomed = false;
  bool _chrome = true;
  bool _fullscreen = false;

  @override
  void dispose() {
    _pages.dispose();
    _restoreSystem();
    super.dispose();
  }

  static void _restoreSystem() {
    SystemChrome.setPreferredOrientations(const [DeviceOrientation.portraitUp]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }

  Future<void> _setFullscreen(bool value) async {
    setState(() => _fullscreen = value);
    if (value) {
      await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
      await SystemChrome.setPreferredOrientations(const [DeviceOrientation.landscapeLeft, DeviceOrientation.landscapeRight]);
    } else {
      _restoreSystem();
    }
  }

  @override
  Widget build(BuildContext context) {
    final entries = widget.entries;
    final current = entries[_index];
    return PopScope(
      canPop: !_fullscreen,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && _fullscreen) _setFullscreen(false);
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          children: [
            PageView.builder(
              controller: _pages,
              physics: _zoomed || _fullscreen ? const NeverScrollableScrollPhysics() : const PageScrollPhysics(),
              itemCount: entries.length,
              onPageChanged: (index) => setState(() {
                _index = index;
                _zoomed = false;
                _chrome = true;
              }),
              itemBuilder: (context, index) {
                final entry = entries[index];
                return entry.isVideo
                    ? ClubVideoPlayer(
                        url: entry.url,
                        active: index == _index,
                        fullscreen: _fullscreen,
                        onFullscreen: _setFullscreen,
                        onControls: (visible) {
                          if (index == _index && visible != _chrome) setState(() => _chrome = visible);
                        },
                      )
                    : _PhotoPage(
                        url: entry.url,
                        onZoom: (zoomed) {
                          if (zoomed != _zoomed) setState(() => _zoomed = zoomed);
                        },
                        onTap: () => setState(() => _chrome = !_chrome),
                      );
              },
            ),
            if (!_fullscreen)
              Positioned(
                left: 0,
                right: 0,
                top: 0,
                child: IgnorePointer(
                  ignoring: !_chrome,
                  child: AnimatedOpacity(
                    opacity: _chrome ? 1 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: DecoratedBox(
                      decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xCC000000), Color(0x00000000)])),
                      child: SafeArea(
                        bottom: false,
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(4, 4, 12, 18),
                          child: Row(
                            children: [
                              IconButton(onPressed: () => Navigator.maybePop(context), icon: const Icon(Icons.close_rounded, color: Colors.white, size: 26), tooltip: 'Close'),
                              Expanded(child: Text(current.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w800))),
                              if (entries.length > 1)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
                                  child: Text('${_index + 1} / ${entries.length}', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800)),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _PhotoPage extends StatefulWidget {
  const _PhotoPage({required this.url, required this.onZoom, required this.onTap});
  final String url;
  final ValueChanged<bool> onZoom;
  final VoidCallback onTap;

  @override
  State<_PhotoPage> createState() => _PhotoPageState();
}

class _PhotoPageState extends State<_PhotoPage> with SingleTickerProviderStateMixin {
  final _view = TransformationController();
  late final AnimationController _zoom = AnimationController(vsync: this, duration: const Duration(milliseconds: 240));
  Animation<Matrix4>? _tween;
  Offset _tap = Offset.zero;
  bool _zoomed = false;

  @override
  void initState() {
    super.initState();
    _view.addListener(_changed);
    _zoom.addListener(() {
      final tween = _tween;
      if (tween != null) _view.value = tween.value;
    });
  }

  void _changed() {
    final zoomed = _view.value.getMaxScaleOnAxis() > 1.01;
    if (zoomed != _zoomed) {
      _zoomed = zoomed;
      widget.onZoom(zoomed);
    }
  }

  void _toggleZoom() {
    const scale = 2.5;
    final target = _zoomed
        ? Matrix4.identity()
        : (Matrix4.identity()
          ..translateByDouble(-_tap.dx * (scale - 1), -_tap.dy * (scale - 1), 0, 1)
          ..scaleByDouble(scale, scale, 1, 1));
    _tween = Matrix4Tween(begin: _view.value, end: target).animate(CurvedAnimation(parent: _zoom, curve: Curves.easeOutCubic));
    _zoom.forward(from: 0);
  }

  @override
  void dispose() {
    _view.dispose();
    _zoom.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      onDoubleTapDown: (details) => _tap = details.localPosition,
      onDoubleTap: _toggleZoom,
      child: InteractiveViewer(
        transformationController: _view,
        minScale: 1,
        maxScale: 5,
        panEnabled: _zoomed,
        clipBehavior: Clip.none,
        child: SizedBox.expand(
          child: Image.network(
            widget.url,
            fit: BoxFit.contain,
            loadingBuilder: (context, child, progress) {
              if (progress == null) return child;
              final total = progress.expectedTotalBytes;
              return Center(child: CircularProgressIndicator(color: goldLight, value: total == null ? null : progress.cumulativeBytesLoaded / total));
            },
            errorBuilder: (_, _, _) => const Center(child: Text('This photo could not be loaded.', style: TextStyle(color: Colors.white70))),
          ),
        ),
      ),
    );
  }
}

String _clock(Duration value) {
  final hours = value.inHours;
  final minutes = value.inMinutes.remainder(60).toString().padLeft(hours > 0 ? 2 : 1, '0');
  final seconds = value.inSeconds.remainder(60).toString().padLeft(2, '0');
  return hours > 0 ? '$hours:$minutes:$seconds' : '$minutes:$seconds';
}

/// Full video player: play/pause, ±10s skip and double-tap seek, scrubbing with buffer progress,
/// elapsed/total time, mute, playback speed, loop, landscape full screen and auto-hiding controls.
class ClubVideoPlayer extends StatefulWidget {
  const ClubVideoPlayer({super.key, required this.url, this.active = true, this.fullscreen = false, this.onFullscreen, this.onControls});
  final String url;
  final bool active;
  final bool fullscreen;
  final ValueChanged<bool>? onFullscreen;
  final ValueChanged<bool>? onControls;

  @override
  State<ClubVideoPlayer> createState() => _ClubVideoPlayerState();
}

class _ClubVideoPlayerState extends State<ClubVideoPlayer> {
  static const _speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  static const _skip = Duration(seconds: 10);

  late VideoPlayerController _player;
  String? _error;
  bool _controls = true;
  bool _muted = false;
  double? _scrub;
  Timer? _hide;
  int _flash = 0;
  Timer? _flashTimer;

  @override
  void initState() {
    super.initState();
    _open();
  }

  void _open() {
    _error = null;
    _player = VideoPlayerController.networkUrl(Uri.parse(widget.url))..addListener(_changed);
    _player.initialize().then((_) {
      if (!mounted) return;
      setState(() {});
      if (widget.active) _play();
    }).catchError((Object _) {
      if (mounted) setState(() => _error = 'This video could not be played.');
    });
  }

  void _changed() {
    if (mounted) setState(() {});
  }

  @override
  void didUpdateWidget(ClubVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.active != widget.active && _player.value.isInitialized) {
      widget.active ? _play() : _player.pause();
    }
  }

  @override
  void dispose() {
    _hide?.cancel();
    _flashTimer?.cancel();
    _player.removeListener(_changed);
    _player.dispose();
    super.dispose();
  }

  bool get _ended {
    final value = _player.value;
    return value.isInitialized && !value.isPlaying && !value.isLooping && value.duration > Duration.zero && value.position >= value.duration - const Duration(milliseconds: 300);
  }

  void _play() {
    if (_ended) _player.seekTo(Duration.zero);
    _player.play();
    _showControls();
  }

  void _togglePlay() {
    _player.value.isPlaying ? _player.pause() : _play();
    _showControls();
  }

  void _setControls(bool visible) {
    setState(() => _controls = visible);
    widget.onControls?.call(visible);
  }

  void _showControls() {
    _hide?.cancel();
    if (!_controls) _setControls(true);
    _hide = Timer(const Duration(seconds: 3), () {
      if (mounted && _player.value.isPlaying && _scrub == null) _setControls(false);
    });
  }

  void _seekBy(Duration delta) {
    final value = _player.value;
    var target = value.position + delta;
    if (target < Duration.zero) target = Duration.zero;
    if (target > value.duration) target = value.duration;
    _player.seekTo(target);
    _flashTimer?.cancel();
    setState(() => _flash = delta.isNegative ? -1 : 1);
    _flashTimer = Timer(const Duration(milliseconds: 650), () {
      if (mounted) setState(() => _flash = 0);
    });
    _showControls();
  }

  void _toggleMute() {
    setState(() => _muted = !_muted);
    _player.setVolume(_muted ? 0 : 1);
    _showControls();
  }

  void _retry() {
    _player.removeListener(_changed);
    _player.dispose();
    setState(_open);
  }

  Duration get _buffered {
    var end = Duration.zero;
    for (final range in _player.value.buffered) {
      if (range.end > end) end = range.end;
    }
    return end;
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const FaIcon(FontAwesomeIcons.triangleExclamation, color: goldLight, size: 30),
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 12),
            OutlinedButton.icon(onPressed: _retry, icon: const FaIcon(FontAwesomeIcons.rotateRight, size: 14), label: const Text('TRY AGAIN')),
          ],
        ),
      );
    }
    final value = _player.value;
    if (!value.isInitialized) return const Center(child: CircularProgressIndicator(color: goldLight));

    final total = value.duration;
    final totalMs = total.inMilliseconds <= 0 ? 1.0 : total.inMilliseconds.toDouble();
    final position = _scrub ?? value.position.inMilliseconds.clamp(0, totalMs).toDouble();
    final width = MediaQuery.sizeOf(context).width;

    return Stack(
      fit: StackFit.expand,
      children: [
        Center(child: AspectRatio(aspectRatio: value.aspectRatio, child: VideoPlayer(_player))),
        GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => _controls ? _setControls(false) : _showControls(),
          onDoubleTapDown: (details) => _seekBy(details.localPosition.dx < width / 2 ? -_skip : _skip),
          onDoubleTap: () {},
        ),
        if (value.isBuffering && value.isPlaying) const Center(child: CircularProgressIndicator(color: goldLight)),
        if (_flash != 0)
          Align(
            alignment: Alignment(_flash < 0 ? -0.6 : 0.6, 0),
            child: IgnorePointer(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.55), borderRadius: BorderRadius.circular(24)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    FaIcon(_flash < 0 ? FontAwesomeIcons.backward : FontAwesomeIcons.forward, color: Colors.white, size: 14),
                    const SizedBox(width: 8),
                    Text(_flash < 0 ? '-10s' : '+10s', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
            ),
          ),
        IgnorePointer(
          ignoring: !_controls,
          child: AnimatedOpacity(
            opacity: _controls ? 1 : 0,
            duration: const Duration(milliseconds: 220),
            child: Stack(
              fit: StackFit.expand,
              children: [
                const IgnorePointer(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0x66000000), Color(0x00000000), Color(0x00000000), Color(0xCC000000)],
                        stops: [0, 0.25, 0.6, 1],
                      ),
                    ),
                  ),
                ),
                Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _RoundButton(icon: Icons.replay_10_rounded, size: 50, onTap: () => _seekBy(-_skip), tooltip: 'Back 10 seconds'),
                      const SizedBox(width: 28),
                      _RoundButton(
                        icon: _ended ? Icons.replay_rounded : (value.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded),
                        size: 72,
                        gold: true,
                        onTap: _togglePlay,
                        tooltip: value.isPlaying ? 'Pause' : 'Play',
                      ),
                      const SizedBox(width: 28),
                      _RoundButton(icon: Icons.forward_10_rounded, size: 50, onTap: () => _seekBy(_skip), tooltip: 'Forward 10 seconds'),
                    ],
                  ),
                ),
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: SafeArea(
                    top: false,
                    minimum: const EdgeInsets.fromLTRB(12, 0, 12, 8),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Text(_clock(Duration(milliseconds: position.round())), style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700, fontFeatures: [FontFeature.tabularFigures()])),
                            Expanded(
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 24),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(2),
                                      child: LinearProgressIndicator(
                                        value: (_buffered.inMilliseconds / totalMs).clamp(0.0, 1.0),
                                        minHeight: 3,
                                        backgroundColor: Colors.white.withValues(alpha: 0.18),
                                        valueColor: AlwaysStoppedAnimation(Colors.white.withValues(alpha: 0.38)),
                                      ),
                                    ),
                                  ),
                                  SliderTheme(
                                    data: SliderTheme.of(context).copyWith(
                                      trackHeight: 3,
                                      activeTrackColor: pink,
                                      inactiveTrackColor: Colors.transparent,
                                      thumbColor: goldLight,
                                      overlayColor: goldLight.withValues(alpha: 0.2),
                                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
                                    ),
                                    child: Slider(
                                      value: position.clamp(0, totalMs),
                                      max: totalMs,
                                      onChangeStart: (v) {
                                        _hide?.cancel();
                                        setState(() => _scrub = v);
                                      },
                                      onChanged: (v) => setState(() => _scrub = v),
                                      onChangeEnd: (v) async {
                                        await _player.seekTo(Duration(milliseconds: v.round()));
                                        if (mounted) setState(() => _scrub = null);
                                        _showControls();
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Text(_clock(total), style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700, fontFeatures: [FontFeature.tabularFigures()])),
                          ],
                        ),
                        Row(
                          children: [
                            _BarButton(icon: _muted ? Icons.volume_off_rounded : Icons.volume_up_rounded, tooltip: _muted ? 'Unmute' : 'Mute', onTap: _toggleMute),
                            _BarButton(
                              icon: Icons.repeat_rounded,
                              tooltip: value.isLooping ? 'Loop on' : 'Loop off',
                              active: value.isLooping,
                              onTap: () {
                                _player.setLooping(!value.isLooping);
                                _showControls();
                              },
                            ),
                            const Spacer(),
                            PopupMenuButton<double>(
                              tooltip: 'Playback speed',
                              color: const Color(0xFF241038),
                              initialValue: value.playbackSpeed,
                              onOpened: () => _hide?.cancel(),
                              onSelected: (speed) {
                                _player.setPlaybackSpeed(speed);
                                _showControls();
                              },
                              itemBuilder: (_) => [
                                for (final speed in _speeds)
                                  PopupMenuItem(value: speed, child: Text(speed == 1 ? 'Normal' : '${speed}x', style: TextStyle(color: speed == value.playbackSpeed ? goldLight : Colors.white, fontWeight: FontWeight.w700))),
                              ],
                              child: Container(
                                margin: const EdgeInsets.symmetric(horizontal: 4),
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(border: Border.all(color: Colors.white.withValues(alpha: 0.5)), borderRadius: BorderRadius.circular(14)),
                                child: Text('${value.playbackSpeed == value.playbackSpeed.roundToDouble() ? value.playbackSpeed.toInt() : value.playbackSpeed}x', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800)),
                              ),
                            ),
                            if (widget.onFullscreen != null)
                              _BarButton(
                                icon: widget.fullscreen ? Icons.fullscreen_exit_rounded : Icons.fullscreen_rounded,
                                tooltip: widget.fullscreen ? 'Exit full screen' : 'Full screen',
                                onTap: () {
                                  widget.onFullscreen!(!widget.fullscreen);
                                  _showControls();
                                },
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _RoundButton extends StatelessWidget {
  const _RoundButton({required this.icon, required this.size, required this.onTap, required this.tooltip, this.gold = false});
  final IconData icon;
  final double size;
  final VoidCallback onTap;
  final String tooltip;
  final bool gold;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        shape: const CircleBorder(),
        color: gold ? null : Colors.black.withValues(alpha: 0.45),
        clipBehavior: Clip.antiAlias,
        child: Ink(
          decoration: gold ? const BoxDecoration(shape: BoxShape.circle, gradient: goldSurface) : null,
          child: InkWell(
            onTap: onTap,
            child: SizedBox.square(dimension: size, child: Icon(icon, size: size * 0.56, color: gold ? ink : Colors.white)),
          ),
        ),
      ),
    );
  }
}

class _BarButton extends StatelessWidget {
  const _BarButton({required this.icon, required this.tooltip, required this.onTap, this.active = false});
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return IconButton(onPressed: onTap, tooltip: tooltip, icon: Icon(icon, color: active ? goldLight : Colors.white, size: 24));
  }
}
