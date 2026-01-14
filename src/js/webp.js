// ===================== DOM =====================
const fileInput = document.getElementById("fileInput");
const convertBtn = document.getElementById("convertBtn");
const progressBox = document.getElementById("progressBox");
const progressBar = document.getElementById("progressBar");
const downloadBtn = document.getElementById("downloadBtn");
const nonGeoList = document.getElementById("nonGeoList");
const geoPreview = document.getElementById("geoPreview");
const geojsonBtn = document.getElementById("geojsonBtn");

// ===================== GLOBALS =====================
let zip;
let geojson;
let nonGeotagged = [];

// ===================== UTILS =====================
const sleep = (ms = 0) => new Promise(r => setTimeout(r, ms));

// ===================== IMAGE → WEBP =====================
function toWebP(file) {
    return new Promise(resolve => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = () => img.src = reader.result;
        reader.readAsDataURL(file);

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            // High quality, strong compression
            canvas.toBlob(
                blob => resolve(blob),
                "image/webp",
                0.8
            );
        };
    });
}

// ===================== MAIN =====================
convertBtn.onclick = async () => {
    const files = [...fileInput.files];

    if (!files.length) {
        alert("Please select images or a directory");
        return;
    }

    if (files.length > 5000) {
        alert("Recommended max: 5000 images per batch");
        return;
    }

    zip = new JSZip();
    nonGeotagged = [];

    geojson = {
        type: "FeatureCollection",
        features: []
    };

    progressBox.classList.remove("d-none");
    downloadBtn.classList.add("d-none");
    geojsonBtn.classList.add("d-none");

    progressBar.style.width = "0%";
    progressBar.innerText = "0%";

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Preserve directory structure
        const relativePath =
            file.webkitRelativePath || file.name;

        const webpPath = relativePath.replace(/\.\w+$/, ".webp");

        // ---------- EXIF ----------
        let tags = {};
        try {
            tags = await ExifReader.load(file);
        } catch {}

        if (tags.GPSLatitude && tags.GPSLongitude) {
            geojson.features.push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [
                        tags.GPSLongitude.description,
                        tags.GPSLatitude.description
                    ]
                },
                properties: {
                    image: webpPath,
                    latitude: tags.GPSLatitude.description,
                    longitude: tags.GPSLongitude.description,
                    altitude: tags.GPSAltitude?.description || null
                }
            });
        } else {
            nonGeotagged.push(relativePath);
        }

        // ---------- WEBP ----------
        const webpBlob = await toWebP(file);
        zip.file(webpPath, webpBlob);

        // ---------- PROGRESS ----------
        const percent = Math.round(((i + 1) / files.length) * 100);
        progressBar.style.width = percent + "%";
        progressBar.innerText = percent + "%";

        if (i % 25 === 0) await sleep(0);
    }

    // ---------- EXTRA FILES ----------
    zip.file("images.geojson", JSON.stringify(geojson, null, 2));
    zip.file("non_geotagged.txt", nonGeotagged.join("\n"));

    nonGeoList.textContent = nonGeotagged.length
        ? nonGeotagged.join("\n")
        : "All images are geotagged ✔";

    geoPreview.textContent = JSON.stringify(geojson, null, 2);

    downloadBtn.classList.remove("d-none");
    geojsonBtn.classList.remove("d-none");
};

// ===================== ZIP DOWNLOAD =====================
downloadBtn.onclick = async () => {
    downloadBtn.disabled = true;
    downloadBtn.innerText = "Creating ZIP...";

    const blob = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE" },
        meta => {
            const p = Math.round(meta.percent);
            progressBar.style.width = p + "%";
            progressBar.innerText = "ZIP " + p + "%";
        }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "webp_with_geojson.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    downloadBtn.disabled = false;
    downloadBtn.innerText = "Download WebP + GeoJSON (ZIP)";
};

// ===================== GEOJSON DOWNLOAD =====================
geojsonBtn.onclick = () => {
    if (!geojson.features.length) {
        alert("No geotagged images found");
        return;
    }

    const blob = new Blob(
        [JSON.stringify(geojson, null, 2)],
        { type: "application/geo+json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "images.geojson";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
};
