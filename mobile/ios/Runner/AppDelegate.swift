import Flutter
import QuickLook
import UIKit

/// Quick Look needs its own preview item. URL itself is not a QLPreviewItem on this SDK.
private final class BrochurePreviewItem: NSObject, QLPreviewItem {
  let previewItemURL: URL?
  let previewItemTitle: String?

  init(url: URL, title: String) {
    previewItemURL = url
    previewItemTitle = title
  }
}

/// Keeps the brochure alive while Quick Look, the system PDF viewer, is on screen.
private final class BrochurePreviewSource: NSObject, QLPreviewControllerDataSource {
  let item: BrochurePreviewItem

  init(fileURL: URL) {
    item = BrochurePreviewItem(url: fileURL, title: "United Tigers Partnership Brochure")
  }

  func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }

  func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> any QLPreviewItem {
    item
  }
}

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  private var brochurePreview: BrochurePreviewSource?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    let channel = FlutterMethodChannel(name: "united_tigers/files", binaryMessenger: engineBridge.applicationRegistrar.messenger())
    channel.setMethodCallHandler { [weak self] call, result in
      guard call.method == "openPdf",
            let args = call.arguments as? [String: Any],
            let path = args["path"] as? String else {
        result(FlutterMethodNotImplemented)
        return
      }
      DispatchQueue.main.async {
        guard let self else {
          result(FlutterError(code: "unavailable", message: "Could not open the brochure.", details: nil))
          return
        }
        self.brochurePreview = BrochurePreviewSource(fileURL: URL(fileURLWithPath: path))
        let preview = QLPreviewController()
        preview.dataSource = self.brochurePreview
        guard let presenter = Self.presenter() else {
          result(FlutterError(code: "unavailable", message: "Could not open the brochure.", details: nil))
          return
        }
        presenter.present(preview, animated: true)
        result(nil)
      }
    }
  }

  private static func presenter() -> UIViewController? {
    let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first { $0.activationState == .foregroundActive }
    let window = scene?.windows.first { $0.isKeyWindow } ?? scene?.windows.first
    var controller = window?.rootViewController
    while let presented = controller?.presentedViewController {
      controller = presented
    }
    return controller
  }
}
