import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:united_tigers/media_viewer.dart';
import 'package:united_tigers/widgets.dart';
import 'package:video_player/video_player.dart';

export 'package:united_tigers/media_viewer.dart';

/// Poster for a clip that has no thumbnail: the frame at 0.1s, as the website's VideoPoster shows.
/// Frames are grabbed one clip at a time and kept as still images, so a grid of videos never
/// holds more than one decoder open.
class VideoThumb extends StatefulWidget {
  const VideoThumb(this.url, {super.key});
  final String url;

  @override
  State<VideoThumb> createState() => _VideoThumbState();
}

class _VideoThumbState extends State<VideoThumb> {
  static final Map<String, ui.Image> _frames = {};
  static Future<void> _queue = Future.value();

  final _boundary = GlobalKey();
  VideoPlayerController? _player;
  ui.Image? _frame;
  bool _disposed = false;

  @override
  void initState() {
    super.initState();
    _frame = _frames[widget.url];
    if (_frame == null) _queue = _queue.then((_) => _grab()).catchError((_) {});
  }

  Future<void> _grab() async {
    if (_disposed || widget.url.isEmpty) return;
    final cached = _frames[widget.url];
    if (cached != null) {
      setState(() => _frame = cached);
      return;
    }
    final player = VideoPlayerController.networkUrl(Uri.parse(widget.url));
    try {
      await player.initialize().timeout(const Duration(seconds: 20));
      await player.setVolume(0);
      await player.seekTo(const Duration(milliseconds: 100));
      if (_disposed) return;
      setState(() => _player = player);
      await Future<void>.delayed(const Duration(milliseconds: 450));
      await WidgetsBinding.instance.endOfFrame;
      if (_disposed) return;
      final boundary = _boundary.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return;
      final image = await boundary.toImage(pixelRatio: 1.5);
      _frames[widget.url] = image;
      if (!_disposed) setState(() => _frame = image);
    } catch (_) {
      // A clip that will not open keeps the branded placeholder.
    } finally {
      if (mounted) setState(() => _player = null);
      await player.dispose();
    }
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final frame = _frame;
    final player = _player;
    if (frame != null) {
      return SizedBox.expand(child: FittedBox(fit: BoxFit.cover, clipBehavior: Clip.hardEdge, child: RawImage(image: frame)));
    }
    return Stack(
      fit: StackFit.expand,
      children: [
        const RemoteImage('', height: double.infinity, radius: 0),
        if (player != null && player.value.isInitialized)
          FittedBox(
            fit: BoxFit.cover,
            clipBehavior: Clip.hardEdge,
            child: RepaintBoundary(
              key: _boundary,
              child: SizedBox(width: player.value.size.width / 4, height: player.value.size.height / 4, child: VideoPlayer(player)),
            ),
          ),
      ],
    );
  }
}

/// Plays a club clip full screen inside the app instead of handing it to the browser.
Future<void> playVideo(BuildContext context, String url, {String? title}) =>
    openMediaViewer(context, [MediaEntry(url: url, isVideo: true, title: title ?? '')]);
