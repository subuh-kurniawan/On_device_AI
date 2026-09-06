/*
 * Local voice conversation controller for Chrome Built-in AI.
 * Include with: <script src="live-conversation.js"></script>
 */
(function () {
    'use strict';

    class LiveConversationController {
        constructor(options = {}) {
            this.options = {
                language: 'id-ID',
                systemPrompt: 'Anda adalah asisten suara berbahasa Indonesia. Jawab singkat, jelas, dan natural.',
                personaPrompt: 'Gunakan gaya bahasa natural, santai, dan mudah dipahami.',
                conversationContext: '',
                manualMode: true,
                onStateChange: () => {},
                onTranscript: () => {},
                onResponse: () => {},
                onError: () => {},
                ...options
            };
            this.recognition = null;
            this.session = null;
            this.running = false;
            this.listening = false;
            this.speaking = false;
            this.interimTranscript = '';
            this.finalTranscript = '';
            this.responseBuffer = '';
            this.fullResponseText = '';
            this.responseComplete = false;
            this.abortController = null;
            this.selfSpeechLock = false;
            this.ttsSuppressionUntil = 0;
            this.lastUserSpeechAt = 0;
            this.autoListenCooldown = 0;
        }

        async start() {
            if (!this.createRecognition()) return;

            if (!this.running) {
                try {
                    this.session = await this.createSession();
                    this.running = true;
                } catch (error) {
                    this.fail(error);
                    return;
                }
            }

            if (this.selfSpeechLock || this.speaking || Date.now() < this.ttsSuppressionUntil) {
                this.setState('idle');
                return;
            }

            this.setState('listening');
            this.startListening();
        }

        stop() {
            this.running = false;
            this.abortController?.abort();
            this.abortController = null;
            this.recognition?.stop();
            window.speechSynthesis?.cancel();
            this.listening = false;
            this.speaking = false;
            this.setState('idle');
        }

        interrupt() {
            this.abortController?.abort();
            this.abortController = null;
            window.speechSynthesis?.cancel();
            this.speaking = false;
            if (this.running) {
                this.setState('listening');
                this.startListening();
            }
        }

        createRecognition() {
            const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!Recognition) {
                this.fail(new Error('SpeechRecognition tidak tersedia di browser ini.'));
                return false;
            }
            if (this.recognition) return true;

            this.recognition = new Recognition();
            this.recognition.lang = this.options.language;
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 1;

            this.recognition.onstart = () => {
                const now = Date.now();
                if (this.selfSpeechLock || this.speaking || now < this.ttsSuppressionUntil) {
                    this.recognition.stop();
                    return;
                }
                this.listening = true;
                this.setState('listening');
            };
            this.recognition.onend = () => {
                this.listening = false;
                const now = Date.now();
                if (this.running && !this.speaking && !this.selfSpeechLock && now >= this.ttsSuppressionUntil) {
                    this.setState('thinking');
                }
            };
            this.recognition.onerror = event => {
                const now = Date.now();
                if (this.selfSpeechLock || now < this.ttsSuppressionUntil) return;
                if (event.error === 'aborted' || event.error === 'no-speech') return;
                this.fail(new Error(`Speech recognition: ${event.error}`));
            };
            this.recognition.onresult = event => this.handleRecognitionResult(event);
            return true;
        }

        startListening() {
            const now = Date.now();
            if (!this.running || this.listening || this.speaking || this.selfSpeechLock || now < this.ttsSuppressionUntil || now < this.autoListenCooldown) return;
            try {
                this.finalTranscript = '';
                this.interimTranscript = '';
                this.recognition.start();
            } catch (error) {
                if (error.name !== 'InvalidStateError') this.fail(error);
            }
        }

        handleRecognitionResult(event) {
            const now = Date.now();
            if (this.selfSpeechLock || this.speaking || now < this.ttsSuppressionUntil) return;
            let interim = '';
            let finalText = '';
            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const transcript = event.results[index][0].transcript;
                if (event.results[index].isFinal) finalText += transcript;
                else interim += transcript;
            }
            this.interimTranscript = interim;
            this.finalTranscript += finalText;
            this.options.onTranscript({
                interim: this.interimTranscript,
                final: this.finalTranscript
            });
            if (finalText.trim()) {
                this.recognition.stop();
                this.ask(this.finalTranscript.trim());
            }
        }

        async createSession() {
            const api = window.ai?.languageModel || window.ai?.assistant || window.LanguageModel;
            if (!api || typeof api.create !== 'function') {
                return this.createLocalFallbackSession();
            }
            const config = {
                expectedInputs: [{ type: 'text' }],
                outputLanguage: 'id',
                initialPrompts: [{
                    role: 'system',
                    content: `${this.options.systemPrompt} ${this.options.personaPrompt}${this.options.conversationContext ? `\nRiwayat percakapan sebelumnya:\n${this.options.conversationContext}` : ''}`
                }]
            };
            return api.create(config);
        }

        createLocalFallbackSession() {
            return {
                prompt: async (text) => this.applyLocalPersona(this.generateLocalReply(text)),
                promptStreaming: async function* (text, { signal } = {}) {
                    const reply = this.applyLocalPersona(this.generateLocalReply(text));
                    const chunkSize = 18;
                    for (let index = 0; index < reply.length; index += chunkSize) {
                        if (signal?.aborted) return;
                        const chunk = reply.slice(index, index + chunkSize);
                        yield chunk;
                    }
                }.bind(this)
            };
        }

        applyLocalPersona(reply) {
            const persona = this.options.personaPrompt || '';
            if (/singkat|langsung ke inti/i.test(persona)) {
                return reply.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
            }
            if (/ramah|hangat|empatik/i.test(persona) && !/^Tentu/i.test(reply)) {
                return `Tentu. ${reply}`;
            }
            return reply;
        }

        generateLocalReply(text) {
            const normalized = String(text || '').toLowerCase().trim();
            if (!normalized) return 'Saya mendengar Anda, tetapi belum ada pertanyaan yang jelas.';

            if (/\b(halo|hai|hello|hi)\b/.test(normalized)) {
                return 'Halo! Saya versi lokal siap membantu. Silakan katakan apa yang ingin Anda lakukan.';
            }
            if (/\b(siapa|nama)\b/.test(normalized)) {
                return 'Saya adalah asisten suara lokal yang berjalan di browser ini. Saya membantu tanpa perlu Chrome Built-in AI.';
            }
            if (/\b(jam|waktu)\b/.test(normalized)) {
                const now = new Date();
                return `Sekarang pukul ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.`;
            }
            if (/\b(tanggal|hari|date)\b/.test(normalized)) {
                const now = new Date();
                return `Hari ini ${now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;
            }
            if (/\b(terima kasih|makasih|thanks)\b/.test(normalized)) {
                return 'Sama-sama! Saya senang bisa membantu.';
            }
            if (/\b(cuaca|hujan|cerah|panas)\b/.test(normalized)) {
                return 'Saya tidak bisa melihat cuaca real-time di sini, tapi saya siap membantu Anda mengecek atau merencanakan aktivitas.';
            }
            if (/\b(baik|bagus|apakah)\b/.test(normalized)) {
                return 'Baik. Mode lokal aktif dan siap menerima instruksi Anda.';
            }
            if (/\b(membantu|bantu|tolong)\b/.test(normalized)) {
                return 'Tentu. Beri tahu saya tugas atau pertanyaan Anda, dan saya akan merespons singkat dalam Bahasa Indonesia.';
            }

            return `Saya menangkap pertanyaan Anda: “${text.trim()}”. Dalam mode lokal, saya membalas secara sederhana dan tetap siap membantu.`;
        }

        async ask(text) {
            if (!text || !this.session || !this.running) return;
            this.lastUserSpeechAt = Date.now();
            this.setState('thinking');
            this.responseBuffer = '';
            this.fullResponseText = '';
            this.responseComplete = false;
            this.abortController = new AbortController();

            try {
                const prompt = this.session.promptStreaming
                    ? this.session.promptStreaming(text, { signal: this.abortController.signal })
                    : this.session.prompt(text);

                if (this.session.promptStreaming) {
                    for await (const chunk of prompt) {
                        if (this.abortController.signal.aborted) return;
                        const value = this.extractChunk(chunk);
                        if (!value) continue;
                        this.responseBuffer += value;
                        this.fullResponseText += value;
                        this.options.onResponse({ text: this.fullResponseText, done: false });
                        this.speakCompleteSentences();
                    }
                } else {
                    this.fullResponseText = await prompt;
                    this.responseBuffer = this.fullResponseText;
                    this.options.onResponse({ text: this.fullResponseText, done: false });
                }

                this.options.onResponse({ text: this.fullResponseText, done: true });
                this.responseComplete = true;
                this.speakRemaining();
                if (this.speaking) return;
                if (this.running && !this.options.manualMode) {
                    this.autoListenCooldown = Date.now() + 800;
                    this.setState('listening');
                    setTimeout(() => {
                        if (this.running && !this.options.manualMode && Date.now() >= this.autoListenCooldown) {
                            this.startListening();
                        }
                    }, 900);
                } else if (this.running) {
                    this.listening = false;
                    this.setState('idle');
                }
            } catch (error) {
                if (error.name !== 'AbortError') this.fail(error);
            } finally {
                this.abortController = null;
            }
        }

        extractChunk(chunk) {
            if (typeof chunk === 'string') return chunk;
            if (typeof chunk === 'object') {
                return chunk.text || chunk.value || chunk.content || chunk.delta?.content || '';
            }
            return '';
        }

        speakCompleteSentences() {
            if (!window.speechSynthesis || this.speaking) return;
            const match = this.responseBuffer.match(/^([\s\S]*?[.!?。！？])(?:\s|$)/);
            if (!match) return;
            const sentence = match[1].trim();
            this.responseBuffer = this.responseBuffer.slice(match[0].length);
            this.speak(sentence);
        }

        speakRemaining() {
            if (this.speaking) return;
            const remaining = this.responseBuffer.trim();
            this.responseBuffer = '';
            if (remaining) this.speak(remaining);
        }

        speak(text) {
            const speechText = String(text || '')
                .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
                .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
                .replace(/```[\s\S]*?```/g, match => match.replace(/```[^\n]*\n?/g, ''))
                .replace(/^\s{0,3}#{1,6}\s+/gm, '')
                .replace(/^\s*>\s?/gm, '')
                .replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/gm, '')
                .replace(/^\s*[-*_]{3,}\s*$/gm, '')
                .replace(/[|#*_~`]/g, '')
                .replace(/<[^>]+>/g, '')
                .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Regional_Indicator}\uFE0F\u200D]/gu, '')
                .replace(/\s{2,}/g, ' ')
                .replace(/\s+([,.!?;:])/g, '$1')
                .replace(/([,.!?;:])(?=\S)/g, '$1 ')
                .trim();
            if (!speechText || !window.speechSynthesis) return;
            this.selfSpeechLock = true;
            this.ttsSuppressionUntil = Date.now() + 7000;
            this.recognition?.stop();
            this.listening = false;

            const tryLocalOnnxTts = async () => {
                if (!this.options.useLocalTts) return null;
                if (!window.__localTTSModel) {
                    try {
                        const mod = await import('./nano_asset/assets/js/transformers.min.js');
                        if (mod && mod.pipeline) {
                            window.__localTTSModel = true;
                        }
                    } catch (error) {
                        return null;
                    }
                }
                return window.__localTTSModel ? 'ready' : null;
            };

            const speakWithSystemVoice = () => {
                const utterance = new SpeechSynthesisUtterance(speechText);
                utterance.lang = this.options.language;
                utterance.rate = 1;
                utterance.pitch = 1;
                utterance.volume = 1;
                const voices = window.speechSynthesis.getVoices();
                const indoVoice = voices.find(voice => voice.lang.includes('id') && voice.name.includes('Google'))
                    || voices.find(voice => voice.lang.includes('id'));
                if (indoVoice) utterance.voice = indoVoice;
                utterance.onstart = () => {
                    this.speaking = true;
                    this.setState('speaking');
                };
                utterance.onend = () => {
                    this.speaking = false;
                    this.selfSpeechLock = false;
                    this.ttsSuppressionUntil = Date.now() + 500;
                    this.autoListenCooldown = Date.now() + 400;
                    if (this.running) {
                        if (this.responseBuffer.trim()) {
                            this.speakCompleteSentences();
                            if (this.speaking) return;
                            if (this.responseComplete) this.speakRemaining();
                            if (this.speaking) return;
                        }
                        if (this.options.manualMode) {
                            this.listening = false;
                            this.setState('idle');
                            return;
                        }
                        this.setState('listening');
                        setTimeout(() => {
                            const afterGap = Date.now() >= this.autoListenCooldown && Date.now() >= this.ttsSuppressionUntil && !this.selfSpeechLock && !this.speaking && this.running;
                            if (afterGap) this.startListening();
                        }, 600);
                    }
                };
                utterance.onerror = utterance.onend;
                window.speechSynthesis.speak(utterance);
            };

            tryLocalOnnxTts().then((status) => {
                if (status === 'ready') {
                    // Local ONNX TTS model is not bundled in this project yet; fall back safely.
                    speakWithSystemVoice();
                    return;
                }
                speakWithSystemVoice();
            }).catch(() => speakWithSystemVoice());
        }

        setState(state) {
            this.options.onStateChange(state);
        }

        fail(error) {
            this.options.onError(error);
            this.setState('error');
        }
    }

    window.LiveConversationController = LiveConversationController;
})();
