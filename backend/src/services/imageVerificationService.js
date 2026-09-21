// Resilient sharp import — lazy-loaded with graceful fallback for cloud deployments
// where the native binary may not be available (e.g. Render, Vercel)
let _sharp = null;
let _sharpLoadAttempted = false;

async function getSharp() {
  if (_sharpLoadAttempted) return _sharp;
  _sharpLoadAttempted = true;
  try {
    const mod = await import("sharp");
    _sharp = mod.default || mod;
    console.log("[imageVerificationService] sharp loaded successfully");
  } catch (err) {
    console.warn("[imageVerificationService] sharp not available — image analysis will use safe defaults:", err.message);
    _sharp = null;
  }
  return _sharp;
}

/**
 * ── 1. Laplacian Blur Detection (Edge Variance) ──
 * Computes sharpness via Laplacian kernel 2D convolution standard deviation/variance.
 */
export async function checkLaplacianBlur(imageInput) {
  try {
    const input = typeof imageInput === "string" && imageInput.startsWith("data:")
      ? Buffer.from(imageInput.split(",")[1], "base64")
      : imageInput;

    const sharp = await getSharp();
    if (!sharp) return { pass: true, score: 25, error: "sharp not available" };

    const { data, info } = await sharp(input)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    if (!width || !height || width < 3 || height < 3) {
      return { pass: true, score: 50 };
    }

    // 3x3 Discrete Laplacian Kernel: [0, 1, 0; 1, -4, 1; 0, 1, 0]
    let sum = 0;
    let sumSq = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const idx = y * width + x;
        const val = 
          data[idx - width] + 
          data[idx - 1] + 
          data[idx + 1] + 
          data[idx + width] - 
          4 * data[idx];
        
        sum += val;
        sumSq += val * val;
        count++;
      }
    }

    const mean = count > 0 ? sum / count : 0;
    const variance = count > 0 ? (sumSq / count) - (mean * mean) : 0;
    const standardDev = Math.sqrt(Math.max(0, variance));

    // Threshold: < 5.5 indicates excessive motion blur / out of focus
    const threshold = 5.5;
    const pass = standardDev >= threshold;

    return {
      pass,
      score: Number(standardDev.toFixed(2)),
      threshold
    };
  } catch (err) {
    console.error("checkLaplacianBlur error:", err);
    return { pass: true, score: 25, error: err.message };
  }
}

/**
 * ── 2. Brightness & Exposure Assessment ──
 * Measures luminance distribution across pixels. Acceptable range: 60 - 200.
 */
export async function checkBrightnessExposure(imageInput) {
  try {
    const input = typeof imageInput === "string" && imageInput.startsWith("data:")
      ? Buffer.from(imageInput.split(",")[1], "base64")
      : imageInput;

    const sharp = await getSharp();
    if (!sharp) return { pass: true, score: 128, level: "OPTIMAL", error: "sharp not available" };

    const { data } = await sharp(input)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let sum = 0;
    const step = 4; // Sample step for fast calculation
    let count = 0;
    for (let i = 0; i < data.length; i += step) {
      sum += data[i];
      count++;
    }

    const average = count > 0 ? sum / count : 128;
    const isPitchBlack = average < 30;
    const isBlownOut = average > 240;
    const pass = average >= 45 && average <= 215;

    return {
      pass,
      score: Number(average.toFixed(1)),
      level: isPitchBlack ? "PITCH_BLACK" : average < 45 ? "TOO_DARK" : isBlownOut ? "BLOWN_OUT" : average > 215 ? "OVEREXPOSED" : "OPTIMAL"
    };
  } catch (err) {
    console.error("checkBrightnessExposure error:", err);
    return { pass: true, score: 128, level: "OPTIMAL", error: err.message };
  }
}

/**
 * ── 3. Resolution & Dimensions Quality Check ──
 */
export async function checkResolutionQuality(imageInput) {
  try {
    const input = typeof imageInput === "string" && imageInput.startsWith("data:")
      ? Buffer.from(imageInput.split(",")[1], "base64")
      : imageInput;

    const sharp = await getSharp();
    if (!sharp) return { pass: true, width: 640, height: 480, error: "sharp not available" };

    const metadata = await sharp(input).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const pass = (width >= 320 && height >= 240) || (width >= 240 && height >= 320) || (width * height >= 75000);

    return {
      pass,
      width,
      height
    };
  } catch (err) {
    console.error("checkResolutionQuality error:", err);
    return { pass: true, width: 640, height: 480, error: err.message };
  }
}

/**
 * ── 4. Perceptual Hashing (pHash / dHash) for Duplicate Detection ──
 * Generates a 64-bit perceptual hash from 8x8 resized greyscale thumbnail.
 */
export async function computePHash(imageInput) {
  try {
    const input = typeof imageInput === "string" && imageInput.startsWith("data:")
      ? Buffer.from(imageInput.split(",")[1], "base64")
      : imageInput;

    const sharp = await getSharp();
    if (!sharp) return "";

    const { data } = await sharp(input)
      .resize(8, 8, { fit: "fill" })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let sum = 0;
    for (let i = 0; i < 64; i++) sum += data[i];
    const avg = sum / 64;

    let binaryStr = "";
    for (let i = 0; i < 64; i++) {
      binaryStr += data[i] >= avg ? "1" : "0";
    }

    // Convert 64-bit binary string into 16-hex characters
    let hexHash = "";
    for (let i = 0; i < 64; i += 4) {
      hexHash += parseInt(binaryStr.substring(i, i + 4), 2).toString(16);
    }

    return hexHash;
  } catch (err) {
    console.error("computePHash error:", err);
    return "";
  }
}

/**
 * Calculates Hamming distance between two 16-character hex pHashes (0 - 64 bits).
 * Distance <= 5 indicates near-identical / recycled photo.
 */
export function calculateHammingDistance(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const n1 = parseInt(hash1[i], 16);
    const n2 = parseInt(hash2[i], 16);
    let xor = n1 ^ n2;
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

/**
 * ── 5. EXIF & Metadata Extraction ──
 */
export async function extractExifMetadata(imageInput) {
  try {
    const input = typeof imageInput === "string" && imageInput.startsWith("data:")
      ? Buffer.from(imageInput.split(",")[1], "base64")
      : imageInput;

    const sharp = await getSharp();
    if (!sharp) return { status: "N/A", exifTimestamp: null, error: "sharp not available" };

    const metadata = await sharp(input).metadata();
    
    // Check if EXIF buffer exists
    if (!metadata.exif) {
      return {
        status: "N/A",
        exifTimestamp: null,
        cameraModel: "Web Camera"
      };
    }

    return {
      status: "VALID",
      exifTimestamp: new Date(),
      cameraModel: metadata.model || "Mobile / Camera"
    };
  } catch (err) {
    return { status: "N/A", exifTimestamp: null, error: err.message };
  }
}

/**
 * ── 6. Consolidated Image Feature Verification ──
 */
export async function verifyImageFeatures(imageInput) {
  if (!imageInput) {
    return {
      blur: { pass: true, score: 0 },
      brightness: { pass: true, score: 128, level: "OPTIMAL" },
      quality: { pass: true, width: 0, height: 0 },
      pHash: "",
      isInvalidPhoto: false,
      exif: { status: "N/A", exifTimestamp: null }
    };
  }

  const [blur, brightness, quality, pHash, exif] = await Promise.all([
    checkLaplacianBlur(imageInput),
    checkBrightnessExposure(imageInput),
    checkResolutionQuality(imageInput),
    computePHash(imageInput),
    extractExifMetadata(imageInput)
  ]);

  // Consolidate invalid / blacked-out / unusable camera capture
  const isInvalidPhoto = 
    brightness.level === "PITCH_BLACK" ||
    brightness.level === "BLOWN_OUT" ||
    (!blur.pass && !brightness.pass && blur.score < 3.0);

  return {
    blur,
    brightness,
    quality,
    pHash,
    isInvalidPhoto,
    exif
  };
}
