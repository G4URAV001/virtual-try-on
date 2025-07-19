import pica from 'pica';
// Fashn.ai API integration
const FASHN_API_URL = import.meta.env.VITE_FASHN_API_URL || 'https://api.fashn.ai';
const FASHN_API_KEY = import.meta.env.VITE_FASHN_API_KEY || 'your-api-key';

export interface TryOnRequest {
  userImage: string;
  clothingImage: string;
  options?: {
    fit: 'tight' | 'loose' | 'normal';
    style: 'realistic' | 'stylized';
    photoType?: 'auto' | 'photo' | 'sketch';
    category?: 'auto' | 'tops' | 'bottoms' | 'one-pieces';
    mode?: 'balanced' | 'fast' | 'accurate';
  };
}

export interface TryOnResponse {
  image: string;
  confidence: number;
  processing_time: number;
}

// Convert data URL to blob for API upload
const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// Resize image using pica for high-quality downscaling
const MAX_IMAGE_HEIGHT = 2000;
const JPEG_QUALITY = 0.95;

const resizeImagePica = async (dataUrl: string, maxDimension = MAX_IMAGE_HEIGHT): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous'; // Fix for CORS/canvas tainting
    img.onload = async () => {
      const { width, height } = img;
      if (width <= maxDimension && height <= maxDimension) {
        // No resizing needed, just convert to JPEG
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        try {
          canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to convert image to JPEG.'));
          }, 'image/jpeg', JPEG_QUALITY);
        } catch (err) {
          console.warn('Canvas toBlob failed, possibly due to CORS/tainted image:', err);
          reject(new Error('Image could not be processed due to CORS restrictions. Please use images from your device or a CORS-enabled source.'));
        }
        return;
      }
      // Calculate new dimensions (fit: inside)
      const aspect = width / height;
      let newWidth, newHeight;
      if (width > height) {
        newWidth = maxDimension;
        newHeight = Math.round(maxDimension / aspect);
      } else {
        newHeight = maxDimension;
        newWidth = Math.round(maxDimension * aspect);
      }
      // Source canvas
      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = width;
      sourceCanvas.height = height;
      const ctx = sourceCanvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      // Target canvas
      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = newWidth;
      targetCanvas.height = newHeight;
      // Use pica for high-quality downscale (Lanczos)
      const picaInstance = pica();
      await picaInstance.resize(sourceCanvas, targetCanvas);
      try {
        const outputBlob = await picaInstance.toBlob(targetCanvas, 'image/jpeg', JPEG_QUALITY);
        resolve(outputBlob);
      } catch (err) {
        console.warn('Pica toBlob failed, possibly due to CORS/tainted image:', err);
        reject(new Error('Image could not be processed due to CORS restrictions. Please use images from your device or a CORS-enabled source.'));
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

// Convert Blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Perform virtual try-on using Fashn API, mapping all UI options to API parameters.
 * @param userImage - base64 image of the user
 * @param clothingImage - base64 image of the clothing
 * @param options - includes clothingOptions (photoType, category), processingOptions (runMode, seed, modelVersion)
 */
export const performTryOn = async (
  userImage: string,
  clothingImage: string,
  options: {
    photoType?: string;
    category?: string;
    runMode?: 'performance' | 'balanced' | 'quality';
    seed?: string;
    modelVersion?: 'v1.6' | 'v1.5';
  } = {}
): Promise<TryOnResponse> => {
  try {
    // Preprocess images: resize and convert to JPEG, then base64 encode
    const [processedUserBlob, processedClothingBlob] = await Promise.all([
      resizeImagePica(userImage),
      resizeImagePica(clothingImage)
    ]);
    const [userImageBase64, clothingImageBase64] = await Promise.all([
      blobToBase64(processedUserBlob),
      blobToBase64(processedClothingBlob)
    ]);

    // Map runMode to API mode
    let apiMode = 'balanced';
    if (options.runMode === 'performance') apiMode = 'fast';
    else if (options.runMode === 'quality') apiMode = 'quality';
    else if (options.runMode === 'balanced') apiMode = 'balanced';

    // Use modelVersion or default
    const modelName = options.modelVersion === 'v1.5' ? 'tryon-v1.5' : 'tryon-v1.6';

    // Use seed if provided, else random
    const seed = options.seed ? parseInt(options.seed, 10) : Math.floor(Math.random() * 1000000);

    // Build Fashn API payload
    const payload = modelName === 'tryon-v1.5'
      ? {
          model_image: userImageBase64,
          garment_image: clothingImageBase64,
          garment_photo_type: options.photoType || 'auto',
          category: options.category || 'auto',
          mode: apiMode,
          segmentation_free: true,
          seed,
          num_samples: 1
        }
      : {
          model_name: modelName,
          inputs: {
            model_image: userImageBase64,
            garment_image: clothingImageBase64,
            garment_photo_type: options.photoType || 'auto',
            category: options.category || 'auto',
            mode: apiMode,
            segmentation_free: true,
            seed,
            num_samples: 1
          }
        };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FASHN_API_KEY}`
    };

    // Step 1: POST to /run
    const runResponse = await fetch(`${FASHN_API_URL}/v1/run`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    if (!runResponse.ok) {
      const errorData = await runResponse.json().catch(() => ({}));
      throw new Error(errorData.error || runResponse.statusText);
    }
    const runData = await runResponse.json();
    const predId = runData.id;
    if (!predId) throw new Error('Failed to get prediction ID from Fashn API');

    // Step 2: Poll /status/<id>
    const maxPollingTime = 180 * 1000; // 3 minutes
    const pollingInterval = 2000; // 2 seconds
    const startTime = Date.now();
    let statusData;
    while (Date.now() - startTime < maxPollingTime) {
      const statusResponse = await fetch(`${FASHN_API_URL}/v1/status/${predId}`, {
        method: 'GET',
        headers: headers
      });
      if (!statusResponse.ok) {
        await new Promise(res => setTimeout(res, pollingInterval));
        continue;
      }
      statusData = await statusResponse.json();
      if (statusData.status === 'completed') {
        break;
      } else if (
        statusData.status !== 'starting' &&
        statusData.status !== 'in_queue' &&
        statusData.status !== 'processing'
      ) {
        throw new Error(statusData.error?.message || 'Prediction failed');
      }
      await new Promise(res => setTimeout(res, pollingInterval));
    }
    if (!statusData || statusData.status !== 'completed') {
      throw new Error('Maximum polling time exceeded or prediction did not complete.');
    }
    // Return the first output image (or all if needed)
    const outputImage = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
    return {
      image: outputImage,
      confidence: 1.0, // Fashn API does not return confidence, so set dummy value
      processing_time: (Date.now() - startTime) / 1000
    };
  } catch (error) {
    console.error('Virtual try-on failed:', error);
    throw new Error('Failed to process virtual try-on. Please try again.');
  }
};

// Health check for the API
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    // Mock health check - always returns true for demo
    return true;

    // Real implementation:
    /*
    const response = await fetch(`${FASHN_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FASHN_API_KEY}`
      }
    });
    return response.ok;
    */
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};