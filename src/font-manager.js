/**
 * Font Manager for AAMVA DL/ID PSD Processing
 * Handles loading and mapping of custom fonts for authentic template rendering
 */

const path = require('path');
const { GlobalFonts } = require('@napi-rs/canvas');

// Default Texas font directory (can be overridden)
let TEXAS_FONTS_DIR = process.env.TEXAS_FONTS_DIR || 
  (process.platform === 'win32' ? 
    'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Fonts' :
    '/usr/local/share/texas-dl-fonts');

// Font name mappings: PSD font name -> actual registered font name
const FONT_MAPPINGS = {
  // Main fonts from Texas template
  'D-DIN': 'D-DIN',
  'd-din': 'D-DIN',
  'd-din.regular': 'D-DIN',
  'DIN Mittelschrift Mittelschrift': 'DIN Mittelschrift',
  'Arial-BoldMT': 'Arial',
  'ArialMT': 'Arial',
  'Arial Bold MT': 'Arial',
  'Arial MT': 'Arial',
  
  // Signature fonts - map PSD names to actual font names
  'HalimunRegular': 'Halimun',
  'Halimun Regular': 'Halimun',
  'Halimun': 'Halimun',
  'Historia': 'Historia',
  'Historia Regular': 'Historia',
  'Youthness-Regular': 'Youthness',
  'Youthness Regular': 'Youthness',
  'Youthness': 'Youthness',
  'SouthamptonRegular': 'Southampton',
  'Southampton Regular': 'Southampton',
  'Southampton': 'Southampton',
  
  // Additional Texas-specific fonts
  'Asem Kandis': 'Asem Kandis',
  'AsemKandis': 'Asem Kandis',
  'D432': 'D432'
};

// Additional fallback mappings for common PSD font name patterns
function createFontFallbacks(psdFontName) {
  const clean = psdFontName.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();
  
  // Common patterns for removing "Regular", "MT", etc.
  const variations = [
    clean,
    clean.replace(/Regular$/i, ''),
    clean.replace(/MT$/i, ''),
    clean.replace(/BoldMT$/i, 'Bold'),
    clean.replace(/MT /i, ''),
    clean.replace(/ /g, '-'),
    clean.replace(/ /g, '_'),
    clean.replace(/ /g, ''),
  ];
  
  return variations;
}

// Track which fonts are loaded
let fontsLoaded = false;

/**
 * Set custom Texas fonts directory
 * @param {string} dirPath - Path to the fonts directory
 */
function setTexasFontsDir(dirPath) {
  TEXAS_FONTS_DIR = dirPath;
  fontsLoaded = false; // Reset loaded state to allow reloading
}

/**
 * Get the resolved font name for a PSD font
 * @param {string} psdFontName - Font name from PSD
 * @returns {string} - Resolved font name for canvas
 */
function resolveFontName(psdFontName) {
  if (!psdFontName) return 'Arial, sans-serif';
  
  // Clean the base font name
  let cleanName = psdFontName
    .replace(/^"|"$/g, '')
    .replace(/^'|'$/g, '')
    .split(',')[0]
    .trim();

  // Check direct mappings first
  if (FONT_MAPPINGS[cleanName]) {
    const mapped = FONT_MAPPINGS[cleanName];
    if (GlobalFonts.has(mapped)) {
      return mapped;
    }
    cleanName = mapped;
  }
  
  // Check if the cleaned name exists
  if (GlobalFonts.has(cleanName)) {
    return cleanName;
  }
  
  // Try all fallback variations
  const fallbacks = createFontFallbacks(cleanName);
  for (const fallback of fallbacks) {
    if (GlobalFonts.has(fallback)) {
      return fallback;
    }
  }
  
  // Try adding common suffixes
  const suffixes = ['', ' Regular', ' Bold', ' Italic', ' Light', ' Medium'];
  for (const suffix of suffixes) {
    for (const fallback of fallbacks) {
      const withSuffix = fallback + suffix;
      if (GlobalFonts.has(withSuffix)) {
        return withSuffix;
      }
    }
  }
  
  // Final fallback to Arial
  console.warn(`Font not found: ${psdFontName} -> ${cleanName}, falling back to Arial`);
  return 'Arial, sans-serif';
}

/**
 * Extract font weight from PSD font name
 * @param {string} psdFontName - Font name from PSD
 * @returns {string} - CSS font weight
 */
function extractFontWeight(psdFontName) {
  if (!psdFontName) return '';
  
  const cleanName = psdFontName.toLowerCase();
  
  if (cleanName.includes('bold')) return 'bold';
  if (cleanName.includes('light')) return '300';
  if (cleanName.includes('medium')) return '500';
  if (cleanName.includes('black') || cleanName.includes('heavy')) return '900';
  if (cleanName.includes('thin') || cleanName.includes('hairline')) return '100';
  if (cleanName.includes('regular') || cleanName.includes('normal') || cleanName.includes('mt')) return '';
  
  return '';
}

/**
 * Load fonts from the Texas fonts directory
 * @returns {boolean} - True if fonts were loaded successfully
 */
function loadTexasFonts() {
  if (fontsLoaded) return true;
  
  try {
    const fs = require('fs');
    
    // Check if directory exists
    if (!fs.existsSync(TEXAS_FONTS_DIR)) {
      console.warn(`Texas fonts directory not found: ${TEXAS_FONTS_DIR}`);
      fontsLoaded = true; // Don't try again
      return false;
    }
    
    // Load all fonts from the directory (recursive)
    GlobalFonts.loadFontsFromDir(TEXAS_FONTS_DIR, { recursive: true });
    
    console.log(`✓ Loaded fonts from: ${TEXAS_FONTS_DIR}`);
    fontsLoaded = true;
    return true;
    
  } catch (error) {
    console.error(`Error loading Texas fonts: ${error.message}`);
    fontsLoaded = true; // Don't retry on error
    return false;
  }
}

/**
 * Get all available font families
 * @returns {string[]} - Array of font family names
 */
function getAvailableFonts() {
  try {
    const familiesRaw = GlobalFonts.getFamilies();
    
    // Handle Uint8Array (JSON string) or direct array
    if (familiesRaw && familiesRaw.length) {
      // Check if it's a Uint8Array with JSON content
      if (familiesRaw.constructor === Uint8Array) {
        const jsonString = String.fromCharCode.apply(null, Array.from(familiesRaw));
        const parsed = JSON.parse(jsonString);
        return parsed || [];
      }
      // Handle direct array
      return Array.from(familiesRaw).filter(f => f && typeof f === 'string');
    }
    return [];
  } catch (error) {
    console.error('Error getting font families:', error.message);
    return [];
  }
}

/**
 * Register a specific font from a file path
 * @param {string} fontPath - Path to the font file
 * @param {string} alias - Optional alias for the font
 * @returns {boolean} - True if registration succeeded
 */
function registerFont(fontPath, alias) {
  try {
    const fs = require('fs');
    
    if (!fs.existsSync(fontPath)) {
      console.error(`Font file not found: ${fontPath}`);
      return false;
    }
    
    const buffer = fs.readFileSync(fontPath);
    GlobalFonts.register(buffer, alias || path.basename(fontPath, path.extname(fontPath)));
    
    console.log(`✓ Registered font: ${fontPath}`);
    return true;
    
  } catch (error) {
    console.error(`Error registering font ${fontPath}: ${error.message}`);
    return false;
  }
}

/**
 * Get font information for a PSD layer
 * @param {object} layer - PSD layer with text
 * @returns {object} - Font information for canvas rendering
 */
function getFontInfo(layer) {
  const style = layer.text?.style || {};
  const font = style.font || {};
  
  const psdFontName = font.name || 'Arial-BoldMT';
  const fontSize = style.fontSize || 12;
  
  // Resolve the actual font name
  const resolvedFontName = resolveFontName(psdFontName);
  const fontWeight = extractFontWeight(psdFontName);
  
  // Check if font is italic (from PSD style)
  const isItalic = style.fauxItalic || font.style === 'italic' || false;
  
  // Build CSS font string
  let fontString = resolvedFontName;
  if (fontWeight) {
    fontString = `${fontWeight} ${fontString}`;
  }
  if (isItalic) {
    fontString = `${fontString} italic`;
  }
  
  return {
    fontName: resolvedFontName,
    fontSize: fontSize,
    fontWeight: fontWeight,
    isItalic: isItalic,
    fontString: fontString.trim(),
    psdFontName: psdFontName
  };
}

/**
 * Ensure fonts are loaded (lazy initialization)
 */
function ensureFontsLoaded() {
  if (!fontsLoaded) {
    loadTexasFonts();
  }
}

// Auto-initialize on module load
ensureFontsLoaded();

module.exports = {
  setTexasFontsDir,
  loadTexasFonts,
  resolveFontName,
  extractFontWeight,
  getFontInfo,
  getAvailableFonts,
  registerFont,
  ensureFontsLoaded,
  // Expose for debugging
  FONT_MAPPINGS,
  TEXAS_FONTS_DIR: () => TEXAS_FONTS_DIR
};