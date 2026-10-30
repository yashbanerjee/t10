import 'dart:async';
import 'dart:io';

import 'package:audio_session/audio_session.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:united_tigers/models.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/services/file_download.dart';
import 'package:united_tigers/widgets.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';

/// Homepage theme song: play audio/video in-app, open YouTube externally, download hosted files to Downloads.
class ThemeSongCard extends StatefulWidget {
  const ThemeSongCard({super.key, required this.song});

  final ThemeSong song;

  @override
  State<ThemeSongCard> createState() => _ThemeSongCardState();
}

class _ThemeSongCardState extends State<ThemeSongCard> {
  AudioPlayer? _audio;
  VideoPlayerController? _video;
  StreamSubscription<PlayerState>? _audioState;
  bool _started = false;
  bool _ready = false;
  bool _loadingAudio = false;
  bool _failed = false;
  bool _downloading = false;
  String? _error;

  ThemeSong get song => widget.song;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (!song.isYoutube) {
      // Inherited widgets are not safe in initState; wait one frame then open.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _open();
      });
    }
  }

  @override
  void didUpdateWidget(covariant ThemeSongCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.song.source != song.source || oldWidget.song.kind != song.kind) {
      _disposePlayers();
      _ready = false;
      _failed = false;
      _error = null;
      _loadingAudio = false;
      if (!song.isYoutube) _open();
    }
  }

  Future<void> _open() async {
    final api = ClubScope.of(context).api;
    final url = api.media(song.source);
    if (url.isEmpty) {
      setState(() {
        _failed = true;
        _error = 'This theme song could not be loaded right now.';
      });
      return;
    }

    if (song.isAudio) {
      await _openAudio(url);
    } else {
      await _openVideo(url);
    }
  }

  Future<void> _prepareSession() async {
    final session = await AudioSession.instance;
    await session.configure(const AudioSessionConfiguration.music());
  }

  /// Large remote WAVs hang AVPlayer on iOS. Cache locally, then play from disk.
  Future<File> _cachedAudioFile(String url) async {
    final dir = await getTemporaryDirectory();
    final name = song.saveAs.toLowerCase().endsWith('.wav') || song.saveAs.contains('.')
        ? song.saveAs.replaceAll(RegExp(r'[\\/:*?"<>|]+'), '_')
        : '${song.saveAs.replaceAll(RegExp(r'[\\/:*?"<>|]+'), '_')}.wav';
    final file = File(p.join(dir.path, 'theme-song-$name'));

    int? expected;
    try {
      final head = await http.head(Uri.parse(url)).timeout(const Duration(seconds: 15));
      if (head.statusCode >= 200 && head.statusCode < 300) {
        expected = int.tryParse(head.headers['content-length'] ?? '');
      }
    } catch (_) {}

    if (await file.exists()) {
      final size = await file.length();
      // Reuse a warm cache when size looks complete, or when the server omitted length.
      if (size > 1024 && (expected == null || size == expected)) return file;
    }

    final response = await http.get(Uri.parse(url)).timeout(const Duration(minutes: 3));
    if (response.statusCode < 200 || response.statusCode >= 300 || response.bodyBytes.isEmpty) {
      throw Exception('The theme song could not be downloaded.');
    }
    await file.writeAsBytes(response.bodyBytes, flush: true);
    return file;
  }

  Future<void> _openAudio(String url) async {
    setState(() {
      _loadingAudio = true;
      _failed = false;
      _error = null;
      _ready = true; // Show the player shell immediately.
    });

    final player = AudioPlayer();
    try {
      await _prepareSession();
      File? local;
      try {
        local = await _cachedAudioFile(url);
        await player.setFilePath(local.path, preload: true);
      } catch (_) {
        // Fall back to streaming if the cache write fails.
        await player.setUrl(url, preload: false).timeout(const Duration(seconds: 45));
      }
      if (!mounted) {
        await player.dispose();
        return;
      }
      await _audioState?.cancel();
      _audioState = player.playerStateStream.listen((_) {
        if (mounted) setState(() {});
      });
      setState(() {
        _audio = player;
        _loadingAudio = false;
        _ready = true;
      });
    } catch (reason) {
      await player.dispose();
      if (!mounted) return;
      setState(() {
        _audio = null;
        _loadingAudio = false;
        _failed = true;
        _error = 'This theme song could not be loaded right now.';
      });
    }
  }

  Future<void> _openVideo(String url) async {
    final player = VideoPlayerController.networkUrl(Uri.parse(url));
    try {
      await player.initialize().timeout(const Duration(seconds: 45));
      await player.setLooping(false);
      if (!mounted) {
        await player.dispose();
        return;
      }
      setState(() {
        _video = player;
        _ready = true;
      });
    } catch (_) {
      await player.dispose();
      if (mounted) {
        setState(() {
          _failed = true;
          _error = 'This theme song could not be loaded right now.';
        });
      }
    }
  }

  void _disposePlayers() {
    _audioState?.cancel();
    _audioState = null;
    _audio?.dispose();
    _audio = null;
    _video?.dispose();
    _video = null;
  }

  @override
  void dispose() {
    _disposePlayers();
    super.dispose();
  }

  Future<void> _toggleAudio() async {
    final player = _audio;
    if (player == null || _loadingAudio) return;
    try {
      if (player.playing) {
        await player.pause();
      } else {
        if (player.processingState == ProcessingState.completed) {
          await player.seek(Duration.zero);
        }
        await player.play();
      }
    } catch (_) {
      if (mounted) setState(() => _error = 'Playback failed. Try again in a moment.');
    }
  }

  Future<void> _toggleVideo() async {
    final player = _video;
    if (player == null) return;
    if (player.value.isPlaying) {
      await player.pause();
    } else {
      await player.play();
    }
    if (mounted) setState(() {});
  }

  Future<void> _download() async {
    if (!song.canDownload || _downloading) return;
    setState(() => _downloading = true);
    try {
      final api = ClubScope.of(context).api;
      final path = await saveUrlToDownloads(api.media(song.downloadSource), fileName: song.saveAs);
      if (!mounted) return;
      await showClubMessage(context, 'Saved to Downloads:\n$path');
    } catch (reason) {
      if (mounted) await showClubMessage(context, '$reason'.replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _downloading = false);
    }
  }

  Future<void> _openYoutube() async {
    final link = song.youtubeWatchUrl ?? song.source;
    final uri = Uri.tryParse(link);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  String get _shareLink {
    final api = ClubScope.of(context).api;
    if (song.isYoutube) return song.youtubeWatchUrl ?? song.source;
    return api.media(song.downloadSource);
  }

  Future<void> _share() async {
    final link = _shareLink;
    if (link.isEmpty) return;
    try {
      await SharePlus.instance.share(ShareParams(text: 'United Tigers theme song — ${song.title}\n$link', subject: song.title));
    } catch (reason) {
      if (mounted) await showClubMessage(context, '$reason'.replaceFirst('Exception: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    final poster = song.poster == null ? null : api.media(song.poster!);
    return ClubCard(
      highlight: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Eyebrow('Theme song'),
          const SizedBox(height: 6),
          GoldText(song.title.toUpperCase(), style: displayStyle(26)),
          const SizedBox(height: 6),
          Text(
            song.isYoutube
                ? 'Play the official United Tigers theme on YouTube.'
                : song.isVideo
                    ? 'Watch the official United Tigers theme song.'
                    : 'Listen to the official United Tigers theme song.',
            style: const TextStyle(color: Color(0xFFE6DDF0), height: 1.45),
          ),
          const SizedBox(height: 14),
          if (song.isYoutube)
            _YoutubeTile(onPlay: _openYoutube, poster: poster)
          else if (_failed)
            Text(_error ?? 'This theme song could not be loaded right now.', style: const TextStyle(color: Color(0xFFE6DDF0)))
          else if (song.isAudio)
            _AudioPlayerBar(
              player: _audio,
              loading: !_ready || _loadingAudio || _audio == null,
              poster: poster,
              onToggle: _toggleAudio,
            )
          else if (!_ready || _video == null)
            const Padding(padding: EdgeInsets.symmetric(vertical: 18), child: Center(child: CircularProgressIndicator(color: goldLight)))
          else
            _HostedVideoPlayer(player: _video!, poster: poster, onToggle: _toggleVideo),
          if (_error != null && !_failed) ...[
            const SizedBox(height: 8),
            Text(_error!, style: const TextStyle(color: Color(0xFFE6DDF0), fontSize: 12)),
          ],
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (song.isYoutube)
                FilledButton.icon(
                  style: goldButtonStyle(),
                  onPressed: _openYoutube,
                  icon: const FaIcon(FontAwesomeIcons.youtube, size: 14),
                  label: const Text('OPEN ON YOUTUBE'),
                )
              else if (song.canDownload)
                FilledButton.icon(
                  style: goldButtonStyle(),
                  onPressed: _downloading ? null : _download,
                  icon: FaIcon(_downloading ? FontAwesomeIcons.spinner : FontAwesomeIcons.download, size: 14),
                  label: Text(_downloading ? 'SAVING…' : 'DOWNLOAD'),
                ),
              OutlinedButton.icon(
                onPressed: _share,
                icon: const FaIcon(FontAwesomeIcons.shareNodes, size: 14),
                label: const Text('SHARE'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _YoutubeTile extends StatelessWidget {
  const _YoutubeTile({required this.onPlay, this.poster});
  final VoidCallback onPlay;
  final String? poster;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: InkWell(
        onTap: onPlay,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (poster != null) RemoteImage(poster!, height: 200, radius: 0) else Container(color: const Color(0xFF2B074D)),
              const ColoredBox(color: Color(0x66000000)),
              const Center(child: FaIcon(FontAwesomeIcons.circlePlay, color: Colors.white, size: 44)),
            ],
          ),
        ),
      ),
    );
  }
}

class _AudioPlayerBar extends StatelessWidget {
  const _AudioPlayerBar({required this.player, required this.loading, required this.onToggle, this.poster});

  final AudioPlayer? player;
  final bool loading;
  final VoidCallback onToggle;
  final String? poster;

  @override
  Widget build(BuildContext context) {
    final active = player;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), border: Border.all(color: gold.withValues(alpha: 0.35)), color: const Color(0xFF2B074D)),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              width: 64,
              height: 64,
              child: poster != null
                  ? RemoteImage(poster!, height: 64, radius: 0)
                  : const ColoredBox(color: Color(0xFF1B0533), child: Center(child: FaIcon(FontAwesomeIcons.music, color: goldLight))),
            ),
          ),
          const SizedBox(width: 12),
          IconButton.filled(
            style: IconButton.styleFrom(backgroundColor: goldLight, foregroundColor: ink),
            onPressed: loading || active == null ? null : onToggle,
            icon: loading
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: ink))
                : FaIcon(active?.playing == true ? FontAwesomeIcons.pause : FontAwesomeIcons.play, size: 16),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: active == null
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SliderTheme(
                        data: SliderTheme.of(context).copyWith(
                          trackHeight: 3,
                          thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
                          overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
                          activeTrackColor: goldLight,
                          inactiveTrackColor: const Color(0x33FFFFFF),
                          thumbColor: goldLight,
                        ),
                        child: const Slider(min: 0, max: 1, value: 0, onChanged: null),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 4),
                        child: Row(
                          children: [
                            Text('Preparing…', style: TextStyle(color: Color(0xFFBDAED0), fontSize: 11, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    ],
                  )
                : StreamBuilder<Duration?>(
                    stream: active.durationStream,
                    builder: (context, durationSnap) {
                      final total = durationSnap.data ?? Duration.zero;
                      return StreamBuilder<Duration>(
                        stream: active.positionStream,
                        builder: (context, positionSnap) {
                          final position = positionSnap.data ?? Duration.zero;
                          final max = total.inMilliseconds > 0 ? total.inMilliseconds.toDouble() : 1.0;
                          final value = position.inMilliseconds.clamp(0, max.toInt()).toDouble();
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              SliderTheme(
                                data: SliderTheme.of(context).copyWith(
                                  trackHeight: 3,
                                  thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
                                  overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
                                  activeTrackColor: goldLight,
                                  inactiveTrackColor: const Color(0x33FFFFFF),
                                  thumbColor: goldLight,
                                  overlayColor: goldLight.withValues(alpha: 0.2),
                                ),
                                child: Slider(
                                  min: 0,
                                  max: max,
                                  value: value,
                                  onChanged: total.inMilliseconds == 0 ? null : (next) => active.seek(Duration(milliseconds: next.round())),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                child: Row(
                                  children: [
                                    Text(_clock(position), style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 11, fontWeight: FontWeight.w700)),
                                    const Spacer(),
                                    Text(total == Duration.zero ? 'Preparing…' : _clock(total), style: const TextStyle(color: Color(0xFFBDAED0), fontSize: 11, fontWeight: FontWeight.w700)),
                                  ],
                                ),
                              ),
                            ],
                          );
                        },
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  String _clock(Duration value) {
    final minutes = value.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = value.inSeconds.remainder(60).toString().padLeft(2, '0');
    final hours = value.inHours;
    return hours > 0 ? '$hours:$minutes:$seconds' : '$minutes:$seconds';
  }
}

class _HostedVideoPlayer extends StatelessWidget {
  const _HostedVideoPlayer({required this.player, required this.onToggle, this.poster});

  final VideoPlayerController player;
  final VoidCallback onToggle;
  final String? poster;

  @override
  Widget build(BuildContext context) {
    final playing = player.value.isPlaying;
    return Column(
      children: [
        AspectRatio(
          aspectRatio: player.value.aspectRatio == 0 ? 16 / 9 : player.value.aspectRatio,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Stack(
              alignment: Alignment.center,
              children: [
                VideoPlayer(player),
                Positioned.fill(
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: onToggle,
                      child: playing ? const SizedBox.expand() : const Center(child: FaIcon(FontAwesomeIcons.circlePlay, color: Colors.white, size: 44)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        VideoProgressIndicator(player, allowScrubbing: true, colors: const VideoProgressColors(playedColor: goldLight, bufferedColor: Color(0x55D2A95A), backgroundColor: Color(0x33FFFFFF))),
      ],
    );
  }
}
