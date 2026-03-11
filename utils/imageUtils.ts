/**
 * Shared image utilities for Kala Prayag
 * Replaces duplicate compressImage functions across components.
 */

import heic2any from 'heic2any';

/**
 * Compress an image file to a base64 JPEG string.
 * Keeps localStorage usage manageable by resizing and reducing quality.
 */
export const compressImage = (
  file: File,
  maxWidth = 300,
  quality = 0.5
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      let processFile = file;
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: Math.min(1, quality * 1.5) });
        processFile = new File([Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob], file.name.replace(/\.heic$|\.heif$/i, '.jpg'), { type: 'image/jpeg' });
      }

      const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(processFile);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Enhance an image using Remove.bg API
 * Cuts out the background to make the product pop on a clean canvas.
 */
export const removeBackgroundAI = async (base64Str: string): Promise<string> => {
  // 1. Get/Check API Key securely from localStorage
  let apiKey = localStorage.getItem('removeBg_apiKey');
  if (!apiKey) {
    apiKey = window.prompt("To use AI Background Removal, please enter your free Remove.bg API Key:\n(Get one at remove.bg/api)");
    if (!apiKey) {
      throw new Error("API Key required for enhancement");
    }
    localStorage.setItem('removeBg_apiKey', apiKey.trim());
  }

  // 2. Convert base64 to Blob for the API request
  const fetchResponse = await fetch(base64Str);
  const blob = await fetchResponse.blob();

  // 3. Make the API Request
  const formData = new FormData();
  formData.append('image_file', blob);
  formData.append('size', 'auto');
  formData.append('bg_color', 'white'); // Set a clean white background
  
  try {
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey.trim()
      },
      body: formData
    });

    if (!response.ok) {
      if (response.status === 402 || response.status === 403) {
        localStorage.removeItem('removeBg_apiKey'); // Clear invalid/empty keys
        throw new Error("Invalid or exhausted API Key. Please try another one.");
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // 4. Convert the resulting Blob back to a Base64 string for saving
    const resultBlob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(resultBlob);
    });

  } catch (err: any) {
    console.error("BG Removal failed:", err);
    throw err;
  }
};

/**
 * Smart Lighting: Professionally relights the product using Canvas filters.
 * Boosts contrast, enhances shadows, and applies a warm studio color profile.
 */
export const smartLighting = (base64Str: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');

      // Apple a "Studio Lighting" effect: higher contrast, slightly brighter, rich color, subtle warmth
      ctx.filter = 'contrast(1.2) brightness(1.08) saturate(1.25) sepia(0.1)';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject('Image failed to load');
    img.src = base64Str;
  });
};

/**
 * AI Upscaling Simulation: Increases resolution and applies high-quality smoothing 
 * to reduce pixelation on blurry phone photos.
 */
export const upscaleImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Upscale by 2x
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');

      // Enable high-quality browser interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw at double size and apply a slight sharpening contrast bump
      ctx.filter = 'contrast(1.05) saturate(1.05)';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => reject('Image failed to load');
    img.src = base64Str;
  });
};
