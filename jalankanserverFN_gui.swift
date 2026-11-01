import Cocoa
import Foundation

// =========================================================================
// EduVis / Gemma LAN AI Relay Server - Native macOS GUI Launcher (Swift)
// =========================================================================

class MainWindowController: NSObject, NSWindowDelegate {
    var window: NSWindow!
    
    // UI Elements (Optional terproteksi agar tidak pernah crash karena nil unwrap)
    var statusBadge: NSBox?
    var statusDot: NSTextField?
    var statusTitle: NSTextField?
    
    var hostUrlValue: NSTextField?
    var lanUrlValue: NSTextField?
    var sslStatusLabel: NSTextField?
    var chromeStatusLabel: NSTextField?
    
    var startButton: NSButton?
    var stopButton: NSButton?
    var restartButton: NSButton?
    var openChromeButton: NSButton?
    var openBrowserButton: NSButton?
    var copyLanButton: NSButton?
    var copyLocalButton: NSButton?
    
    var portField: NSTextField?
    var textView: NSTextView?
    var autoScrollCheck: NSButton?
    var footerLabel: NSTextField?
    
    // Server State
    var serverProcess: Process?
    var outputPipe: Pipe?
    var isRunning: Bool = false
    var configuredPort: Int = 1234
    var workingDir: String = FileManager.default.currentDirectoryPath
    var localIp: String = "127.0.0.1"
    var detectedChrome: String?
    var serverScriptPath: String?
    var nodePath: String?
    
    var currentPort: Int {
        if let field = portField, let p = Int(field.stringValue.trimmingCharacters(in: .whitespaces)), p > 0 && p < 65536 {
            return p
        }
        return configuredPort
    }
    
    var localUrl: String {
        return "https://localhost:\(currentPort)/index.html"
    }
    
    var lanUrl: String {
        return "https://\(localIp):\(currentPort)/index.html"
    }
    
    func setupAndShow() {
        // Setup menu standar macOS (Cmd+Q, Cmd+C, Cmd+V, Cmd+W)
        setupMainMenu()
        
        // Deteksi lingkungan
        detectEnvironment()
        
        // Buat Jendela Utama
        let winWidth: CGFloat = 840
        let winHeight: CGFloat = 680
        
        let screenRect = NSScreen.main?.visibleFrame ?? NSRect(x: 100, y: 100, width: 1024, height: 768)
        let originX = screenRect.origin.x + (screenRect.width - winWidth) / 2
        let originY = screenRect.origin.y + (screenRect.height - winHeight) / 2
        
        window = NSWindow(
            contentRect: NSRect(x: originX, y: originY, width: winWidth, height: winHeight),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "EduVis / Gemma LAN AI Server (macOS HTTPS)"
        window.minSize = NSSize(width: 780, height: 580)
        window.delegate = self
        
        let root = NSView(frame: NSRect(x: 0, y: 0, width: winWidth, height: winHeight))
        root.autoresizingMask = [.width, .height]
        window.contentView = root
        
        buildUI(in: root, width: winWidth, height: winHeight)
        
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        
        // Log info awal
        appendLog("========================================================\n")
        appendLog("🚀 EduVis / Gemma LAN AI Relay Server (GUI macOS)\n")
        appendLog("========================================================\n")
        appendLog("• Direktori Kerja : \(workingDir)\n")
        appendLog("• Node.js         : \(nodePath ?? "TIDAK DITEMUKAN ❌")\n")
        appendLog("• Berkas Relay    : \(serverScriptPath ?? "TIDAK DITEMUKAN ❌")\n")
        appendLog("• Google Chrome   : \(detectedChrome ?? "Browser Standar (Chrome dev/canary tidak terdeteksi)")\n")
        appendLog("• IP Wi-Fi Lokal  : \(localIp)\n")
        appendLog("--------------------------------------------------------\n")
        
        // Otomatis mulai server seperti jalankanserver.command
        startServer()
    }
    
    func setupMainMenu() {
        let mainMenu = NSMenu()
        
        // App Menu
        let appMenuItem = NSMenuItem()
        let appMenu = NSMenu()
        let quitItem = NSMenuItem(title: "Keluar", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appMenu.addItem(quitItem)
        appMenuItem.submenu = appMenu
        mainMenu.addItem(appMenuItem)
        
        // Edit Menu
        let editMenuItem = NSMenuItem()
        let editMenu = NSMenu(title: "Edit")
        editMenu.addItem(NSMenuItem(title: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x"))
        editMenu.addItem(NSMenuItem(title: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c"))
        editMenu.addItem(NSMenuItem(title: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v"))
        editMenu.addItem(NSMenuItem(title: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a"))
        editMenuItem.submenu = editMenu
        mainMenu.addItem(editMenuItem)
        
        // Window Menu
        let windowMenuItem = NSMenuItem()
        let windowMenu = NSMenu(title: "Window")
        windowMenu.addItem(NSMenuItem(title: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m"))
        windowMenu.addItem(NSMenuItem(title: "Close", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w"))
        windowMenuItem.submenu = windowMenu
        mainMenu.addItem(windowMenuItem)
        
        NSApp.mainMenu = mainMenu
    }
    
    // MARK: - Deteksi Lingkungan
    func detectEnvironment() {
        // Cari relay.js
        let candidates = [
            "\(workingDir)/nano_asset/assets/js/relay.js",
            "\(workingDir)/assets/js/relay.js",
            "\(workingDir)/relay.js"
        ]
        for c in candidates {
            if FileManager.default.fileExists(atPath: c) {
                serverScriptPath = c
                break
            }
        }
        
        // Cari Node.js
        let nodeCandidates = [
            "/opt/homebrew/bin/node",
            "/usr/local/bin/node",
            "/usr/bin/node"
        ]
        for c in nodeCandidates {
            if FileManager.default.isExecutableFile(atPath: c) {
                nodePath = c
                break
            }
        }
        if nodePath == nil {
            let task = Process()
            task.executableURL = URL(fileURLWithPath: "/usr/bin/which")
            task.arguments = ["node"]
            let pipe = Pipe()
            task.standardOutput = pipe
            try? task.run()
            task.waitUntilExit()
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            if let path = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines),
               !path.isEmpty && FileManager.default.isExecutableFile(atPath: path) {
                nodePath = path
            }
        }
        
        // Deteksi Chrome
        let homeDir = NSHomeDirectory()
        let chromeCandidates = [
            "/Applications/Google Chrome Dev.app",
            "/Applications/Google Chrome.app",
            "/Applications/Google Chrome Canary.app",
            "\(homeDir)/Applications/Google Chrome Dev.app",
            "\(homeDir)/Applications/Google Chrome.app",
            "\(homeDir)/Applications/Google Chrome Canary.app"
        ]
        for c in chromeCandidates {
            if FileManager.default.fileExists(atPath: c) {
                detectedChrome = c
                break
            }
        }
        
        // Deteksi IP Lokal
        refreshLocalIp()
    }
    
    func refreshLocalIp() {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/sbin/ipconfig")
        task.arguments = ["getifaddr", "en0"]
        let pipe = Pipe()
        task.standardOutput = pipe
        try? task.run()
        task.waitUntilExit()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        if let ip = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines), !ip.isEmpty {
            localIp = ip
            return
        }
        
        let task2 = Process()
        task2.executableURL = URL(fileURLWithPath: "/usr/sbin/ipconfig")
        task2.arguments = ["getifaddr", "en1"]
        let pipe2 = Pipe()
        task2.standardOutput = pipe2
        try? task2.run()
        task2.waitUntilExit()
        let data2 = pipe2.fileHandleForReading.readDataToEndOfFile()
        if let ip2 = String(data: data2, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines), !ip2.isEmpty {
            localIp = ip2
            return
        }
        
        localIp = "127.0.0.1"
    }
    
    // MARK: - Membangun Tampilan (UI)
    func buildUI(in root: NSView, width: CGFloat, height: CGFloat) {
        let padding: CGFloat = 20
        var curY = height - padding
        
        // Buat portField terlebih dahulu agar currentPort selalu aman
        let pField = NSTextField(string: "\(configuredPort)")
        pField.alignment = .center
        pField.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .medium)
        pField.target = self
        pField.action = #selector(portChanged)
        self.portField = pField
        
        // 1. Header (Judul & Badge Status)
        curY -= 44
        let titleLabel = NSTextField(labelWithString: "EduVis AI Relay Server")
        titleLabel.frame = NSRect(x: padding, y: curY + 16, width: 480, height: 28)
        titleLabel.font = NSFont.systemFont(ofSize: 22, weight: .bold)
        root.addSubview(titleLabel)
        
        let subtitleLabel = NSTextField(labelWithString: "macOS On-Device AI & LAN Bridge (HTTPS / WSS)")
        subtitleLabel.frame = NSRect(x: padding, y: curY - 2, width: 480, height: 18)
        subtitleLabel.font = NSFont.systemFont(ofSize: 12, weight: .medium)
        subtitleLabel.textColor = NSColor.secondaryLabelColor
        root.addSubview(subtitleLabel)
        
        // Status Badge (Pojok Kanan Atas)
        let badgeWidth: CGFloat = 210
        let badgeHeight: CGFloat = 36
        let bBox = NSBox(frame: NSRect(x: width - padding - badgeWidth, y: curY + 4, width: badgeWidth, height: badgeHeight))
        bBox.autoresizingMask = [.minXMargin, .minYMargin]
        bBox.boxType = .custom
        bBox.cornerRadius = 18
        bBox.borderWidth = 1.5
        bBox.borderColor = NSColor.systemGray.withAlphaComponent(0.4)
        bBox.fillColor = NSColor.controlBackgroundColor.withAlphaComponent(0.6)
        self.statusBadge = bBox
        
        let sTitle = NSTextField(labelWithString: "⚪ MEMPERSIAPKAN...")
        sTitle.frame = NSRect(x: 10, y: 8, width: badgeWidth - 20, height: 20)
        sTitle.font = NSFont.systemFont(ofSize: 12, weight: .bold)
        sTitle.alignment = .center
        sTitle.textColor = NSColor.secondaryLabelColor
        self.statusTitle = sTitle
        bBox.addSubview(sTitle)
        root.addSubview(bBox)
        
        curY -= 16
        
        // 2. Kartu Informasi Jaringan & Endpoint
        curY -= 130
        let cardBox = NSBox(frame: NSRect(x: padding, y: curY, width: width - (padding * 2), height: 130))
        cardBox.autoresizingMask = [.width, .minYMargin]
        cardBox.boxType = .custom
        cardBox.cornerRadius = 12
        cardBox.borderWidth = 1.0
        cardBox.borderColor = NSColor.separatorColor
        cardBox.fillColor = NSColor.controlBackgroundColor.withAlphaComponent(0.5)
        root.addSubview(cardBox)
        
        let cardInnerWidth = width - (padding * 2) - 30
        
        // Baris 1: Host Server (Mac)
        let hostIcon = NSTextField(labelWithString: "💻 Host Server (Mac):")
        hostIcon.frame = NSRect(x: 15, y: 88, width: 170, height: 20)
        hostIcon.font = NSFont.systemFont(ofSize: 12, weight: .semibold)
        cardBox.addSubview(hostIcon)
        
        let hVal = NSTextField(labelWithString: localUrl)
        hVal.frame = NSRect(x: 185, y: 88, width: max(100, cardInnerWidth - 410), height: 20)
        hVal.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .medium)
        hVal.isSelectable = true
        hVal.textColor = NSColor.linkColor
        self.hostUrlValue = hVal
        cardBox.addSubview(hVal)
        
        let chromeBtn = NSButton(title: "🚀 Buka di Chrome AI", target: self, action: #selector(openChromeClicked))
        chromeBtn.frame = NSRect(x: cardInnerWidth - 220, y: 84, width: 155, height: 26)
        chromeBtn.bezelStyle = .rounded
        chromeBtn.font = NSFont.systemFont(ofSize: 11, weight: .medium)
        self.openChromeButton = chromeBtn
        cardBox.addSubview(chromeBtn)
        
        let copyLocBtn = NSButton(title: "📋 Salin", target: self, action: #selector(copyLocalUrlClicked))
        copyLocBtn.frame = NSRect(x: cardInnerWidth - 60, y: 84, width: 70, height: 26)
        copyLocBtn.bezelStyle = .rounded
        copyLocBtn.font = NSFont.systemFont(ofSize: 11, weight: .regular)
        self.copyLocalButton = copyLocBtn
        cardBox.addSubview(copyLocBtn)
        
        // Baris 2: Klien LAN (HP/Tablet)
        let lanIcon = NSTextField(labelWithString: "📱 Klien LAN (HP / Tab):")
        lanIcon.frame = NSRect(x: 15, y: 52, width: 170, height: 20)
        lanIcon.font = NSFont.systemFont(ofSize: 12, weight: .semibold)
        cardBox.addSubview(lanIcon)
        
        let lVal = NSTextField(labelWithString: lanUrl)
        lVal.frame = NSRect(x: 185, y: 52, width: max(100, cardInnerWidth - 250), height: 20)
        lVal.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .medium)
        lVal.isSelectable = true
        lVal.textColor = NSColor.linkColor
        self.lanUrlValue = lVal
        cardBox.addSubview(lVal)
        
        let copyLanBtn = NSButton(title: "📋 Salin Link HP", target: self, action: #selector(copyLanUrlClicked))
        copyLanBtn.frame = NSRect(x: cardInnerWidth - 110, y: 48, width: 120, height: 26)
        copyLanBtn.bezelStyle = .rounded
        copyLanBtn.font = NSFont.systemFont(ofSize: 11, weight: .medium)
        self.copyLanButton = copyLanBtn
        cardBox.addSubview(copyLanBtn)
        
        // Garis Pembatas Halus di Kartu
        let sep = NSBox(frame: NSRect(x: 15, y: 40, width: cardInnerWidth, height: 1))
        sep.boxType = .separator
        cardBox.addSubview(sep)
        
        // Baris 3: Status SSL & Chrome Metadata
        let chromeName = detectedChrome != nil ? URL(fileURLWithPath: detectedChrome!).deletingPathExtension().lastPathComponent : "Browser Default"
        let cStat = NSTextField(labelWithString: "🌐 Browser AI: \(chromeName)")
        cStat.frame = NSRect(x: 15, y: 12, width: 340, height: 18)
        cStat.font = NSFont.systemFont(ofSize: 11, weight: .regular)
        cStat.textColor = NSColor.secondaryLabelColor
        self.chromeStatusLabel = cStat
        cardBox.addSubview(cStat)
        
        let sStat = NSTextField(labelWithString: "🔒 SSL HTTPS: cert.pem & key.pem")
        sStat.frame = NSRect(x: 360, y: 12, width: 340, height: 18)
        sStat.font = NSFont.systemFont(ofSize: 11, weight: .regular)
        sStat.textColor = NSColor.secondaryLabelColor
        self.sslStatusLabel = sStat
        cardBox.addSubview(sStat)
        
        curY -= 16
        
        // 3. Toolbar Kontrol Aksi (Buttons)
        curY -= 36
        let toolbarView = NSView(frame: NSRect(x: padding, y: curY, width: width - (padding * 2), height: 36))
        toolbarView.autoresizingMask = [.width, .minYMargin]
        root.addSubview(toolbarView)
        
        let sBtn = NSButton(title: "▶  Mulai Server", target: self, action: #selector(startServerClicked))
        sBtn.frame = NSRect(x: 0, y: 2, width: 130, height: 32)
        sBtn.bezelStyle = .rounded
        sBtn.font = NSFont.systemFont(ofSize: 12, weight: .semibold)
        sBtn.keyEquivalent = "\r"
        self.startButton = sBtn
        toolbarView.addSubview(sBtn)
        
        let stBtn = NSButton(title: "⏹  Hentikan", target: self, action: #selector(stopServerClicked))
        stBtn.frame = NSRect(x: 135, y: 2, width: 110, height: 32)
        stBtn.bezelStyle = .rounded
        stBtn.font = NSFont.systemFont(ofSize: 12, weight: .regular)
        stBtn.isEnabled = false
        self.stopButton = stBtn
        toolbarView.addSubview(stBtn)
        
        let rBtn = NSButton(title: "🔄  Mulai Ulang", target: self, action: #selector(restartServerClicked))
        rBtn.frame = NSRect(x: 250, y: 2, width: 120, height: 32)
        rBtn.bezelStyle = .rounded
        rBtn.font = NSFont.systemFont(ofSize: 12, weight: .regular)
        self.restartButton = rBtn
        toolbarView.addSubview(rBtn)
        
        let obBtn = NSButton(title: "🌐  Buka Browser Default", target: self, action: #selector(openBrowserClicked))
        obBtn.frame = NSRect(x: 375, y: 2, width: 175, height: 32)
        obBtn.bezelStyle = .rounded
        obBtn.font = NSFont.systemFont(ofSize: 12, weight: .regular)
        self.openBrowserButton = obBtn
        toolbarView.addSubview(obBtn)
        
        // Port Input Field di sebelah kanan toolbar
        let portBoxWidth: CGFloat = 160
        let portBox = NSView(frame: NSRect(x: toolbarView.frame.width - portBoxWidth, y: 0, width: portBoxWidth, height: 36))
        portBox.autoresizingMask = [.minXMargin]
        
        let portLbl = NSTextField(labelWithString: "Port:")
        portLbl.frame = NSRect(x: 0, y: 8, width: 40, height: 20)
        portLbl.font = NSFont.systemFont(ofSize: 12, weight: .medium)
        portBox.addSubview(portLbl)
        
        pField.frame = NSRect(x: 45, y: 6, width: 65, height: 22)
        portBox.addSubview(pField)
        toolbarView.addSubview(portBox)
        
        curY -= 12
        
        // 4. Konsol Log Real-Time (Main Area)
        let consoleBottom: CGFloat = 45
        let consoleHeight = curY - consoleBottom
        
        let consoleBox = NSBox(frame: NSRect(x: padding, y: consoleBottom, width: width - (padding * 2), height: consoleHeight))
        consoleBox.autoresizingMask = [.width, .height]
        consoleBox.boxType = .custom
        consoleBox.cornerRadius = 10
        consoleBox.borderWidth = 1.0
        consoleBox.borderColor = NSColor(calibratedRed: 0.2, green: 0.24, blue: 0.3, alpha: 1.0)
        consoleBox.fillColor = NSColor(calibratedRed: 0.07, green: 0.09, blue: 0.13, alpha: 1.0)
        root.addSubview(consoleBox)
        
        // Header Log Console
        let consoleHeaderHeight: CGFloat = 34
        let consoleHeader = NSView(frame: NSRect(x: 0, y: consoleHeight - consoleHeaderHeight, width: consoleBox.frame.width, height: consoleHeaderHeight))
        consoleHeader.autoresizingMask = [.width, .minYMargin]
        consoleBox.addSubview(consoleHeader)
        
        let logTitle = NSTextField(labelWithString: "📟 Log Aktivitas Server (Real-Time)")
        logTitle.frame = NSRect(x: 14, y: 8, width: 300, height: 18)
        logTitle.font = NSFont.systemFont(ofSize: 12, weight: .semibold)
        logTitle.textColor = NSColor(calibratedRed: 0.8, green: 0.85, blue: 0.95, alpha: 1.0)
        consoleHeader.addSubview(logTitle)
        
        let clearLogBtn = NSButton(title: "🧹 Bersihkan Log", target: self, action: #selector(clearLogClicked))
        clearLogBtn.frame = NSRect(x: consoleBox.frame.width - 125, y: 4, width: 115, height: 24)
        clearLogBtn.bezelStyle = .inline
        clearLogBtn.font = NSFont.systemFont(ofSize: 11, weight: .regular)
        clearLogBtn.autoresizingMask = [.minXMargin]
        consoleHeader.addSubview(clearLogBtn)
        
        let copyLogBtn = NSButton(title: "📋 Salin Log", target: self, action: #selector(copyLogClicked))
        copyLogBtn.frame = NSRect(x: consoleBox.frame.width - 225, y: 4, width: 95, height: 24)
        copyLogBtn.bezelStyle = .inline
        copyLogBtn.font = NSFont.systemFont(ofSize: 11, weight: .regular)
        copyLogBtn.autoresizingMask = [.minXMargin]
        consoleHeader.addSubview(copyLogBtn)
        
        // ScrollView & TextView untuk log terminal
        let scrollY: CGFloat = 8
        let scrollHeight = consoleHeight - consoleHeaderHeight - scrollY - 4
        let scrollView = NSScrollView(frame: NSRect(x: 8, y: scrollY, width: consoleBox.frame.width - 16, height: scrollHeight))
        scrollView.autoresizingMask = [.width, .height]
        scrollView.hasVerticalScroller = true
        scrollView.hasHorizontalScroller = false
        scrollView.drawsBackground = false
        scrollView.borderType = .noBorder
        
        let contentSize = scrollView.contentSize
        let tv = NSTextView(frame: NSRect(origin: .zero, size: contentSize))
        tv.minSize = NSSize(width: 0.0, height: contentSize.height)
        tv.maxSize = NSSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)
        tv.isVerticallyResizable = true
        tv.isHorizontallyResizable = false
        tv.autoresizingMask = [.width]
        tv.textContainer?.containerSize = NSSize(width: contentSize.width, height: CGFloat.greatestFiniteMagnitude)
        tv.textContainer?.widthTracksTextView = true
        
        tv.drawsBackground = false
        tv.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .regular)
        tv.textColor = NSColor(calibratedRed: 0.9, green: 0.93, blue: 0.98, alpha: 1.0)
        tv.isEditable = false
        tv.isSelectable = true
        self.textView = tv
        
        scrollView.documentView = tv
        consoleBox.addSubview(scrollView)
        
        // 5. Footer Bawah (Info Status & Auto-scroll)
        let footerY: CGFloat = 12
        let fLbl = NSTextField(labelWithString: "Status: Menunggu...")
        fLbl.frame = NSRect(x: padding, y: footerY, width: width - 200, height: 20)
        fLbl.font = NSFont.systemFont(ofSize: 11, weight: .regular)
        fLbl.textColor = NSColor.secondaryLabelColor
        self.footerLabel = fLbl
        root.addSubview(fLbl)
        
        let asCheck = NSButton(checkboxWithTitle: "Auto-scroll Log", target: nil, action: nil)
        asCheck.frame = NSRect(x: width - padding - 130, y: footerY, width: 130, height: 20)
        asCheck.state = .on
        asCheck.font = NSFont.systemFont(ofSize: 11, weight: .regular)
        asCheck.autoresizingMask = [.minXMargin]
        self.autoScrollCheck = asCheck
        root.addSubview(asCheck)
    }
    
    // MARK: - Manajemen Log Real-Time
    func appendLog(_ message: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let textView = self.textView else { return }
            let prevString = textView.string
            let newString = prevString + message
            textView.string = newString
            
            if self.autoScrollCheck?.state == .on {
                textView.scrollToEndOfDocument(nil)
            }
        }
    }
    
    // MARK: - Update Tampilan Status
    func updateStatus(running: Bool) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.isRunning = running
            self.startButton?.isEnabled = !running
            self.stopButton?.isEnabled = running
            self.portField?.isEnabled = !running
            
            // Perbarui URL
            self.refreshLocalIp()
            self.hostUrlValue?.stringValue = self.localUrl
            self.lanUrlValue?.stringValue = self.lanUrl
            
            if running {
                self.statusBadge?.borderColor = NSColor(calibratedRed: 0.13, green: 0.77, blue: 0.36, alpha: 0.8)
                self.statusBadge?.fillColor = NSColor(calibratedRed: 0.13, green: 0.77, blue: 0.36, alpha: 0.15)
                self.statusTitle?.stringValue = "🟢 AKTIF (PORT \(self.currentPort))"
                self.statusTitle?.textColor = NSColor(calibratedRed: 0.13, green: 0.77, blue: 0.36, alpha: 1.0)
                self.footerLabel?.stringValue = "Server aktif pada port \(self.currentPort) • PID: \(self.serverProcess?.processIdentifier ?? 0)"
            } else {
                self.statusBadge?.borderColor = NSColor(calibratedRed: 0.94, green: 0.27, blue: 0.27, alpha: 0.7)
                self.statusBadge?.fillColor = NSColor(calibratedRed: 0.94, green: 0.27, blue: 0.27, alpha: 0.12)
                self.statusTitle?.stringValue = "🔴 SERVER BERHENTI"
                self.statusTitle?.textColor = NSColor(calibratedRed: 0.94, green: 0.27, blue: 0.27, alpha: 1.0)
                self.footerLabel?.stringValue = "Server berhenti. Klik 'Mulai Server' untuk mengaktifkan kembali."
            }
        }
    }
    
    // MARK: - Sertifikat SSL
    func ensureSslCertificates() -> Bool {
        let keyPath = "\(workingDir)/key.pem"
        let certPath = "\(workingDir)/cert.pem"
        
        if FileManager.default.fileExists(atPath: keyPath) && FileManager.default.fileExists(atPath: certPath) {
            sslStatusLabel?.stringValue = "🔒 SSL HTTPS: key.pem & cert.pem Aktif ✅"
            return true
        }
        
        appendLog("⚠️ Sertifikat SSL tidak ditemukan di \(workingDir).\n")
        appendLog("🔧 Menghasilkan sertifikat mandiri baru dengan OpenSSL...\n")
        
        let task = Process()
        task.currentDirectoryURL = URL(fileURLWithPath: workingDir)
        task.executableURL = URL(fileURLWithPath: "/usr/bin/openssl")
        task.arguments = [
            "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-sha256",
            "-subj", "/CN=localhost",
            "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1",
            "-keyout", "key.pem", "-out", "cert.pem", "-days", "365"
        ]
        
        let pipe = Pipe()
        task.standardError = pipe
        task.standardOutput = pipe
        
        do {
            try task.run()
            task.waitUntilExit()
            if task.terminationStatus == 0 {
                appendLog("✅ Sertifikat SSL berhasil dibuat (key.pem & cert.pem).\n")
                sslStatusLabel?.stringValue = "🔒 SSL HTTPS: key.pem & cert.pem Baru Dibuat ✅"
                return true
            } else {
                let errData = pipe.fileHandleForReading.readDataToEndOfFile()
                let errStr = String(data: errData, encoding: .utf8) ?? ""
                appendLog("❌ Gagal membuat SSL: \(errStr)\n")
            }
        } catch {
            appendLog("❌ Kesalahan saat menjalankan OpenSSL: \(error.localizedDescription)\n")
        }
        return false
    }
    
    // MARK: - Port Killer
    func killProcessOnPort(_ port: Int) {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/sbin/lsof")
        task.arguments = ["-ti", ":\(port)"]
        let pipe = Pipe()
        task.standardOutput = pipe
        try? task.run()
        task.waitUntilExit()
        
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        if let out = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines), !out.isEmpty {
            let pids = out.components(separatedBy: .newlines)
            for pidStr in pids {
                if let pid = Int32(pidStr.trimmingCharacters(in: .whitespaces)) {
                    appendLog("⚠️ Port \(port) sedang digunakan oleh proses (PID: \(pid)). Menghentikan...\n")
                    kill(pid, SIGKILL)
                }
            }
            Thread.sleep(forTimeInterval: 0.5)
        }
    }
    
    // MARK: - Kontrol Server (Start, Stop, Restart)
    func startServer() {
        guard !isRunning else { return }
        
        guard let node = nodePath else {
            appendLog("❌ Node.js belum terpasang di sistem Anda!\nSilakan pasang Node.js dari https://nodejs.org/\n")
            updateStatus(running: false)
            return
        }
        
        guard let script = serverScriptPath else {
            appendLog("❌ Berkas relay.js tidak ditemukan di proyek!\nPastikan struktur folder proyek lengkap.\n")
            updateStatus(running: false)
            return
        }
        
        // Pastikan SSL tersedia
        if !ensureSslCertificates() {
            appendLog("⚠️ Melanjutkan tanpa sertifikat baru (server mungkin menolak jika berkas tidak ada).\n")
        }
        
        let port = currentPort
        killProcessOnPort(port)
        
        appendLog("\n--------------------------------------------------------\n")
        appendLog("🚀 Memulai server pada port \(port)...\n")
        
        let proc = Process()
        proc.currentDirectoryURL = URL(fileURLWithPath: workingDir)
        proc.executableURL = URL(fileURLWithPath: node)
        proc.arguments = [script, "\(port)"]
        
        // Lingkungan
        var env = ProcessInfo.processInfo.environment
        env["PORT"] = "\(port)"
        proc.environment = env
        
        let pipe = Pipe()
        proc.standardOutput = pipe
        proc.standardError = pipe
        
        pipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
            let data = handle.availableData
            if !data.isEmpty, let text = String(data: data, encoding: .utf8) {
                self?.appendLog(text)
            }
        }
        
        proc.terminationHandler = { [weak self] p in
            DispatchQueue.main.async {
                self?.appendLog("\n🛑 Server telah berhenti (Exit code: \(p.terminationStatus))\n")
                self?.serverProcess = nil
                self?.updateStatus(running: false)
            }
        }
        
        do {
            try proc.run()
            serverProcess = proc
            updateStatus(running: true)
            appendLog("✅ Proses Node.js aktif dengan PID: \(proc.processIdentifier)\n")
            
            // Buka Chrome secara otomatis setelah jeda singkat
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
                guard let self = self, self.isRunning else { return }
                self.launchChrome()
            }
        } catch {
            appendLog("❌ Gagal memulai proses server: \(error.localizedDescription)\n")
            updateStatus(running: false)
        }
    }
    
    func stopServer() {
        guard let proc = serverProcess, proc.isRunning else {
            updateStatus(running: false)
            return
        }
        appendLog("⏹ Menghentikan server relay (PID: \(proc.processIdentifier))...\n")
        proc.terminate()
        kill(proc.processIdentifier, SIGTERM)
        
        // Berikan waktu sejenak lalu SIGKILL jika belum mati
        DispatchQueue.global().async {
            Thread.sleep(forTimeInterval: 0.8)
            if proc.isRunning {
                kill(proc.processIdentifier, SIGKILL)
            }
        }
        serverProcess = nil
        updateStatus(running: false)
    }
    
    // MARK: - Peluncuran Browser
    func launchChrome() {
        let url = localUrl
        if let chrome = detectedChrome {
            appendLog("🌐 Membuka Google Chrome (\(chrome)) dengan flag Gemini Nano AI...\n")
            let task = Process()
            task.executableURL = URL(fileURLWithPath: "/usr/bin/open")
            task.arguments = [
                "-a", chrome,
                url,
                "--args",
                "--enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano",
                "--ignore-certificate-errors"
            ]
            try? task.run()
        } else {
            appendLog("🌐 Chrome dengan flag AI tidak ditemukan, membuka browser default...\n")
            openDefaultBrowser()
        }
    }
    
    func openDefaultBrowser() {
        if let url = URL(string: localUrl) {
            NSWorkspace.shared.open(url)
        }
    }
    
    // MARK: - Aksi Tombol (Actions)
    @objc func startServerClicked() {
        startServer()
    }
    
    @objc func stopServerClicked() {
        stopServer()
    }
    
    @objc func restartServerClicked() {
        appendLog("🔄 Memulai ulang server...\n")
        stopServer()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { [weak self] in
            self?.startServer()
        }
    }
    
    @objc func openChromeClicked() {
        launchChrome()
    }
    
    @objc func openBrowserClicked() {
        openDefaultBrowser()
    }
    
    @objc func copyLocalUrlClicked() {
        let pb = NSPasteboard.general
        pb.clearContents()
        pb.setString(localUrl, forType: .string)
        appendLog("📋 Disalin ke clipboard: \(localUrl)\n")
    }
    
    @objc func copyLanUrlClicked() {
        let pb = NSPasteboard.general
        pb.clearContents()
        pb.setString(lanUrl, forType: .string)
        appendLog("📋 Disalin link LAN HP ke clipboard: \(lanUrl)\n")
    }
    
    @objc func clearLogClicked() {
        textView?.string = ""
    }
    
    @objc func copyLogClicked() {
        guard let tv = textView else { return }
        let pb = NSPasteboard.general
        pb.clearContents()
        pb.setString(tv.string, forType: .string)
        appendLog("📋 Seluruh log berhasil disalin ke clipboard.\n")
    }
    
    @objc func portChanged() {
        hostUrlValue?.stringValue = localUrl
        lanUrlValue?.stringValue = lanUrl
    }
    
    // MARK: - NSWindowDelegate
    func windowWillClose(_ notification: Notification) {
        stopServer()
        NSApp.terminate(nil)
    }
}

// MARK: - NSApplicationDelegate
class AppDelegate: NSObject, NSApplicationDelegate {
    let controller = MainWindowController()
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        controller.setupAndShow()
    }
    
    func applicationWillTerminate(_ notification: Notification) {
        controller.stopServer()
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

// MARK: - Main Entry Point
let app = NSApplication.shared
app.setActivationPolicy(.regular)
let delegate = AppDelegate()
app.delegate = delegate
app.run()
