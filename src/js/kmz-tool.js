// --- Convert DMS to decimal degrees ---
function dmsToDeg(dms, ref) {
  const [deg, min, sec] = dms;
  let val = deg + min / 60 + sec / 3600;
  return (ref === "S" || ref === "W") ? -val : val;
}

// --- Sanitize filename (allow only alphanumeric, underscore, dash, dot) ---
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

// --- Extract GPS from image ---
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
        callback(null);
      }
    } catch (err) {
      console.warn(`Failed to read EXIF from ${file.name}:`, err);
      callback(null);
    }
  };
  reader.readAsArrayBuffer(file);
}

// --- MAIN ---
document.getElementById("processBtn").addEventListener("click", async () => {
  const files = document.getElementById("fileInput").files;
  const status = document.getElementById("status");
  const link = document.getElementById("downloadLink");
  const skippedList = document.getElementById("skippedList");

  if (!files.length) {
    alert("Select images first");
    return;
  }

  status.textContent = "⏳ Processing...";
  link.style.display = "none";
  skippedList.innerHTML = "";

  const zip = new JSZip();

  const kmlParts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    '<Document>'
  ];

  let processed = 0;
  let skippedCount = 0;

  for (const file of files) {
    await new Promise((resolve) => {
      extractGps(file, (gps) => {
        processed++;

        if (gps) {
          // Create a clean, safe filename
          const safeName = sanitizeFilename(file.name);
          // Store image inside 'files/' folder (not 'images/' to avoid confusion)
          zip.file(`files/${safeName}`, file);

          // Add Placemark with correct image reference
          kmlParts.push(`
            <Placemark>
              <name>${safeName}</name>
              <description><![CDATA[
                <div>
                  <img src="files/${safeName}" style="max-width:300px;"/>
                  <br/>
                  <b>Lat:</b> ${gps.lat.toFixed(6)}<br/>
                  <b>Lon:</b> ${gps.lon.toFixed(6)}
                </div>
              ]]></description>
              <Point>
                <coordinates>${gps.lon},${gps.lat},0</coordinates>
              </Point>
            </Placemark>
          `);
        } else {
          skippedCount++;
          const li = document.createElement("li");
          li.textContent = file.name;
          skippedList.appendChild(li);
        }

        status.textContent = `Processed ${processed}/${files.length} (skipped ${skippedCount})`;
        resolve();
      });
    });
  }

  kmlParts.push("</Document></kml>");

  // Use a unique KML name to avoid any caching issues
  const kmlName = `doc_${Date.now()}.kml`;
  zip.file(kmlName, kmlParts.join("\n"));

  // Generate KMZ
  const kmzBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(kmzBlob);

  link.href = url;
  link.download = `geotagged_${Date.now()}.kmz`;  // unique filename
  link.style.display = "inline-block";
  link.textContent = "⬇️ Download KMZ";

  status.textContent = "✅ Done! KMZ ready (images included)";

  // Debug: log the first few lines of the KML to console
  console.log("Generated KML preview:\n", kmlParts.slice(0, 10).join("\n"));
});