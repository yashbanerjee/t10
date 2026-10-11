// Generated from android/app/google-services.json and ios/Runner/GoogleService-Info.plist.
// Regenerate with `flutterfire configure` if the Firebase project changes.
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show TargetPlatform, defaultTargetPlatform, kIsWeb;

class DefaultFirebaseOptions {
  /// Options for the running platform, or null where Firebase isn't configured (web, desktop).
  static FirebaseOptions? get currentPlatform {
    if (kIsWeb) return null;
    return switch (defaultTargetPlatform) {
      TargetPlatform.android => android,
      TargetPlatform.iOS => ios,
      _ => null,
    };
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDMx_t_2Fd79LRTEC4Hc0eNmZXOj_2-p_E',
    appId: '1:851590629201:android:812b73a975fc810ab53570',
    messagingSenderId: '851590629201',
    projectId: 'united-tigers',
    storageBucket: 'united-tigers.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyC2Le68FwcKS-mmspDxdvJEQ6Iu89Wv2Xo',
    appId: '1:851590629201:ios:37c57726b5383e24b53570',
    messagingSenderId: '851590629201',
    projectId: 'united-tigers',
    storageBucket: 'united-tigers.firebasestorage.app',
    iosBundleId: 'com.vedha.united.tigers',
  );
}
