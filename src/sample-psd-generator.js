/**
 * Generates realistic multi-layer CR80 PSD templates for Front and Back of DL/ID Cards
 * Features guilloché patterns, holographic security overlays, microtext, and proper layer names.
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');
const { writePsd, initializeCanvas } = require('ag-psd');

initializeCanvas(createCanvas);

// Standard CR80 Card Dimensions at 300 DPI: 1012 x 638 pixels (3.375" x 2.125")
const CARD_WIDTH = 1012;
const CARD_HEIGHT = 638;

/**
 * Draws fine-line Guilloché waves on a canvas
 */
function drawGuilloche(ctx, width, height, color = 'rgba(59, 130, 246, 0.25)') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  for (let r = 0; r < 360; r += 12) {
    ctx.beginPath();
    for (let theta = 0; theta < Math.PI * 4; theta += 0.05) {
      const R = 180;
      const r_small = 45;
      const p = 55;
      const x = (R - r_small) * Math.cos(theta) + p * Math.cos((R - r_small) * theta / r_small) + width / 2;
      const y = (R - r_small) * Math.sin(theta) - p * Math.sin((R - r_small) * theta / r_small) + height / 2;
      if (theta === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Creates the Front DL/ID Card PSD Template
 */
function createFrontTemplate() {
  // 1. Base Background Canvas
  const bgCanvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const bgCtx = bgCanvas.getContext('2d');
  
  // Subtle gradient background
  const grad = bgCtx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  grad.addColorStop(0, '#f1f5f9');
  grad.addColorStop(0.5, '#e2e8f0');
  grad.addColorStop(1, '#cbd5e1');
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Top header banner
  const headerGrad = bgCtx.createLinearGradient(0, 0, CARD_WIDTH, 0);
  headerGrad.addColorStop(0, '#1e3a8a');
  headerGrad.addColorStop(1, '#2563eb');
  bgCtx.fillStyle = headerGrad;
  bgCtx.fillRect(0, 0, CARD_WIDTH, 110);

  // State title & card type
  bgCtx.fillStyle = '#ffffff';
  bgCtx.font = 'bold 36px Arial';
  bgCtx.fillText('CALIFORNIA', 40, 55);
  bgCtx.font = 'bold 18px Arial';
  bgCtx.fillStyle = '#93c5fd';
  bgCtx.fillText('DRIVER LICENSE', 40, 85);

  // 2. Guilloché Security Pattern Layer
  const secCanvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const secCtx = secCanvas.getContext('2d');
  drawGuilloche(secCtx, CARD_WIDTH, CARD_HEIGHT, 'rgba(30, 58, 138, 0.2)');

  // 3. Hologram Foil Overlay Layer
  const holoCanvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const holoCtx = holoCanvas.getContext('2d');
  const holoGrad = holoCtx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  holoGrad.addColorStop(0, 'rgba(236, 72, 153, 0.3)');
  holoGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.3)');
  holoGrad.addColorStop(0.6, 'rgba(59, 130, 246, 0.3)');
  holoGrad.addColorStop(1, 'rgba(16, 185, 129, 0.3)');
  holoCtx.fillStyle = holoGrad;
  
  // Holographic circular seals
  for (let i = 150; i < CARD_WIDTH; i += 300) {
    for (let j = 180; j < CARD_HEIGHT; j += 250) {
      holoCtx.beginPath();
      holoCtx.arc(i, j, 60, 0, Math.PI * 2);
      holoCtx.fill();
    }
  }

  // 4. REAL ID Gold Star Layer
  const starCanvas = createCanvas(60, 60);
  const starCtx = starCanvas.getContext('2d');
  starCtx.fillStyle = '#f59e0b';
  starCtx.beginPath();
  starCtx.arc(30, 30, 26, 0, Math.PI * 2);
  starCtx.fill();
  starCtx.fillStyle = '#ffffff';
  starCtx.beginPath();
  // Draw 5-pointed star
  for (let i = 0; i < 5; i++) {
    starCtx.lineTo(Math.cos((18 + i * 72) * 0.0174533) * 16 + 30,
                   -Math.sin((18 + i * 72) * 0.0174533) * 16 + 30);
    starCtx.lineTo(Math.cos((54 + i * 72) * 0.0174533) * 8 + 30,
                   -Math.sin((54 + i * 72) * 0.0174533) * 8 + 30);
  }
  starCtx.closePath();
  starCtx.fill();

  // 5. Zone II Portrait Photo Layer (Placeholder)
  const portraitCanvas = createCanvas(230, 290);
  const pCtx = portraitCanvas.getContext('2d');
  pCtx.fillStyle = '#cbd5e1';
  pCtx.fillRect(0, 0, 230, 290);
  pCtx.fillStyle = '#94a3b8';
  pCtx.beginPath();
  pCtx.arc(115, 110, 50, 0, Math.PI * 2); // Head
  pCtx.fill();
  pCtx.beginPath();
  pCtx.arc(115, 290, 100, Math.PI, 0, false); // Torso
  pCtx.fill();

  // 6. Ghost Portrait Layer
  const ghostCanvas = createCanvas(120, 150);
  const gCtx = ghostCanvas.getContext('2d');
  gCtx.fillStyle = 'rgba(148, 163, 184, 0.4)';
  gCtx.fillRect(0, 0, 120, 150);

  // 7. Zone VI Signature Layer
  const sigCanvas = createCanvas(300, 70);
  const sCtx = sigCanvas.getContext('2d');
  sCtx.strokeStyle = '#1e3a8a';
  sCtx.lineWidth = 2.5;
  sCtx.beginPath();
  sCtx.moveTo(20, 45);
  sCtx.bezierCurveTo(60, 10, 100, 60, 150, 30);
  sCtx.bezierCurveTo(190, 10, 220, 55, 280, 35);
  sCtx.stroke();

  // Construct Full Multi-Layer PSD Object
  const psd = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    channels: 3,
    bitsPerChannel: 8,
    colorMode: 3, // RGB
    children: [
      // Base Background
      {
        name: 'Background_Template',
        canvas: bgCanvas,
        top: 0,
        left: 0,
        bottom: CARD_HEIGHT,
        right: CARD_WIDTH
      },
      // Security Group (Protected)
      {
        name: 'Security_Features_Group',
        children: [
          {
            name: 'Guilloche_FineLine_Pattern',
            canvas: secCanvas,
            opacity: 0.6,
            blendMode: 'multiply',
            top: 0,
            left: 0,
            bottom: CARD_HEIGHT,
            right: CARD_WIDTH
          },
          {
            name: 'Holographic_Foil_Overlay',
            canvas: holoCanvas,
            opacity: 0.4,
            blendMode: 'screen',
            top: 0,
            left: 0,
            bottom: CARD_HEIGHT,
            right: CARD_WIDTH
          },
          {
            name: 'REAL_ID_Star_Emblem',
            canvas: starCanvas,
            top: 25,
            left: CARD_WIDTH - 90,
            bottom: 85,
            right: CARD_WIDTH - 30
          }
        ]
      },
      // Photo Zones
      {
        name: 'Zone_II_Portrait',
        canvas: portraitCanvas,
        top: 140,
        left: 45,
        bottom: 430,
        right: 275
      },
      {
        name: 'Ghost_Portrait',
        canvas: ghostCanvas,
        opacity: 0.4,
        blendMode: 'multiply',
        top: 450,
        left: CARD_WIDTH - 170,
        bottom: 600,
        right: CARD_WIDTH - 50
      },
      // Signature Zone
      {
        name: 'Zone_VI_Signature',
        canvas: sigCanvas,
        top: 480,
        left: 310,
        bottom: 550,
        right: 610
      },
      // Editable AAMVA Text Data Group
      {
        name: 'AAMVA_Data_Fields',
        children: [
          // License Number (DAQ)
          {
            name: 'DAQ_LicenseNumber',
            text: {
              text: 'D1234567',
              style: {
                font: { name: 'Arial-BoldMT' },
                fontSize: 28,
                fillColor: { r: 220, g: 38, b: 38 }
              }
            },
            top: 135,
            left: 310,
            bottom: 165,
            right: 600
          },
          // Expiration Date (DBA)
          {
            name: 'DBA_ExpirationDate',
            text: {
              text: '01/15/2030',
              style: {
                font: { name: 'Arial-BoldMT' },
                fontSize: 22,
                fillColor: { r: 220, g: 38, b: 38 }
              }
            },
            top: 135,
            left: 620,
            bottom: 165,
            right: 800
          },
          // Last Name (DCS)
          {
            name: 'DCS_LastName',
            text: {
              text: 'WARNER',
              style: {
                font: { name: 'Arial-BoldMT' },
                fontSize: 24,
                fillColor: { r: 15, g: 23, b: 42 }
              }
            },
            top: 185,
            left: 310,
            bottom: 215,
            right: 700
          },
          // First Name (DAC)
          {
            name: 'DAC_FirstName',
            text: {
              text: 'ELIZABETH',
              style: {
                font: { name: 'Arial-BoldMT' },
                fontSize: 22,
                fillColor: { r: 15, g: 23, b: 42 }
              }
            },
            top: 220,
            left: 310,
            bottom: 248,
            right: 650
          },
          // Middle Name (DAD)
          {
            name: 'DAD_MiddleName',
            text: {
              text: 'MARIE',
              style: {
                font: { name: 'ArialMT' },
                fontSize: 20,
                fillColor: { r: 15, g: 23, b: 42 }
              }
            },
            top: 252,
            left: 310,
            bottom: 278,
            right: 650
          },
          // Street Address (DAG)
          {
            name: 'DAG_StreetAddress',
            text: {
              text: '1428 ELM STREET APT 4B',
              style: {
                font: { name: 'ArialMT' },
                fontSize: 18,
                fillColor: { r: 30, g: 41, b: 59 }
              }
            },
            top: 288,
            left: 310,
            bottom: 312,
            right: 750
          },
          // City State Zip (CITY_STATE_ZIP)
          {
            name: 'CITY_STATE_ZIP',
            text: {
              text: 'LOS ANGELES, CA 90028',
              style: {
                font: { name: 'ArialMT' },
                fontSize: 18,
                fillColor: { r: 30, g: 41, b: 59 }
              }
            },
            top: 315,
            left: 310,
            bottom: 338,
            right: 750
          },
          // Date of Birth (DBB)
          {
            name: 'DBB_DateOfBirth',
            text: {
              text: '08/24/1992',
              style: {
                font: { name: 'Arial-BoldMT' },
                fontSize: 20,
                fillColor: { r: 15, g: 23, b: 42 }
              }
            },
            top: 355,
            left: 360,
            bottom: 380,
            right: 520
          },
          // Sex (DBC)
          {
            name: 'DBC_Sex',
            text: {
              text: 'F',
              style: {
                font: { name: 'ArialMT' },
                fontSize: 18,
                fillColor: { r: 15, g: 23, b: 42 }
              }
            },
            top: 390,
            left: 360,
            bottom: 412,
            right: 400
          },
          // Height (DAU)
          {
            name: 'DAU_Height',
            text: {
              text: '5\'-07"',
              style: {
                font: { name: 'ArialMT' },
                fontSize: 18,
                fillColor: { r: 15, g: 23, b: 42 }
              }
            },
            top: 390,
            left: 470,
            bottom: 412,
            right: 560
          },
          // Eyes (DAY)
          {
            name: 'DAY_Eyes',
            text: {
              text: 'BLU',
              style: {
                font: { name: 'ArialMT' },
                fontSize: 18,
                fillColor: { r: 15, g: 23, b: 42 }
              }
            },
            top: 390,
            left: 630,
            bottom: 412,
            right: 700
          },
          // Class (DCA)
          {
            name: 'DCA_Class',
            text: {
              text: 'C',
              style: {
                font: { name: 'Arial-BoldMT' },
                fontSize: 20,
                fillColor: { r: 15, g: 23, b: 42 }
              }
            },
            top: 425,
            left: 360,
            bottom: 450,
            right: 400
          },
          // Restrictions (DCB)
          {
            name: 'DCB_Restrictions',
            text: {
              text: 'CORRECTIVE LENSES',
              style: {
                font: { name: 'ArialMT' },
                fontSize: 16,
                fillColor: { r: 15, g: 23, b: 42 }
              }
            },
            top: 425,
            left: 470,
            bottom: 450,
            right: 720
          },
          // Issue Date (DBD)
          {
            name: 'DBD_IssueDate',
            text: {
              text: '08/24/2024',
              style: {
                font: { name: 'ArialMT' },
                fontSize: 18,
                fillColor: { r: 15, g: 23, b: 42 }
              }
            },
            top: 455,
            left: 360,
            bottom: 478,
            right: 520
          },
          // Document Discriminator (DCF)
          {
            name: 'DCF_Discriminator',
            text: {
              text: '7829104859203819',
              style: {
                font: { name: 'ArialMT' },
                fontSize: 14,
                fillColor: { r: 71, g: 85, b: 105 }
              }
            },
            top: 575,
            left: 310,
            bottom: 595,
            right: 600
          }
        ]
      }
    ]
  };

  const buffer = Buffer.from(writePsd(psd, { generateThumbnail: true }));
  return buffer;
}

/**
 * Creates the Back DL/ID Card PSD Template with Zone V Barcode
 */
function createBackTemplate() {
  // 1. Base Canvas
  const bgCanvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const bgCtx = bgCanvas.getContext('2d');
  
  bgCtx.fillStyle = '#f8fafc';
  bgCtx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Magnetic stripe band at top
  bgCtx.fillStyle = '#1e293b';
  bgCtx.fillRect(0, 30, CARD_WIDTH, 90);

  // Security pattern
  const secCanvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const secCtx = secCanvas.getContext('2d');
  drawGuilloche(secCtx, CARD_WIDTH, CARD_HEIGHT, 'rgba(100, 116, 139, 0.15)');

  // Zone V PDF417 Barcode placeholder canvas (standard AAMVA Zone V dimensions)
  const barcodePlaceholder = createCanvas(760, 240);
  const bCtx = barcodePlaceholder.getContext('2d');
  bCtx.fillStyle = '#ffffff';
  bCtx.fillRect(0, 0, 760, 240);
  bCtx.strokeStyle = '#94a3b8';
  bCtx.lineWidth = 2;
  bCtx.strokeRect(2, 2, 756, 236);
  bCtx.fillStyle = '#64748b';
  bCtx.font = '18px Arial';
  bCtx.fillText('Zone V - AAMVA 2025 PDF417 Barcode Area', 200, 125);

  const psd = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    channels: 3,
    bitsPerChannel: 8,
    colorMode: 3,
    children: [
      {
        name: 'Background_Template',
        canvas: bgCanvas,
        top: 0,
        left: 0,
        bottom: CARD_HEIGHT,
        right: CARD_WIDTH
      },
      {
        name: 'Security_Guilloche',
        canvas: secCanvas,
        opacity: 0.5,
        blendMode: 'multiply',
        top: 0,
        left: 0,
        bottom: CARD_HEIGHT,
        right: CARD_WIDTH
      },
      // Zone V Barcode Layer
      {
        name: 'Zone_V_PDF417_Barcode',
        canvas: barcodePlaceholder,
        top: 160,
        left: 126,
        bottom: 400,
        right: 886
      },
      // Standard Legal Disclaimer Text
      {
        name: 'Legal_Disclaimer_Text',
        text: {
          text: 'THIS CARD IS ISSUED AS A LICENSE TO OPERATE A MOTOR VEHICLE. PROPERTY OF STATE DMV.',
          style: {
            font: { name: 'ArialMT' },
            fontSize: 13,
            fillColor: { r: 51, g: 65, b: 85 }
          }
        },
        top: 440,
        left: 100,
        bottom: 465,
        right: 900
      },
      {
        name: 'DDK_OrganDonor_Text',
        text: {
          text: 'ORGAN DONOR',
          style: {
            font: { name: 'Arial-BoldMT' },
            fontSize: 16,
            fillColor: { r: 234, g: 88, b: 12 }
          }
        },
        top: 500,
        left: 100,
        bottom: 530,
        right: 350
      }
    ]
  };

  const buffer = Buffer.from(writePsd(psd, { generateThumbnail: true }));
  return buffer;
}

/**
 * Ensures sample templates directory exists and writes templates
 */
function ensureSampleTemplates(targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const frontPath = path.join(targetDir, 'CR80_AAMVA_Front_Template.psd');
  const backPath = path.join(targetDir, 'CR80_AAMVA_Back_Template.psd');

  if (!fs.existsSync(frontPath)) {
    const frontBuffer = createFrontTemplate();
    fs.writeFileSync(frontPath, frontBuffer);
    console.log(`Created sample front template: ${frontPath}`);
  }

  if (!fs.existsSync(backPath)) {
    const backBuffer = createBackTemplate();
    fs.writeFileSync(backPath, backBuffer);
    console.log(`Created sample back template: ${backPath}`);
  }

  return { frontPath, backPath };
}

module.exports = {
  CARD_WIDTH,
  CARD_HEIGHT,
  createFrontTemplate,
  createBackTemplate,
  ensureSampleTemplates
};
