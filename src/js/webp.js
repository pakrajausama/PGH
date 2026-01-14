const fileInput = document.getElementById("fileInput");
const convertBtn = document.getElementById("convertBtn");
const progressBox = document.getElementById("progressBox");
const progressBar = document.getElementById("progressBar");
const downloadBtn = document.getElementById("downloadBtn");
const nonGeoList = document.getElementById("nonGeoList");
const geoPreview = document.getElementById("geoPreview");
const geojsonBtn = document.getElementById("geojsonBtn");

let zip;
let geojson;
let nonGeotagged = [];

convertBtn.onclick = async () => {
    const files = fileInput.files;
    if (!files.length) return alert("Select images first");

    zip = new JSZip();
    nonGeotagged = [];

    geojson = {
        type: "FeatureCollection",
        features: []
    };

    progressBox.classList.remove("d-none");
    downloadBtn.classList.add("d-none");

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // ---- Read EXIF ----
        let tags = {};
        try {
            tags = await ExifReader.load(file);
        } catch {}

        const hasGPS = tags.GPSLatitude && tags.GPSLongitude;

        if (hasGPS) {
            const lat = tags.GPSLatitude.description;
            const lon = tags.GPSLongitude.description;
            const alt = tags.GPSAltitude ? tags.GPSAltitude.description : null;

            geojson.features.push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [lon, lat]
                },
                properties: {
                    image: file.name.replace(/\.\w+$/, ".webp"),
                    latitude: lat,
                    longitude: lon,
                    altitude: alt
                }
            });
        } else {
            nonGeotagged.push(file.name);
        }

        // ---- Convert to WebP ----
        const webp = await toWebP(file);
        zip.file(file.name.replace(/\.\w+$/, ".webp"), webp);

        const p = Math.round(((i + 1) / files.length) * 100);
        progressBar.style.width = p + "%";
        progressBar.innerText = p + "%";
    }

    geoPreview.textContent = JSON.stringify(geojson, null, 2);
    downloadBtn.classList.remove("d-none");
    geojsonBtn.classList.remove("d-none");

    // ---- Add side files ----
    zip.file("images.geojson", JSON.stringify(geojson, null, 2));
    zip.file("non_geotagged.txt", nonGeotagged.join("\n"));

    // ---- UI output ----
    nonGeoList.textContent = nonGeotagged.length
        ? nonGeotagged.join("\n")
        : "All images are geotagged ✔";

    geoPreview.textContent = JSON.stringify(geojson, null, 2);
    downloadBtn.classList.remove("d-none");
};

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
            canvas.getContext("2d").drawImage(img, 0, 0);
            canvas.toBlob(resolve, "image/webp", 0.9);
        };
    });
}

downloadBtn.onclick = async () => {
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "webp_with_geojson.zip";
    a.click();
};

geojsonBtn.onclick = () => {
    if (!geojson || !geojson.features.length) {
        alert("No geotagged images found.");
        return;
    }

    const blob = new Blob(
        [JSON.stringify(geojson, null, 2)],
        { type: "application/geo+json" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "images.geojson";
    a.click();
};
