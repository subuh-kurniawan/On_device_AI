(() => {
    const storageKey = 'ondevice-ai-ui-preferences-v1';

    function showStorageError(action, error) {
        console.error(`Preferensi UI gagal ${action}:`, error);
        let status = document.getElementById('ui-preferences-error');
        if (!status) {
            status = document.createElement('div');
            status.id = 'ui-preferences-error';
            status.setAttribute('role', 'alert');
            status.style.cssText = 'position:fixed;right:1rem;bottom:1rem;z-index:10000;max-width:24rem;padding:.75rem 1rem;border:1px solid #b91c1c;border-radius:.75rem;background:#450a0a;color:#fecaca;font:12px/1.5 system-ui,sans-serif';
            document.body.append(status);
        }
        status.textContent = `Preferensi lokal gagal ${action}: ${error.message}`;
    }

    function readPreferences() {
        try {
            const value = localStorage.getItem(storageKey);
            if (!value) return {};
            const parsed = JSON.parse(value);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                throw new Error('data preferensi tidak valid');
            }
            return parsed;
        } catch (error) {
            showStorageError('dibaca', error);
            return {};
        }
    }

    function getControls(id) {
        return [...document.querySelectorAll(`[id="${id}"]`)];
    }

    function getPrimaryControl(controls) {
        return controls.find(control => control.getClientRects().length > 0) || controls[0];
    }

    function savePreference(name, value) {
        try {
            const preferences = readPreferences();
            preferences[name] = value;
            localStorage.setItem(storageKey, JSON.stringify(preferences));
            document.getElementById('ui-preferences-error')?.remove();
        } catch (error) {
            showStorageError('disimpan', error);
        }
    }

    function hasOption(select, value) {
        return [...select.options].some(option => option.value === value);
    }

    function initialize() {
        const preferences = readPreferences();
        const personaControls = getControls('persona-select');
        const languageControls = getControls('tts-language');
        const ttsControls = getControls('tts-toggle');

        if (typeof preferences.persona === 'string') {
            personaControls.forEach(control => {
                if (hasOption(control, preferences.persona)) control.value = preferences.persona;
            });
            const persona = getPrimaryControl(personaControls);
            if (persona && hasOption(persona, preferences.persona)) {
                window.applySelectedPersona?.();
            }
        }

        if (typeof preferences.ttsLanguage === 'string') {
            languageControls.forEach(control => {
                if (hasOption(control, preferences.ttsLanguage)) control.value = preferences.ttsLanguage;
            });
            const language = getPrimaryControl(languageControls);
            if (language && hasOption(language, preferences.ttsLanguage)) {
                window.updateTTSLanguage?.();
            }
        }

        if (typeof preferences.ttsEnabled === 'boolean') {
            ttsControls.forEach(control => {
                control.checked = preferences.ttsEnabled;
            });
            const tts = getPrimaryControl(ttsControls);
            if (tts) window.toggleTTS?.(tts);
        }

        document.addEventListener('change', event => {
            const target = event.target;
            if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
            if (target.id === 'persona-select') savePreference('persona', target.value);
            if (target.id === 'tts-language') savePreference('ttsLanguage', target.value);
            if (target.id === 'tts-toggle' && target instanceof HTMLInputElement) {
                ttsControls.forEach(control => {
                    control.checked = target.checked;
                });
                savePreference('ttsEnabled', target.checked);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
})();
