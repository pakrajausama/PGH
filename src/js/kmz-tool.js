// --- Utility: Convert DMS to decimal degrees ---
function dmsToDeg(dms, ref) {
  const [deg, min, sec] = dms;
  let val = deg + min / 60 + sec / 3600;
  return (ref === "S" || ref === "W") ? -val : val;
}


async function convertToCompressedWebP(file, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) reject("WebP conversion failed");
          resolve(blob);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}


// --- Extract GPS from image using exif-js ---
function extractGps(file, callback) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const exif = EXIF.readFromBinaryFile(e.target.result);

      if (exif && exif.GPSLatitude && exif.GPSLongitude) {
        const lat = dmsToDeg(exif.GPSLatitude, exif.GPSLatitudeRef);
        const lon = dmsToDeg(exif.GPSLongitude, exif.GPSLongitudeRef);
        callback({ lat, lon });
      } else {
        console.warn("No GPS in:", file.name);
        callback(null);
      }
    } catch (err) {
      console.warn("EXIF parse error for:", file.name, err.message || err);
      callback(null);
    }
  };
  reader.onerror = function (err) {
    console.error("File read error:", file.name, err);
    callback(null);
  };
  reader.readAsArrayBuffer(file);
}

// --- Resize image (like Python Pillow did) ---
async function resizeImage(file, maxSize = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // scale down
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        quality
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// --- Build KMZ ---
document.getElementById("processBtn").addEventListener("click", async () => {
  const files = document.getElementById("fileInput").files;
  const status = document.getElementById("status");
  const link = document.getElementById("downloadLink");

  if (!files.length) {
    alert("Please select JPG images first");
    return;
  }

  status.textContent = "⏳ Processing images...";
  link.style.display = "none";

  const zip = new JSZip();
  const kmlParts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    '<Document>'
  ];

  let processed = 0;

  for (const file of files) {
    await new Promise((resolve) => {
      extractGps(file, async (gps) => {
        processed++;
        if (gps) {
          try {
            // resize before adding
            const webpBlob = await convertToCompressedWebP(file, 0.85);
            zip.file("files/" + file.name.replace(/\.\w+$/, ".webp"), webpBlob);

            // Placemark
            kmlParts.push(`
              <Placemark>
                <name>${file.name}</name>
                <description><![CDATA[
                  <img src="files/${encodeURIComponent(file.name)}" width="400"/>
                ]]></description>
                <Point><coordinates>${gps.lon},${gps.lat}</coordinates></Point>
              </Placemark>
            `);
          } catch (err) {
            console.error("Resize failed for", file.name, err);
          }
        }
        status.textContent = `Processed ${processed}/${files.length} files...`;
        resolve();
      });
    });
  }

  kmlParts.push("</Document></kml>");
  zip.file("doc.kml", kmlParts.join("\n"));

  const kmzBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(kmzBlob);

  link.href = url;
  link.download = "geotagged_images.kmz";
  link.style.display = "inline-block";
  link.textContent = "⬇️ Download KMZ";
  status.textContent = "✅ Done! KMZ with images is ready.";
});





