(function() {


    function isUploadPage() {
        const url = window.location.href;
        return url.includes('/upload') || url.includes('/creator-center');
    }

    if (!window._k_60_originalCreateObjectURL) {
        window._k_60_originalCreateObjectURL = window.URL.createObjectURL;
    }
    
    window._k_60_specificModeUrl = null;
    if (typeof window._k_60_isModeActive === 'undefined') {
        window._k_60_isModeActive = false;
    }
    window._k_60_modifiedFunction = null;
    window._k_60_currentLang = 'tr'; 

    const badgeTranslations = {
        en: { ready: "SYSTEM READY", active: "SYSTEM ACTIVE" },
        tr: { ready: "SİSTEM HAZIR", active: "SİSTEM AKTİF" },
        ru: { ready: "СИСТЕМА ГОТОВА", active: "СИСТЕМА АКТИВНА" }
    };

    window.setBadgeLanguage = function(lang) {
        if (!badgeTranslations[lang]) return;
        window._k_60_currentLang = lang;
        const currentStatus = window._k_60_isModeActive ? 'active' : 'ready';
        updateBadge(currentStatus);
    };

    function updateBadge(status) {
        const badge = document.getElementById('kuronai-badge');
        const statusText = document.getElementById('k-status-text');

        if (!isUploadPage() && badge) {
        } else if (badge) {
            badge.style.display = 'block';
        }

        if (!badge || !statusText) return;
        const lang = window._k_60_currentLang || 'tr';
        const texts = badgeTranslations[lang];
        badge.classList.remove('ready', 'active');
        
        if (status === 'active') {
            badge.classList.add('active');
            statusText.innerText = texts.active; 
            statusText.style.color = "#25F4EE"; 
        } else {
            badge.classList.add('ready');
            statusText.innerText = texts.ready; 
            statusText.style.color = "#2ecc71"; 
        }
    }

    if (!window._k_60_specificModeUrl) {
        try {
            const placeholderData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            const placeholderBlob = new Blob([placeholderData], { type: "application/octet-stream" });
            window._k_60_specificModeUrl = window._k_60_originalCreateObjectURL(placeholderBlob);
        } catch (e) { console.error(e); }
    }

    window.activate60FPS = function() {
        window._k_60_isModeActive = true;
        updateBadge('active');
        
        if (URL.createObjectURL === window._k_60_modifiedFunction) return { status: "Zaten Aktif" };
        
        const newModifiedFunction = function(object) { 
            if (isUploadPage() && window._k_60_isModeActive) {
                return window._k_60_specificModeUrl; 
            }
            return window._k_60_originalCreateObjectURL(object);
        };

        URL.createObjectURL = newModifiedFunction;
        window._k_60_modifiedFunction = newModifiedFunction;
        return { status: "MOD AKTİF!" };
    };

    window.reset60FPS = function() {
        if (window._k_60_originalCreateObjectURL) {
            URL.createObjectURL = window._k_60_originalCreateObjectURL;
            window._k_60_isModeActive = false;
            updateBadge('ready');
            return { status: "Sıfırlandı." };
        }
        return { status: "Hata: Orijinal fonksiyon bulunamadı." };
    };
    
    const originalJSONStringify = JSON.stringify;

    JSON.stringify = function(value, replacer, space) {
        if (!isUploadPage()) {
            return originalJSONStringify.apply(this, arguments);
        }

        if (window._k_60_isModeActive && value && typeof value === 'object') {
            
            try {
                const deepClean = (obj) => {
                    if (!obj || typeof obj !== 'object') return;
                    const forbiddenKeys = ['draft', 'canvas_config', 'vedit_segment_info'];
                    
                    forbiddenKeys.forEach(key => {
                        if (obj.hasOwnProperty(key)) {
                            delete obj[key];
                        }
                    });

                    if (obj.cloud_edit_is_use_video_canvas !== undefined && obj.cloud_edit_is_use_video_canvas !== false) {
                        obj.cloud_edit_is_use_video_canvas = false;
                        
                    }

                    if (obj.post_type === 2) {
                        obj.post_type = 3;
                        
                    }

                    for (let k in obj) {
                        if (obj[k] && typeof obj[k] === 'object') {
                            deepClean(obj[k]);
                        }
                    }
                };

                if (value.single_post_req_list || value.vedit_common_info || value.post_common_info) {
                    deepClean(value);
                }

            } catch (e) {
                console.error("[Kuronai] Temizlik Hatası:", e);
            }
        }

        return originalJSONStringify.apply(this, arguments);
    };

    if (isUploadPage()) {
        window._k_60_isModeActive = false; 
        updateBadge('ready');
    }

})();