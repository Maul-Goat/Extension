(function () {
    const inject = () => {
        const s = document.createElement('script');
        s.src = chrome.runtime.getURL('inject.js');
        s.onload = () => s.remove();
        (document.head || document.documentElement).appendChild(s);
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inject);
    } else {
        inject();
    }
})();