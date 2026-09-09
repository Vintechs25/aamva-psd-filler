/**
 * AAMVA DL/ID Card Design Standard (2025 Specification) & Barcode Engine
 * Fully compliant with AAMVA CDS / D20 standards.
 */

// Comprehensive IIN (Issuer Identification Number) Mapping Table
const JURISDICTION_IIN_MAP = {
  // US States & DC
  'AL': { name: 'Alabama', iin: '636034' },
  'AK': { name: 'Alaska', iin: '636059' },
  'AZ': { name: 'Arizona', iin: '636026' },
  'AR': { name: 'Arkansas', iin: '636021' },
  'CA': { name: 'California', iin: '636000' },
  'CO': { name: 'Colorado', iin: '636020' },
  'CT': { name: 'Connecticut', iin: '636006' },
  'DE': { name: 'Delaware', iin: '636011' },
  'DC': { name: 'District of Columbia', iin: '636039' },
  'FL': { name: 'Florida', iin: '636033' },
  'GA': { name: 'Georgia', iin: '636055' },
  'HI': { name: 'Hawaii', iin: '636047' },
  'ID': { name: 'Idaho', iin: '636049' },
  'IL': { name: 'Illinois', iin: '636038' },
  'IN': { name: 'Indiana', iin: '636037' },
  'IA': { name: 'Iowa', iin: '636018' },
  'KS': { name: 'Kansas', iin: '636022' },
  'KY': { name: 'Kentucky', iin: '636046' },
  'LA': { name: 'Louisiana', iin: '636007' },
  'ME': { name: 'Maine', iin: '636041' },
  'MD': { name: 'Maryland', iin: '636003' },
  'MA': { name: 'Massachusetts', iin: '636002' },
  'MI': { name: 'Michigan', iin: '636030' },
  'MN': { name: 'Minnesota', iin: '636035' },
  'MS': { name: 'Mississippi', iin: '636051' },
  'MO': { name: 'Missouri', iin: '636027' },
  'MT': { name: 'Montana', iin: '636008' },
  'NE': { name: 'Nebraska', iin: '636054' },
  'NV': { name: 'Nevada', iin: '636048' },
  'NH': { name: 'New Hampshire', iin: '636036' },
  'NJ': { name: 'New Jersey', iin: '636010' },
  'NM': { name: 'New Mexico', iin: '636009' },
  'NY': { name: 'New York', iin: '636005' },
  'NC': { name: 'North Carolina', iin: '636004' },
  'ND': { name: 'North Dakota', iin: '636032' },
  'OH': { name: 'Ohio', iin: '636023' },
  'OK': { name: 'Oklahoma', iin: '636058' },
  'OR': { name: 'Oregon', iin: '636029' },
  'PA': { name: 'Pennsylvania', iin: '636025' },
  'RI': { name: 'Rhode Island', iin: '636052' },
  'SC': { name: 'South Carolina', iin: '636001' },
  'SD': { name: 'South Dakota', iin: '636042' },
  'TN': { name: 'Tennessee', iin: '636053' },
  'TX': { name: 'Texas', iin: '636014' },
  'UT': { name: 'Utah', iin: '636040' },
  'VT': { name: 'Vermont', iin: '636024' },
  'VA': { name: 'Virginia', iin: '636015' },
  'WA': { name: 'Washington', iin: '636045' },
  'WV': { name: 'West Virginia', iin: '636061' },
  'WI': { name: 'Wisconsin', iin: '636031' },
  'WY': { name: 'Wyoming', iin: '636060' },
  // US Territories
  'PR': { name: 'Puerto Rico', iin: '636017' },
  'GU': { name: 'Guam', iin: '636019' },
  'VI': { name: 'Virgin Islands', iin: '636057' },
  // Canadian Provinces
  'ON': { name: 'Ontario', iin: '636012' },
  'QC': { name: 'Quebec', iin: '636013' },
  'BC': { name: 'British Columbia', iin: '636016' },
  'AB': { name: 'Alberta', iin: '636028' },
  'MB': { name: 'Manitoba', iin: '636043' },
  'SK': { name: 'Saskatchewan', iin: '636044' },
  'NS': { name: 'Nova Scotia', iin: '636050' },
  'NB': { name: 'New Brunswick', iin: '636056' }
};

// Complete AAMVA 2025 Data Elements Specification
const AAMVA_ELEMENTS = {
  // Mandatory Elements
  DCS: { id: 'DCS', name: 'Customer Family Name', zone: 'Zone III', mandatory: true, maxLen: 40, type: 'AN' },
  DAC: { id: 'DAC', name: 'Customer First Name', zone: 'Zone III', mandatory: true, maxLen: 40, type: 'AN' },
  DAD: { id: 'DAD', name: 'Customer Middle Name', zone: 'Zone III', mandatory: false, maxLen: 40, type: 'AN' },
  DBD: { id: 'DBD', name: 'Document Issue Date', zone: 'Zone III', mandatory: true, len: 8, type: 'DATE', format: 'CCYYMMDD' },
  DBB: { id: 'DBB', name: 'Date of Birth', zone: 'Zone III', mandatory: true, len: 8, type: 'DATE', format: 'CCYYMMDD' },
  DBA: { id: 'DBA', name: 'Customer Expiration Date', zone: 'Zone III', mandatory: true, len: 8, type: 'DATE', format: 'CCYYMMDD' },
  DBC: { id: 'DBC', name: 'Customer Sex', zone: 'Zone IV', mandatory: true, len: 1, type: 'ENUM', options: ['1', '2', '9'] }, // 1=M, 2=F, 9=Not specified
  DAY: { id: 'DAY', name: 'Customer Eye Color', zone: 'Zone IV', mandatory: true, len: 3, type: 'ENUM', options: ['BLK', 'BLU', 'BRO', 'GRY', 'GRN', 'HAZ', 'MAR', 'PNK', 'DIC', 'UNK'] },
  DAU: { id: 'DAU', name: 'Customer Height', zone: 'Zone IV', mandatory: true, maxLen: 6, type: 'HEIGHT' }, // e.g. "070 in" or "178 cm"
  DAG: { id: 'DAG', name: 'Address - Street 1', zone: 'Zone III', mandatory: true, maxLen: 35, type: 'AN' },
  DAI: { id: 'DAI', name: 'Address - City', zone: 'Zone III', mandatory: true, maxLen: 20, type: 'AN' },
  DAJ: { id: 'DAJ', name: 'Address - Jurisdiction Code', zone: 'Zone III', mandatory: true, len: 2, type: 'A' },
  DAK: { id: 'DAK', name: 'Address - Postal Code', zone: 'Zone III', mandatory: true, maxLen: 11, type: 'AN' },
  DAQ: { id: 'DAQ', name: 'Customer ID Number (License #)', zone: 'Zone III', mandatory: true, maxLen: 25, type: 'AN' },
  DCF: { id: 'DCF', name: 'Document Discriminator', zone: 'Zone III', mandatory: true, maxLen: 25, type: 'AN' },
  DCG: { id: 'DCG', name: 'Country Identification', zone: 'Zone III', mandatory: true, len: 3, type: 'A', default: 'USA' },
  DDE: { id: 'DDE', name: 'Family Name Truncation', zone: 'System', mandatory: true, len: 1, type: 'ENUM', options: ['T', 'N', 'U'] },
  DDF: { id: 'DDF', name: 'First Name Truncation', zone: 'System', mandatory: true, len: 1, type: 'ENUM', options: ['T', 'N', 'U'] },
  DDG: { id: 'DDG', name: 'Middle Name Truncation', zone: 'System', mandatory: true, len: 1, type: 'ENUM', options: ['T', 'N', 'U'] },
  DCA: { id: 'DCA', name: 'Jurisdiction Vehicle Class', zone: 'Zone IV', mandatory: true, maxLen: 6, type: 'AN', default: 'C' },
  DCB: { id: 'DCB', name: 'Jurisdiction Restriction Codes', zone: 'Zone IV', mandatory: true, maxLen: 12, type: 'AN', default: 'NONE' },
  DCD: { id: 'DCD', name: 'Jurisdiction Endorsement Codes', zone: 'Zone IV', mandatory: true, maxLen: 5, type: 'AN', default: 'NONE' },

  // Optional / Enhanced Elements
  DAH: { id: 'DAH', name: 'Address - Street 2', zone: 'Zone III', mandatory: false, maxLen: 35, type: 'AN' },
  DAZ: { id: 'DAZ', name: 'Hair Color', zone: 'Zone IV', mandatory: false, len: 3, type: 'ENUM', options: ['BAL', 'BLK', 'BLN', 'BRO', 'GRY', 'RED', 'SDH', 'WHI', 'UNK'] },
  DAW: { id: 'DAW', name: 'Weight (pounds)', zone: 'Zone IV', mandatory: false, maxLen: 6, type: 'AN' }, // e.g. "180 lb"
  DDA: { id: 'DDA', name: 'Compliance Type (REAL ID)', zone: 'Zone I', mandatory: false, len: 1, type: 'ENUM', options: ['M', 'N', 'E'] }, // M=REAL ID compliant, N=Non-compliant, E=Enhanced
  DDB: { id: 'DDB', name: 'Card Revision Date', zone: 'System', mandatory: false, len: 8, type: 'DATE' },
  DDC: { id: 'DDC', name: 'HAZMAT Expiration Date', zone: 'Zone IV', mandatory: false, len: 8, type: 'DATE' },
  DDD: { id: 'DDD', name: 'Limited Duration Indicator', zone: 'Zone III', mandatory: false, len: 1, type: 'ENUM', options: ['0', '1'] },
  DDK: { id: 'DDK', name: 'Organ Donor Indicator', zone: 'Zone IV', mandatory: false, len: 1, type: 'ENUM', options: ['0', '1'] },
  DDL: { id: 'DDL', name: 'Veteran Indicator', zone: 'Zone IV', mandatory: false, len: 1, type: 'ENUM', options: ['0', '1'] },
  DCN: { id: 'DCN', name: 'Non-Domiciled Indicator', zone: 'Zone III', mandatory: false, len: 1, type: 'ENUM', options: ['0', '1'] },
  DCO: { id: 'DCO', name: 'Commercial Driver License (CDL)', zone: 'Zone I', mandatory: false, len: 1, type: 'ENUM', options: ['0', '1'] },
  DCP: { id: 'DCP', name: 'Permit Indicator', zone: 'Zone I', mandatory: false, len: 1, type: 'ENUM', options: ['0', '1'] }
};

/**
 * Normalizes text to AAMVA uppercase ANSI character set
 */
function cleanAamvaText(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim().toUpperCase().replace(/[^A-Z0-9\s,\-\.\/#']/g, '');
}

/**
 * Normalizes dates to CCYYMMDD format
 */
function formatAamvaDate(val) {
  if (!val) return '';
  const cleaned = String(val).replace(/[^0-9]/g, '');
  if (cleaned.length === 8) {
    // If input is YYYYMMDD
    const y = parseInt(cleaned.slice(0, 4), 10);
    if (y > 1900 && y < 2100) return cleaned;
    // If input is MMDDYYYY
    const m = parseInt(cleaned.slice(0, 2), 10);
    const d = parseInt(cleaned.slice(2, 4), 10);
    const y2 = parseInt(cleaned.slice(4, 8), 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y2 > 1900) {
      return `${cleaned.slice(4, 8)}${cleaned.slice(0, 4)}`;
    }
  }
  // Try Date parse
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }
  return cleaned.slice(0, 8);
}

/**
 * Converts CCYYMMDD date to human display format MM/DD/YYYY
 */
function formatDisplayDate(ccyymmdd) {
  if (!ccyymmdd || ccyymmdd.length !== 8) return ccyymmdd || '';
  const yyyy = ccyymmdd.slice(0, 4);
  const mm = ccyymmdd.slice(4, 6);
  const dd = ccyymmdd.slice(6, 8);
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Formats height to AAMVA standard "070 in" or feet/inches
 */
function formatAamvaHeight(feetOrTotalInches, inchesPart) {
  if (inchesPart !== undefined && inchesPart !== null && inchesPart !== '') {
    const totalInches = (parseInt(feetOrTotalInches, 10) * 12) + parseInt(inchesPart, 10);
    return `${String(totalInches).padStart(3, '0')} in`;
  }
  const clean = String(feetOrTotalInches || '').trim();
  if (/^\d{3}\s*(in|cm)$/i.test(clean)) return clean.toLowerCase();
  const num = parseInt(clean.replace(/\D/g, ''), 10);
  if (num > 0) {
    return `${String(num).padStart(3, '0')} in`;
  }
  return '068 in';
}

/**
 * Generates an AAMVA 2025 compliant PDF417 raw text payload
 * @param {Object} data Key-value pairs for AAMVA fields
 * @param {Object} options Configuration overrides
 * @returns {string} Raw barcode string
 */
function generateAamvaBarcodePayload(data, options = {}) {
  const LF = '\n';
  const RS = '\x1e';
  const CR = '\r';

  const jurisdiction = (data.DAJ || data.state || 'CA').toUpperCase();
  const jurisInfo = JURISDICTION_IIN_MAP[jurisdiction] || { iin: '636000' };
  const iin = options.iin || jurisInfo.iin;
  
  // AAMVA 2025 version identifier: '11' (2025 standard) or '10' (2020 standard)
  const aamvaVersion = options.aamvaVersion || '11';
  const jurisdictionVersion = options.jurisdictionVersion || '00';
  const subfileCount = '01';
  const subfileType = data.documentType === 'ID' ? 'ID' : 'DL';

  // Prepare normalized fields
  const lastName = cleanAamvaText(data.DCS || data.lastName || data.familyName || 'DOE');
  const firstName = cleanAamvaText(data.DAC || data.firstName || data.givenName || 'JANE');
  const middleName = cleanAamvaText(data.DAD || data.middleName || '');
  
  const dob = formatAamvaDate(data.DBB || data.dob || data.birthDate || '19950115');
  const exp = formatAamvaDate(data.DBA || data.expDate || data.expirationDate || '20300115');
  const iss = formatAamvaDate(data.DBD || data.issueDate || '20250115');

  const sex = String(data.DBC || data.sex || data.gender || '2'); // 1=M, 2=F, 9=X
  const eyes = cleanAamvaText(data.DAY || data.eyes || data.eyeColor || 'BRO').slice(0, 3) || 'BRO';
  const height = formatAamvaHeight(data.DAU || data.height || '066 in');
  
  const street = cleanAamvaText(data.DAG || data.address || data.street || '100 STATE CAPITOL WAY');
  const city = cleanAamvaText(data.DAI || data.city || 'SACRAMENTO');
  const state = jurisdiction;
  const zip = cleanAamvaText(data.DAK || data.zip || data.postalCode || '958140000').slice(0, 11);
  const dlNumber = cleanAamvaText(data.DAQ || data.licenseNumber || data.idNumber || 'D1234567');
  const discriminator = cleanAamvaText(data.DCF || data.discriminator || data.audit || '0102030405060708');
  const country = cleanAamvaText(data.DCG || data.country || 'USA').slice(0, 3);

  // Truncation flags: T if truncated, N if not
  const dde = (lastName.length > 40 || data.DDE === 'T') ? 'T' : 'N';
  const ddf = (firstName.length > 40 || data.DDF === 'T') ? 'T' : 'N';
  const ddg = (middleName.length > 40 || data.DDG === 'T') ? 'T' : 'N';

  const vClass = cleanAamvaText(data.DCA || data.class || 'C');
  const restrictions = cleanAamvaText(data.DCB || data.restrictions || 'NONE');
  const endorsements = cleanAamvaText(data.DCD || data.endorsements || 'NONE');

  // Build element array in AAMVA D20 recommended order
  // Name fields first (DCS, DAC, DAD)
  const elements = [
    `DCS${lastName.slice(0, 40)}`,
    `DAC${firstName.slice(0, 40)}`
  ];

  if (middleName) {
    elements.push(`DAD${middleName.slice(0, 40)}`);
  }
  
  // Date fields (DBD, DBB, DBA)
  elements.push(`DBD${iss}`);
  elements.push(`DBB${dob}`);
  elements.push(`DBA${exp}`);
  
  // Demographic fields (DBC, DAY, DAU, DAZ, DAW)
  elements.push(`DBC${sex}`);
  elements.push(`DAY${eyes}`);
  elements.push(`DAU${height}`);

  if (data.DAZ || data.hair) {
    elements.push(`DAZ${cleanAamvaText(data.DAZ || data.hair).slice(0, 3)}`);
  }
  
  if (data.DAW || data.weight) {
    const w = cleanAamvaText(data.DAW || data.weight);
    elements.push(`DAW${w.includes('LB') ? w : `${w} lb`}`);
  }
  
  // Address fields (DAG, DAH, DAI, DAJ, DAK)
  elements.push(`DAG${street.slice(0, 35)}`);

  if (data.DAH || data.address2) {
    elements.push(`DAH${cleanAamvaText(data.DAH || data.address2).slice(0, 35)}`);
  }

  elements.push(`DAI${city.slice(0, 20)}`);
  elements.push(`DAJ${state}`);
  elements.push(`DAK${zip}`);
  
  // ID and discriminator fields (DAQ, DCF, DCG)
  elements.push(`DAQ${dlNumber.slice(0, 25)}`);
  elements.push(`DCF${discriminator.slice(0, 25)}`);
  elements.push(`DCG${country}`);
  
  // Truncation flags (DDE, DDF, DDG)
  elements.push(`DDE${dde}`);
  elements.push(`DDF${ddf}`);
  elements.push(`DDG${ddg}`);
  
  // Vehicle class and endorsements (DCA, DCB, DCD)
  elements.push(`DCA${vClass}`);
  elements.push(`DCB${restrictions}`);
  elements.push(`DCD${endorsements}`);

  // Optional Enhanced Fields
  if (data.DDA || data.complianceType) {
    elements.push(`DDA${data.DDA || data.complianceType}`);
  }
  if (data.DDB || data.revisionDate) {
    elements.push(`DDB${formatAamvaDate(data.DDB || data.revisionDate)}`);
  }
  if (data.DDD !== undefined && data.DDD !== '') {
    elements.push(`DDD${data.DDD}`);
  }
  if (data.DDK !== undefined && data.DDK !== '') {
    elements.push(`DDK${data.DDK}`);
  }
  if (data.DDL !== undefined && data.DDL !== '') {
    elements.push(`DDL${data.DDL}`);
  }
  if (data.DCN !== undefined && data.DCN !== '') {
    elements.push(`DCN${data.DCN}`);
  }
  if (data.DCO !== undefined && data.DCO !== '') {
    elements.push(`DCO${data.DCO}`);
  }
  if (data.DCP !== undefined && data.DCP !== '') {
    elements.push(`DCP${data.DCP}`);
  }

  // Construct Subfile Data
  // Subfile data consists of elements separated by CR, ending with CR (subfile type is in header designator only)
  const subfileBody = elements.join(CR) + CR;

  // Header length is 21 bytes (fixed) + 10 bytes per subfile designator
  // Offset to Subfile: 0031
  const headerPrefix = '@' + LF + RS + CR; // 4 bytes
  const headerMeta = 'ANSI ' + iin + aamvaVersion + jurisdictionVersion + subfileCount; // 5 + 6 + 2 + 2 + 2 = 17 bytes
  const subfileDesignatorLength = 10;
  const headerTotalLength = headerPrefix.length + headerMeta.length + subfileDesignatorLength; // 31 bytes

  const offsetStr = String(headerTotalLength).padStart(4, '0');
  const lengthStr = String(subfileBody.length).padStart(4, '0');

  const subfileDesignator = subfileType + offsetStr + lengthStr;
  const header = headerPrefix + headerMeta + subfileDesignator;

  return header + subfileBody;
}

/**
 * Decodes and parses raw AAMVA PDF417 string payload into structured object
 * Useful for validation, verification, and reverse inspection
 */
function decodeAamvaBarcode(raw) {
  const result = {
    isValid: false,
    header: {},
    elements: {},
    errors: []
  };

  if (!raw || typeof raw !== 'string') {
    result.errors.push('Empty or invalid barcode string');
    return result;
  }

  if (!raw.startsWith('@')) {
    result.errors.push('Missing AAMVA compliance indicator (@)');
  }

  // Check header components
  const match = raw.match(/^@[\n\r\x1e\x00-\x20]*ANSI\s*([0-9]{6})([0-9]{2})([0-9]{2})([0-9]{2})([A-Z]{2})([0-9]{4})([0-9]{4})/);
  if (match) {
    result.header = {
      iin: match[1],
      aamvaVersion: match[2],
      jurisdictionVersion: match[3],
      subfileCount: parseInt(match[4], 10),
      subfileType: match[5],
      offset: parseInt(match[6], 10),
      length: parseInt(match[7], 10)
    };
  }

  // Parse element tags (3 uppercase letters e.g. DCS, DAC, etc. followed by data until CR or LF)
  const regex = /([DZ][A-Z]{2})([^\r\n]*)/g;
  let m;
  while ((m = regex.exec(raw)) !== null) {
    const tag = m[1];
    const val = m[2];
    result.elements[tag] = val;
  }

  result.isValid = Object.keys(result.elements).length >= 8;
  return result;
}

/**
 * Validates form data against AAMVA 2025 standard
 */
function validateAamvaData(data) {
  const errors = [];
  const warnings = [];

  // Check mandatory fields
  const required = [
    { key: 'DCS', name: 'Family / Last Name', alt: 'lastName' },
    { key: 'DAC', name: 'First Name', alt: 'firstName' },
    { key: 'DBB', name: 'Date of Birth', alt: 'dob' },
    { key: 'DBA', name: 'Expiration Date', alt: 'expDate' },
    { key: 'DBD', name: 'Issue Date', alt: 'issueDate' },
    { key: 'DBC', name: 'Sex / Gender', alt: 'sex' },
    { key: 'DAY', name: 'Eye Color', alt: 'eyes' },
    { key: 'DAU', name: 'Height', alt: 'height' },
    { key: 'DAG', name: 'Street Address', alt: 'address' },
    { key: 'DAI', name: 'City', alt: 'city' },
    { key: 'DAJ', name: 'State / Jurisdiction', alt: 'state' },
    { key: 'DAK', name: 'ZIP / Postal Code', alt: 'zip' },
    { key: 'DAQ', name: 'License / ID Number', alt: 'licenseNumber' }
  ];

  for (const item of required) {
    const val = data[item.key] || data[item.alt];
    if (!val || String(val).trim() === '') {
      errors.push(`Mandatory field missing: ${item.name} (${item.key})`);
    }
  }

  // Date validations
  const dob = formatAamvaDate(data.DBB || data.dob);
  const exp = formatAamvaDate(data.DBA || data.expDate);
  const iss = formatAamvaDate(data.DBD || data.issueDate);

  if (dob && dob.length !== 8) {
    errors.push('Date of Birth must be 8 digits (CCYYMMDD)');
  }
  if (exp && exp.length !== 8) {
    errors.push('Expiration Date must be 8 digits (CCYYMMDD)');
  }
  if (iss && iss.length !== 8) {
    errors.push('Issue Date must be 8 digits (CCYYMMDD)');
  }

  if (dob && exp && dob > exp) {
    errors.push('Date of Birth cannot be after Expiration Date');
  }

  // Sex validation
  const sex = String(data.DBC || data.sex || '');
  if (sex && !['1', '2', '9', 'M', 'F', 'X'].includes(sex.toUpperCase())) {
    warnings.push('Sex code should be 1 (Male), 2 (Female), or 9 (Non-Binary / Not Specified)');
  }

  // Eye color validation
  const eyes = (data.DAY || data.eyes || '').toUpperCase();
  if (eyes && !['BLK', 'BLU', 'BRO', 'GRY', 'GRN', 'HAZ', 'MAR', 'PNK', 'DIC', 'UNK'].includes(eyes)) {
    warnings.push(`Non-standard eye color code: ${eyes}. Recommended: BLK, BLU, BRO, GRY, GRN, HAZ.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Built-in presets for quick-filling realistic, standard-compliant test cards
const PRESET_PROFILES = {
  california_real_id: {
    id: 'california_real_id',
    title: 'California Driver License (REAL ID Compliant)',
    data: {
      DAJ: 'CA',
      DCS: 'WARNER',
      DAC: 'ELIZABETH',
      DAD: 'MARIE',
      DBB: '19920824',
      DBA: '20290824',
      DBD: '20240824',
      DBC: '2', // Female
      DAY: 'BLU',
      DAZ: 'BLN',
      DAU: '067 in',
      DAW: '135 lb',
      DAG: '1428 ELM STREET APT 4B',
      DAI: 'LOS ANGELES',
      DAK: '900280000',
      DAQ: 'D8492015',
      DCF: '7829104859203819',
      DCG: 'USA',
      DCA: 'C',
      DCB: 'CORRECTIVE LENSES',
      DCD: 'NONE',
      DDA: 'M', // REAL ID compliant
      DDK: '1', // Organ donor
      DDL: '0',
      documentType: 'DL'
    }
  },
  texas_cdl: {
    id: 'texas_cdl',
    title: 'Texas Commercial Driver License (Class A CDL)',
    data: {
      DAJ: 'TX',
      DCS: 'RODRIGUEZ',
      DAC: 'CARLOS',
      DAD: 'JAVIER',
      DBB: '19840412',
      DBA: '20300412',
      DBD: '20250412',
      DBC: '1', // Male
      DAY: 'BRO',
      DAZ: 'BLK',
      DAU: '071 in',
      DAW: '195 lb',
      DAG: '8302 COMMERCE PARKWAY',
      DAI: 'HOUSTON',
      DAK: '770020000',
      DAQ: '28409184',
      DCF: '9482019485720194',
      DCG: 'USA',
      DCA: 'A',
      DCB: 'NONE',
      DCD: 'T N', // Double/triple trailers, Tanker
      DDA: 'M',
      DCO: '1', // CDL
      DDK: '1',
      DDL: '1', // Veteran
      documentType: 'DL'
    }
  },
  newyork_edl: {
    id: 'newyork_edl',
    title: 'New York Enhanced Driver License (EDL)',
    data: {
      DAJ: 'NY',
      DCS: 'SULLIVAN',
      DAC: 'MICHAEL',
      DAD: 'PATRICK',
      DBB: '19881103',
      DBA: '20281103',
      DBD: '20241103',
      DBC: '1', // Male
      DAY: 'GRN',
      DAZ: 'BRO',
      DAU: '073 in',
      DAW: '185 lb',
      DAG: '550 LEXINGTON AVENUE',
      DAI: 'NEW YORK',
      DAK: '100220000',
      DAQ: '938201948',
      DCF: '1029384756102938',
      DCG: 'USA',
      DCA: 'D',
      DCB: 'NONE',
      DCD: 'NONE',
      DDA: 'E', // Enhanced
      DDK: '1',
      DDL: '0',
      documentType: 'DL'
    }
  },
  florida_id: {
    id: 'florida_id',
    title: 'Florida State Identification Card (REAL ID)',
    data: {
      DAJ: 'FL',
      DCS: 'HENDERSON',
      DAC: 'SARAH',
      DAD: 'ANN',
      DBB: '20010319',
      DBA: '20290319',
      DBD: '20250319',
      DBC: '2', // Female
      DAY: 'HAZ',
      DAZ: 'BRO',
      DAU: '064 in',
      DAW: '125 lb',
      DAG: '220 OCEAN DRIVE SUITE 12',
      DAI: 'MIAMI BEACH',
      DAK: '331390000',
      DAQ: 'H53029481920',
      DCF: '6473829104859201',
      DCG: 'USA',
      DCA: 'NONE',
      DCB: 'NONE',
      DCD: 'NONE',
      DDA: 'M',
      DDK: '1',
      DDL: '0',
      documentType: 'ID'
    }
  }
};

/**
 * Parses XML data format (such as barcode scanner output) into standard AAMVA fields
 */
function parseAamvaXml(xmlString) {
  if (!xmlString || typeof xmlString !== 'string') return {};
  const data = {};

  // Match <element id="DCS" ...>VALUE</element>
  const elemRegex = /<element\s+id="([A-Z0-9]{3})"[^>]*>([\s\S]*?)<\/element>/gi;
  let m;
  while ((m = elemRegex.exec(xmlString)) !== null) {
    const key = m[1].toUpperCase();
    const val = m[2].trim();
    if (val && !data[key]) data[key] = val;
  }

  // Match <last e="DCS">VALUE</last>
  const attrRegex = /<[a-z0-9_-]+\s+e="([A-Z0-9]{3})"[^>]*>([\s\S]*?)<\/[a-z0-9_-]+>/gi;
  while ((m = attrRegex.exec(xmlString)) !== null) {
    const key = m[1].toUpperCase();
    const val = m[2].trim();
    if (val && !data[key]) data[key] = val;
  }

  return data;
}

const JURISDICTION_VALIDITY_YEARS = {
  TX: 8,
  CA: 5,
  NY: 8,
  FL: 8,
  IL: 4,
  PA: 4,
  OH: 4,
  WA: 6,
  GA: 8,
  NC: 8,
  DEFAULT: 5
};

/**
 * Calculates document expiration date based on cardholder DOB, Issue Date, and Jurisdiction cycle.
 * In the AAMVA standard, IDs/DLs expire on the cardholder's birthday.
 */
function calculateExpirationDate(dobInput, issueDateInput, jurisdiction = 'TX') {
  const dobClean = formatAamvaDate(dobInput);
  const issClean = formatAamvaDate(issueDateInput) || (() => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  })();

  if (!dobClean || dobClean.length < 8) return '';
  const birthMonth = dobClean.slice(4, 6);
  const birthDay = dobClean.slice(6, 8);

  const issueYear = parseInt(issClean.slice(0, 4), 10) || new Date().getFullYear();
  const years = JURISDICTION_VALIDITY_YEARS[(jurisdiction || '').toUpperCase()] || JURISDICTION_VALIDITY_YEARS.DEFAULT;

  const expYear = issueYear + years;
  return `${expYear}${birthMonth}${birthDay}`;
}

/**
 * Generates an authentic Document Discriminator (DCF) tailored to state format.
 */
function generateDocumentDiscriminator(jurisdiction = 'TX', issueDateInput = '', licenseNumber = '') {
  const state = (jurisdiction || 'TX').toUpperCase();
  const iss = formatAamvaDate(issueDateInput) || (() => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  })();

  if (state === 'TX') {
    // Texas DD is 16-20 numeric digits
    let randPart = '';
    for (let i = 0; i < 16; i++) randPart += Math.floor(Math.random() * 10);
    return randPart;
  } else if (state === 'CA') {
    // California DD: MM/DD/YYYY + 3 digits + letter + 1 digit + / + 4 letters + / + 2 digits
    const mm = iss.slice(4, 6);
    const dd = iss.slice(6, 8);
    const yyyy = iss.slice(0, 4);
    const code1 = Math.floor(100 + Math.random() * 900);
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const let1 = letters[Math.floor(Math.random() * letters.length)];
    const digit1 = Math.floor(Math.random() * 10);
    const fourLetters = Array.from({length: 4}, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    const twoDigits = String(Math.floor(10 + Math.random() * 90));
    return `${mm}/${dd}/${yyyy}${code1}${let1}${digit1}/${fourLetters}/${twoDigits}`;
  } else if (state === 'NY' || state === 'FL') {
    let num = '';
    for (let i = 0; i < 16; i++) num += Math.floor(Math.random() * 10);
    return num;
  } else {
    // Generic 16-digit audit number
    let num = '';
    for (let i = 0; i < 16; i++) num += Math.floor(Math.random() * 10);
    return num;
  }
}

/**
 * Normalizes user height input ("5'9"", "69", "5 9") to AAMVA format ("069 in")
 */
function normalizeHeightInput(val) {
  if (!val) return '068 in';
  const str = String(val).trim();
  const ftInMatch = str.match(/^(\d)['\-\s]+(\d{1,2})["']?$/);
  if (ftInMatch) {
    const ft = parseInt(ftInMatch[1], 10);
    const inches = parseInt(ftInMatch[2], 10);
    return `${String(ft * 12 + inches).padStart(3, '0')} in`;
  }
  const numMatch = str.match(/^(\d{2,3})$/);
  if (numMatch) {
    return `${numMatch[1].padStart(3, '0')} in`;
  }
  const inMatch = str.match(/^(\d{2,3})\s*in$/i);
  if (inMatch) {
    return `${inMatch[1].padStart(3, '0')} in`;
  }
  return formatAamvaHeight(val);
}

/**
 * Normalizes user weight input ("205", "205lb") to "205 lb"
 */
function normalizeWeightInput(val) {
  if (!val) return '160 lb';
  const clean = String(val).replace(/[^0-9]/g, '');
  if (clean) return `${clean} lb`;
  return '160 lb';
}

/**
 * Auto-calculates and enriches all missing or derivable fields in a cardholder record.
 */
function calculateAutoFields(inputData = {}) {
  const data = { ...inputData };
  const modifications = [];

  // 1. Issue Date (DBD) - default to today if missing
  if (!data.DBD && !data.issueDate) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    data.DBD = `${yyyy}${mm}${dd}`;
    modifications.push({ field: 'DBD', value: data.DBD, reason: 'Defaulted Issue Date to today' });
  }

  // 2. Expiration Date (DBA) - calculate from DOB, Issue Date, and Jurisdiction
  if (data.DBB || data.dob) {
    const calcExp = calculateExpirationDate(data.DBB || data.dob, data.DBD || data.issueDate, data.DAJ || data.state);
    if (calcExp && (!data.DBA || data.autoCalcExpiry)) {
      data.DBA = calcExp;
      modifications.push({ field: 'DBA', value: calcExp, reason: `Calculated Expiration Date for ${data.DAJ || 'state'} cycle (${calcExp})` });
    }
  }

  // 3. Document Discriminator (DCF) - generate if missing
  if (!data.DCF || String(data.DCF).trim() === '') {
    data.DCF = generateDocumentDiscriminator(data.DAJ || data.state, data.DBD || data.issueDate, data.DAQ || data.licenseNumber);
    modifications.push({ field: 'DCF', value: data.DCF, reason: `Generated state-compliant DCF audit number (${data.DCF})` });
  }

  // 4. Country (DCG)
  if (!data.DCG) {
    data.DCG = 'USA';
    modifications.push({ field: 'DCG', value: 'USA', reason: 'Defaulted country to USA' });
  }

  // 5. Vehicle Class (DCA), Restrictions (DCB), Endorsements (DCD)
  if (!data.DCA) {
    data.DCA = data.documentType === 'ID' ? 'NONE' : 'C';
    modifications.push({ field: 'DCA', value: data.DCA, reason: `Set vehicle class to ${data.DCA}` });
  }
  if (!data.DCB) {
    data.DCB = 'NONE';
    modifications.push({ field: 'DCB', value: 'NONE', reason: 'Defaulted restrictions to NONE' });
  }
  if (!data.DCD) {
    data.DCD = 'NONE';
    modifications.push({ field: 'DCD', value: 'NONE', reason: 'Defaulted endorsements to NONE' });
  }

  // 6. Height (DAU) & Weight (DAW) formatting
  if (data.DAU) {
    const normH = normalizeHeightInput(data.DAU);
    if (normH !== data.DAU) {
      data.DAU = normH;
      modifications.push({ field: 'DAU', value: normH, reason: `Normalized height to ${normH}` });
    }
  }
  if (data.DAW) {
    const normW = normalizeWeightInput(data.DAW);
    if (normW !== data.DAW) {
      data.DAW = normW;
      modifications.push({ field: 'DAW', value: normW, reason: `Normalized weight to ${normW}` });
    }
  }

  // 7. REAL ID Compliance (DDA)
  if (!data.DDA) {
    data.DDA = 'M';
  }

  // 8. Truncation flags
  const lastName = data.DCS || data.lastName || '';
  const firstName = data.DAC || data.firstName || '';
  const middleName = data.DAD || data.middleName || '';
  data.DDE = lastName.length > 40 ? 'T' : 'N';
  data.DDF = firstName.length > 40 ? 'T' : 'N';
  data.DDG = middleName.length > 40 ? 'T' : 'N';

  return { data, modifications };
}

module.exports = {
  JURISDICTION_IIN_MAP,
  JURISDICTION_VALIDITY_YEARS,
  AAMVA_ELEMENTS,
  cleanAamvaText,
  formatAamvaDate,
  formatDisplayDate,
  formatAamvaHeight,
  generateAamvaBarcodePayload,
  decodeAamvaBarcode,
  validateAamvaData,
  parseAamvaXml,
  calculateExpirationDate,
  generateDocumentDiscriminator,
  normalizeHeightInput,
  normalizeWeightInput,
  calculateAutoFields,
  PRESET_PROFILES
};
