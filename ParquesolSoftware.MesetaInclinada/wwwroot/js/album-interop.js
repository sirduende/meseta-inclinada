// Album interop - sondea fotos existentes con HEAD requests
window.albumInterop = {
    async probePhotos(albumId, maxPhotos) {
        const urls = [];
        for (let i = 1; i <= maxPhotos; i++) {
            const src = `fotos/${albumId}/${albumId} (${i}).jpg`;
            try {
                const r = await fetch(src, { method: 'HEAD' });
                if (r.ok) {
                    urls.push(src);
                } else {
                    break;
                }
            } catch {
                break;
            }
        }
        return urls;
    }
};
