// ===== CLEAN BACKGROUND (NO LOCK / NO BAN / NO TRACKING) =====

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // ================= CHECK USER =================
    if (request.action === "CHECK_USER_EXIST") {
        const username = request.username.replace('@', '');
        const url = `https://www.tiktok.com/@${username}`;

        fetch(url)
        .then(r => r.text())
        .then(html => {
            const match = html.match(/property="og:image" content="([^"]+)"/);
            if (match && match[1]) {
                sendResponse({ success: true, avatar: match[1] });
            } else {
                sendResponse({ success: false });
            }
        })
        .catch(() => sendResponse({ success: false }));

        return true;
    }

    // ================= DUMMY STATS =================
    if (request.action === "FETCH_TIKTOK_DATA") {
        sendResponse({
            success: true,
            data: []
        });
        return true;
    }

    // ================= DOWNLOAD =================
    if (request.action === "DOWNLOAD_MEDIA") {
        chrome.downloads.download({
            url: request.url,
            filename: `downloads/${request.filename}`,
            saveAs: false
        });
        return true;
    }

    // ================= ANALYZE VIDEO =================
    if (request.action === "ANALYZE_SINGLE_VIDEO") {
        const encodedUrl = encodeURIComponent(request.url);
        const url = `https://www.tikwm.com/api/?url=${encodedUrl}`;

        fetch(url)
        .then(r => r.json())
        .then(json => {
            if (json.code === 0 && json.data) {
                const d = json.data;
                sendResponse({
                    success: true,
                    data: {
                        cover: d.cover,
                        title: d.title,
                        playUrl: d.play || d.hdplay,
                        musicUrl: d.music,
                        author: d.author.nickname,
                        views: d.play_count,
                        likes: d.digg_count
                    }
                });
            } else {
                sendResponse({ success: false });
            }
        })
        .catch(() => sendResponse({ success: false }));

        return true;
    }

    // ================= HD DOWNLOAD =================
    if (request.action === "FETCH_HD_VIDEO") {
        handleHDProcess(request.url)
        .then(link => {
            if (link) sendResponse({ success: true, data: { playUrl: link } });
            else sendResponse({ success: false });
        })
        .catch(() => sendResponse({ success: false }));

        return true;
    }
});

// ================= HD PROCESS =================
async function handleHDProcess(url) {
    try {
        const submit = await fetch("https://www.tikwm.com/api/video/task/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `url=${encodeURIComponent(url)}`
        });

        const data = await submit.json();
        if (!data?.data?.task_id) return null;

        await new Promise(r => setTimeout(r, 2000));

        const result = await fetch(`https://www.tikwm.com/api/video/task/result?task_id=${data.data.task_id}`);
        const json = await result.json();

        return json?.data?.play_url || json?.data?.download_url || null;

    } catch {
        return null;
    }
}