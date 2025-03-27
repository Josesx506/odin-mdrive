

function bytesToMB (bytes) {
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return parseFloat(mb);
};

function resolveResourceType(ext) {
    const videoTypes = ['mp4', 'mpg', 'mpeg', 'mov', 'avi', 'wmv', 'flv', 'mkv'];
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tif', 'heic', 'webp', 'avif'];
    
    if (videoTypes.includes(ext)) {
        return "video";
    } else if (imageTypes.includes(ext)) {
        return "image";
    } else {
        return "raw";
    }
}

function getProgressBarColor(pct) {
    if (pct < 50) {
        return "progress-green";
    } else if (pct < 80) {
        return "progress-yellow";
    } else {
        return "progress-red";
    }
}

const escapeString = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
};

function formatDateTime(date) {
    return date.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
        hour12: false
    });
};

module.exports = { 
    bytesToMB,resolveResourceType, 
    escapeString, formatDateTime,
    getProgressBarColor
};