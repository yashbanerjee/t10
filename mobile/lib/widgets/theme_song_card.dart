import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
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
  VideoPlayerController? _player;
  bool _ready = false;
  bool _failed = false;
  bool _downloading = false;

  ThemeSong get song => widget.song;

  @override
  void initState() {
    super.initState();
    if (!song.isYoutube) _open();
  }

  @override
  void didUpdateWidget(covariant ThemeSongCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.song.source != song.source || oldWidget.song.kind != song.kind) {
      _disposePlayer();
      _ready = false;
      _failed = false;
      if (!song.isYoutube) _open();
    }
  }

  Future<void> _open() async {
    final api = ClubScope.of(context).api;
    final url = api.media(song.source);
    if (url.isEmpty) {
      setState(() => _failed = true);
      return;
    }
    final player = VideoPlayerController.networkUrl(Uri.parse(url));
    try {
      await player.initialize();
      await player.setLooping(false);
      if (!mounted) {
        await player.dispose();
        return;
      }
      setState(() {
        _player = player;
        _ready = true;
      });
    } catch (_) {
      await player.dispose();
      if (mounted) setState(() => _failed = true);
    }
  }

  void _disposePlayer() {
    _player?.dispose();
    _player = null;
  }

  @override
  void dispose() {
    _disposePlayer();
    super.dispose();
  }

  Future<void> _toggle() async {
    final player = _player;
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
            const Text('This theme song could not be loaded right now.', style: TextStyle(color: Color(0xFFE6DDF0)))
          else if (!_ready || _player == null)
            const Padding(padding: EdgeInsets.symmetric(vertical: 18), child: Center(child: CircularProgressIndicator(color: goldLight)))
          else
            _HostedPlayer(player: _player!, isVideo: song.isVideo || (_player!.value.size.height > 0 && _player!.value.aspectRatio > 0.2), poster: poster, onToggle: _toggle),
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

class _HostedPlayer extends StatelessWidget {
  const _HostedPlayer({required this.player, required this.isVideo, required this.onToggle, this.poster});

  final VideoPlayerController player;
  final bool isVideo;
  final VoidCallback onToggle;
  final String? poster;

  @override
  Widget build(BuildContext context) {
    final playing = player.value.isPlaying;
    if (isVideo) {
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
              child: poster != null ? RemoteImage(poster!, height: 64, radius: 0) : const ColoredBox(color: Color(0xFF1B0533), child: Center(child: FaIcon(FontAwesomeIcons.music, color: goldLight))),
            ),
          ),
          const SizedBox(width: 12),
          IconButton.filled(
            style: IconButton.styleFrom(backgroundColor: goldLight, foregroundColor: ink),
            onPressed: onToggle,
            icon: FaIcon(playing ? FontAwesomeIcons.pause : FontAwesomeIcons.play, size: 16),
          ),
          const SizedBox(width: 8),
          Expanded(child: VideoProgressIndicator(player, allowScrubbing: true, colors: const VideoProgressColors(playedColor: goldLight, bufferedColor: Color(0x55D2A95A), backgroundColor: Color(0x33FFFFFF)))),
        ],
      ),
    );
  }
}
