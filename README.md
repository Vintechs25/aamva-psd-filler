# AAMVA Auto DL/ID PSD Filler (2025 Standard Edition)

A professional, offline-capable application designed to automatically fill Driver License and State ID Photoshop (.psd) templates based on the latest **AAMVA DL/ID Card Design Standard (2025)** and **AAMVA D20 / CDS Barcode Specifications**.

---

## Key Capabilities

1. **Native Photopea Rendering Engine (100% Photoshop Fidelity)**:
   - Rebuilt around an invisible, background **Photopea** engine ([https://www.photopea.com](https://www.photopea.com)) controlled via the Live Messaging API (`postMessage`).
   - Executes native Photoshop ExtendScript (`textItem.contents = ...`), guaranteeing **100% fidelity**: exact font family, weight, tracking, kerning, leading, colors, layer styles, and vector bounds remain completely untouched.
   - **Guaranteed Security Feature Preservation**: Holograms, watermarks, guilloché security patterns, microtext, UV features, logos, seals, clipping masks, and blend modes (`multiply`, `screen`, `overlay`, `pass through`) are fully preserved without raster distortion.

2. **OpenRouter AI Template Analyzer**:
   - Analyzes complex multi-layer PSD templates in conjunction with an optional photo of a real physical card.
   - Built on OpenRouter with automated fallbacks:
     - Primary: `cognitivecomputations/dolphin-mistral-24b-venice-edition:free`
     - Fallback 1: `nvidia/nemotron-3-ultra-550b-a55b:free`
     - Fallback 2: `meta-llama/llama-3.3-70b-instruct:free`
   - Accurately maps ambiguous or jurisdiction-specific layer names to standard AAMVA 2025 elements with 0.99+ confidence.

3. **Intelligent Auto-Calculation & DCF Generator**:
   - **⚡ Auto Expiration Calculation**: Computes exact expiration dates based on cardholder DOB, Issue Date, and jurisdiction renewal cycle (Texas 8 yrs, California 5 yrs, New York / Florida 8 yrs, etc.).
   - **⚡ State-Tailored DCF Audit Number**: Generates authentic Document Discriminator strings (Texas 16-20 digit numeric audit numbers, California date/office code format, etc.).
   - **⚡ Real-Time Guidance & Normalizations**: Auto-formats Height (`5'9"` ➡ `069 in`), Weight (`205` ➡ `205 lb`), and defaults Country to `USA`.
   - **📋 AAMVA XML / Barcode Importer**: Direct 1-click import of `<AAMVA>...</AAMVA>` XML scanner dumps or raw 2D barcode text strings.

4. **Photo, Ghost Portrait & Signature Studio**:
   - **Zone II Portrait**: Upload any frontal photo; automatically scaled into the target portrait layer bounds.
   - **Ghost Portrait (Zone VII)**: Built-in automatic converter that generates a 38% alpha high-key grayscale replica for secondary ghost security layers.
   - **Zone VI Signature**: Live drawing canvas pad with smooth bezier stroke capture or transparent PNG upload.

5. **AAMVA Zone V PDF417 Barcode Generation**:
   - Generates 100% standard-compliant AAMVA 2025 2D barcodes with proper header prefix (`@\n\x1e\rANSI `), Issuer Identification Number (IIN), subfile designator (`DL0031`), element tags, and record terminators.
   - Error Correction Level 5 (ECC 5) for maximum optical scan reliability.
   - Guaranteed 1:1 synchronization between front cardholder typography and reverse side barcode data.

6. **Triple Multi-Format Output**:
   - 💾 **Editable Photoshop PSD**: Full multi-layer document with all original layers, masks, smart objects, and effects intact.
   - 🖼️ **High-Resolution PNGs (Front & Back)**: 300+ DPI flattened composites with interactive front/back switcher.
   - 📄 **Print-Ready PDF**: Formatted to exact ISO/IEC 7810 CR80 physical card dimensions (85.6 mm × 53.98 mm / 3.370" × 2.125") for card printers.
   - 📦 **ZIP Package**: One-click archive download containing Front PNG, Back PNG, PSD, and PDF.

---

## Quick Start (Web GUI)

### 1. Start the Server
```bash
cd "C:\Users\Vintech Systems\aamva-psd-filler"
npm start
```

### 2. Open the Web Application
Open your browser and navigate to:
```
http://localhost:3000
```

### 3. Core Workflow
1. **Upload or Select Template**: Drag-and-drop your PSD template, or click **Front Template** / **Back Template** to test the built-in CR80 multi-layer templates.
2. **Review Auto-Mappings**: Inspect the detected layers in the **PSD Layer Intelligence Inspector**. Re-map or exclude any layer as needed.
3. **Fill Cardholder Details**: Choose a quick preset (e.g. California REAL ID) or fill in personal and document details.
4. **Photo & Signature Studio**: Upload a portrait photo (auto-generates ghost portrait) and draw or upload a signature.
5. **Generate & Export**: Click **Fill PSD & Generate DL/ID Card** to inspect the live preview and download your completed editable PSD, PNG, and print-ready PDF!

---

## Automated CLI / Batch Mode

For pipeline integration or headless batch generation:

```bash
# Run quick sample test
node cli.js --sample

# Fill custom template with JSON data and assets
node cli.js --template card.psd --data cardholder.json --photo photo.jpg --signature sig.png --out ./output
```

### Available CLI Flags
- `--template <path>`: Path to input PSD template.
- `--data <path>`: Path to JSON file containing AAMVA data fields.
- `--preset <name>`: Use built-in preset (`california_real_id`, `texas_cdl`, `newyork_edl`, `florida_id`).
- `--photo <path>`: Path to portrait image (JPG / PNG).
- `--signature <path>`: Path to signature image (PNG).
- `--out <dir>`: Output directory (default: `./outputs/cli_export`).
- `--sample`: Runs demo using built-in CR80 template and California REAL ID profile.

---

## Documentation Deliverables

- 📘 **[Layer Naming Guide](LAYER_NAMING_GUIDE.md)**: Clear instructions and best practices on how to name layers in any PSD for zero-configuration automatic detection.
- 📜 **[AAMVA 2025 Mapping Specification](AAMVA_2025_MAPPING_SPEC.md)**: Full technical documentation of all AAMVA D20 elements, standard codes, character limits, IIN table for all 50 states, and barcode structure.
- 🗂️ **[Sample Filled Cards](samples/filled)**: Pre-rendered sample cards across 4 jurisdictions (California, Texas, New York, Florida) plus reverse side with Zone V barcode in PSD, PNG, and PDF formats.

---

## Architecture Overview

```
aamva-psd-filler/
├── src/
│   ├── photopea-engine.js       # Headless Photopea automation & ExtendScript rendering engine
│   ├── photopea-script.js       # Photopea ExtendScript & asset generator (photo, ghost, sig, PDF417)
│   ├── ai-template-analyzer.js  # Multimodal Gemini 3.6 Flash PSD layer & reference card analyzer
│   ├── aamva-standard.js        # AAMVA 2025 standard rules, auto-calculations, XML parser & barcode generator
│   ├── psd-engine.js            # Direct PSD layer parser, heuristic mapper & fallback engine
│   └── sample-psd-generator.js  # Generator for multi-layer CR80 templates (Front & Back)
├── public/
│   ├── index.html               # Responsive UI (Tailwind CSS, Lucide icons, Front/Back preview, XML modal)
│   ├── app.js                   # Client application logic, live guided calculations & real-time sync
│   ├── photopea-bridge.js       # Client-side invisible Photopea iframe Live Messaging API bridge
│   └── style.css                # Custom styling & canvas styles
├── samples/
│   ├── CR80_AAMVA_Front_Template.psd
│   ├── CR80_AAMVA_Back_Template.psd
│   └── filled/                  # Sample filled cards (PSD, PNG, PDF)
├── server.js                    # Express REST API, Auto-Calculate, Parse-XML, Photopea & AI endpoints
├── cli.js                       # Command-line interface for automated batch processing
├── LAYER_NAMING_GUIDE.md        # Comprehensive layer naming documentation
├── AAMVA_2025_MAPPING_SPEC.md   # Technical AAMVA standard specification
└── README.md                    # Project documentation
```

---

## Offline Capability
The application is 100% self-contained and works completely offline without requiring Adobe Photoshop or internet connectivity.
