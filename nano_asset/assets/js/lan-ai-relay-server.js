/**
 * lan-ai-relay-server.js - Standalone LAN AI Relay & Network Info Server (Node.js)
 *
 * Menghubungkan Browser Server (AI Host di Mac) dengan Perangkat Klien (HP / Laptop di LAN).
 * Mendukung:
 * 1. Built-in Pure RFC 6455 WebSocket Engine (Zero external dependencies, tanpa perlu npm install)
 * 2. Fallback otomatis ke package 'ws' jika tersedia
 * 3. Endpoint /api/network-info (Mendeteksi IP Wi-Fi lokal untuk lan-qrcode.js)
 * 4. Endpoint /api/lan-ai-status (Mengecek status kesiapan Host AI dari klien)
 * 5. Static File Server multi-path untuk seluruh modul web EduVis / Gemma
 *
 * Cara Menjalankan:
 *   node assets/js/lan-ai-relay-server.js [PORT]
 *   (Default port: 1234)
 */

const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const EventEmitter = require('events');

const PORT = parseInt(process.argv[2] || process.env.PORT || '1234', 10);
const ROOT_DIR = path.resolve(__dirname, '../../'); // Root direktori aplikasi

// Menyimpan koneksi Host dan antrian request
let hostSocket = null;
const clientSockets = new Map();
const pendingRequests = new Map();

/**
 * Mendapatkan semua alamat IPv4 lokal (Wi-Fi / LAN)
 */
function getLocalIpAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                addresses.push(net.address);
            }
        }
    }

    return addresses;
}

// MIME types dasar untuk static server
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.wasm': 'application/wasm',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.zip': 'application/zip'
};

/**
 * Pure Node.js RFC 6455 WebSocket Implementation
 * Bekerja langsung dengan modul standar Node.js tanpa perlu 'npm install ws'.
 */
class PureWebSocket extends EventEmitter {
    constructor(socket, isServer = true) {
        super();
        this.socket = socket;
        this.isServer = isServer;
        this.readyState = 1; // 1 = OPEN
        this._buffer = Buffer.alloc(0);

        socket.on('data', (chunk) => this._onData(chunk));
        socket.on('close', () => {
            this.readyState = 3; // 3 = CLOSED
            this.emit('close');
        });
        socket.on('error', (err) => {
            this.emit('error', err);
        });
    }

    send(data) {
        if (this.readyState !== 1) return;
        const payload = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
        const length = payload.length;
        let header;

        // Frame dari server ke client TIDAK boleh di-mask (RFC 6455 section 5.1)
        if (length <= 125) {
            header = Buffer.from([0x81, length]);
        } else if (length <= 65535) {
            header = Buffer.alloc(4);
            header[0] = 0x81;
            header[1] = 126;
            header.writeUInt16BE(length, 2);
        } else {
            header = Buffer.alloc(10);
            header[0] = 0x81;
            header[1] = 127;
            header.writeBigUInt64BE(BigInt(length), 2);
        }

        try {
            this.socket.write(Buffer.concat([header, payload]));
        } catch (e) {
            this.emit('error', e);
        }
    }

    close() {
        if (this.readyState === 3) return;
        this.readyState = 3;
        try {
            this.socket.write(Buffer.from([0x88, 0x00])); // Close frame
            this.socket.end();
        } catch (e) {}
    }

    _onData(chunk) {
        this._buffer = Buffer.concat([this._buffer, chunk]);
        while (this._buffer.length >= 2) {
            const firstByte = this._buffer[0];
            const secondByte = this._buffer[1];
            const opcode = firstByte & 0x0f;
            const isMasked = (secondByte & 0x80) !== 0;
            let payloadLen = secondByte & 0x7f;
            let offset = 2;

            if (payloadLen === 126) {
                if (this._buffer.length < 4) break;
                payloadLen = this._buffer.readUInt16BE(2);
                offset = 4;
            } else if (payloadLen === 127) {
                if (this._buffer.length < 10) break;
                payloadLen = Number(this._buffer.readBigUInt64BE(2));
                offset = 10;
            }

            const maskLen = isMasked ? 4 : 0;
            if (this._buffer.length < offset + maskLen + payloadLen) {
                break; // Frame belum utuh, tunggu chunk berikutnya
            }

            let mask = null;
            if (isMasked) {
                mask = this._buffer.slice(offset, offset + 4);
                offset += 4;
            }

            const payload = this._buffer.slice(offset, offset + payloadLen);
            this._buffer = this._buffer.slice(offset + payloadLen);

            if (isMasked && mask) {
                for (let i = 0; i < payload.length; i++) {
                    payload[i] ^= mask[i % 4];
                }
            }

            // Opcode 0x08: Close
            if (opcode === 0x08) {
                this.close();
                this.emit('close');
                return;
            }

            // Opcode 0x09: Ping -> balas Pong
            if (opcode === 0x09) {
                try {
                    this.socket.write(Buffer.from([0x8a, 0x00]));
                } catch (e) {}
                continue;
            }

            // Opcode 0x0A: Pong
            if (opcode === 0x0a) {
                continue;
            }

            // Opcode 0x01: Text Frame
            if (opcode === 0x01) {
                this.emit('message', payload.toString('utf8'));
            }
        }
    }
}

/**
 * Message Handler terpusat untuk WebSocket Host & Client
 */
function attachSocketListeners(ws, req) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const role = url.searchParams.get('role');
    const clientId = url.searchParams.get('id');

    ws.on('error', (err) => {
        if (err.code !== 'ECONNRESET' && err.code !== 'EPIPE') {
            console.error('[LAN Bridge] WebSocket error:', err);
        }
    });

    if (role === 'host') {
        console.log('🟢 [LAN Bridge] Browser Server Host (Mac) terhubung dan siap melayani inferensi.');
        hostSocket = ws;

        ws.on('message', (msgStr) => {
            try {
                const data = typeof msgStr === 'string' ? JSON.parse(msgStr) : JSON.parse(msgStr.toString());
                const { requestId, type, chunk, error } = data;

                // 1. Teruskan stream ke Klien WebSocket
                const clientWs = clientSockets.get(requestId);
                if (clientWs && clientWs.readyState === 1) {
                    clientWs.send(typeof msgStr === 'string' ? msgStr : JSON.stringify(data));
                }

                // 2. Tangani fallback Klien HTTP Relay
                const pendingHttp = pendingRequests.get(requestId);
                if (pendingHttp) {
                    if (type === 'stream_chunk' && chunk) {
                        pendingHttp.fullText += chunk;
                    } else if (type === 'stream_done') {
                        pendingHttp.res.writeHead(200, { 'Content-Type': 'application/json' });
                        pendingHttp.res.end(JSON.stringify({ text: pendingHttp.fullText }));
                        pendingRequests.delete(requestId);
                    } else if (type === 'stream_error') {
                        pendingHttp.res.writeHead(500, { 'Content-Type': 'application/json' });
                        pendingHttp.res.end(JSON.stringify({ error: error || 'Host error' }));
                        pendingRequests.delete(requestId);
                    }
                }
            } catch (e) {
                console.error('[LAN Bridge] Gagal memproses pesan host:', e);
            }
        });

        ws.on('close', () => {
            console.log('🔴 [LAN Bridge] Browser Server Host (Mac) terputus.');
            if (hostSocket === ws) hostSocket = null;
        });

    } else if (role === 'client') {
        if (clientId) {
            clientSockets.set(clientId, ws);
        }

        ws.on('message', (msgStr) => {
            if (!hostSocket || hostSocket.readyState !== 1) {
                ws.send(JSON.stringify({
                    type: 'stream_error',
                    error: 'Browser Server Host belum aktif di Mac. Buka http://localhost:' + PORT + ' di Chrome Mac Anda.'
                }));
                return;
            }
            // Teruskan request prompt dari HP ke browser Mac
            hostSocket.send(typeof msgStr === 'string' ? msgStr : JSON.stringify(JSON.parse(msgStr.toString())));
        });

        ws.on('close', () => {
            if (clientId) clientSockets.delete(clientId);
        });
    }
}

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    // 1. API: Network Info (untuk lan-qrcode.js)
    if (url.pathname === '/api/network-info') {
        const addresses = getLocalIpAddresses();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            port: PORT,
            addresses: addresses.length > 0 ? addresses : ['127.0.0.1']
        }));
        return;
    }

    // 2. API: Status Jaringan & Kesiapan AI Host
    if (url.pathname === '/api/lan-ai-status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            hostReady: !!(hostSocket && hostSocket.readyState === 1),
            activeClients: clientSockets.size,
            port: PORT,
            addresses: getLocalIpAddresses()
        }));
        return;
    }

    // 3. API: LAN AI HTTP Relay (jika klien tidak menggunakan WebSocket)
    if (url.pathname === '/api/lan-ai-http' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { requestId, payload } = data;

                if (!hostSocket || hostSocket.readyState !== 1) {
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Browser Server Host belum aktif. Buka http://localhost:' + PORT + ' di Chrome Mac Anda.'
                    }));
                    return;
                }

                pendingRequests.set(requestId, { res, fullText: '' });

                hostSocket.send(JSON.stringify({
                    type: 'prompt_request',
                    requestId,
                    payload
                }));

            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // 4. Static File Server dengan multi-path fallback
    const resolvedPath = resolveStaticFile(url.pathname);
    if (!resolvedPath) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`404 Not Found: ${url.pathname}`);
        return;
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(resolvedPath).pipe(res);
});

function resolveStaticFile(pathname) {
    const cleanPath = decodeURIComponent(pathname.replace(/^\/+/, '')) || 'index.html';
    const candidates = [
        path.join(process.cwd(), cleanPath),
        path.join(process.cwd(), 'nano_asset', cleanPath),
        path.join(ROOT_DIR, cleanPath),
        path.join(ROOT_DIR, 'nano_asset', cleanPath),
        path.resolve(__dirname, '../../../', cleanPath),
        path.resolve(__dirname, '../../', cleanPath),
        path.resolve(__dirname, '../', cleanPath)
    ];

    for (const cand of candidates) {
        try {
            if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
                return cand;
            }
        } catch (e) {}
    }
    return null;
}

// =========================================================================
// Setup WebSocket Engine (Otomatis: Coba 'ws' -> Fallback ke Pure RFC 6455)
// =========================================================================
let wsServerInstance = null;
try {
    const { WebSocketServer } = require('ws');
    wsServerInstance = new WebSocketServer({ noServer: true });
    console.log('⚡ Modul WebSocket: Terdeteksi package "ws".');
} catch (e) {
    console.log('⚡ Modul WebSocket: Menggunakan Built-in Pure RFC 6455 Engine (Zero-dependency).');
}

server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/api/lan-ai-relay') {
        if (wsServerInstance) {
            wsServerInstance.handleUpgrade(request, socket, head, (ws) => {
                attachSocketListeners(ws, request);
            });
        } else {
            // Handshake RFC 6455 Native
            const key = request.headers['sec-websocket-key'];
            if (!key) {
                socket.destroy();
                return;
            }
            const accept = crypto
                .createHash('sha1')
                .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
                .digest('base64');

            socket.write(
                'HTTP/1.1 101 Switching Protocols\r\n' +
                'Upgrade: websocket\r\n' +
                'Connection: Upgrade\r\n' +
                'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
            );

            const pureWs = new PureWebSocket(socket, true);
            attachSocketListeners(pureWs, request);
        }
    } else {
        socket.destroy();
    }
});

server.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIpAddresses();
    console.log(`\n======================================================`);
    console.log(`🚀 LAN AI Relay Server aktif pada port ${PORT}`);
    console.log(`======================================================`);
    console.log(`💻 Host Server (Mac) : http://localhost:${PORT}/obrolan-claude.html`);
    if (ips.length > 0) {
        ips.forEach(ip => {
            console.log(`📱 Klien LAN (HP)    : http://${ip}:${PORT}/obrolan-claude.html`);
        });
    }
    console.log(`======================================================\n`);
});
