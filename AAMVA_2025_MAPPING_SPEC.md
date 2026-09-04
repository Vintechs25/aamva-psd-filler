# AAMVA DL/ID Card Design & PDF417 Barcode Standard (2025 Specification)

This specification documents the complete **AAMVA 2025 DL/ID Card Design Standard (CDS)** and **AAMVA Personal Identification – AAMVA National Standard (D20)** implementation used by this application.

---

## 1. Physical Card Standard (ISO/IEC 7810 CR80)

| Specification | Metric | Imperial | Digital (300 DPI) | Digital (600 DPI) |
| :--- | :--- | :--- | :--- | :--- |
| **Card Width** | 85.60 mm | 3.370 in | 1012 px | 2024 px |
| **Card Height** | 53.98 mm | 2.125 in | 638 px | 1276 px |
| **Corner Radius** | 3.18 mm | 0.125 in | 38 px | 76 px |
| **Nominal Thickness**| 0.76 mm | 0.030 in | — | — |

### Physical Card Zones (Zones I - VII)
- **Zone I**: Header (Jurisdiction Name, Document Title, REAL ID compliance star indicator)
- **Zone II**: Primary Portrait Photo (frontal face view, uniform light background, min 1.0" × 1.25")
- **Zone III**: Primary Personal Data (Name, License #, Expiration, Issue, Date of Birth, Address)
- **Zone IV**: Secondary Demographics & Driving Privileges (Sex, Height, Eyes, Hair, Class, Endorsements, Restrictions)
- **Zone V**: Machine Readable Zone (Back of card, AAMVA PDF417 2D Barcode)
- **Zone VI**: Cardholder Signature (black or dark blue ink on high contrast background)
- **Zone VII**: Security Features (Ghost portrait, holographic foil, fine-line guilloché, UV ink, microprinting)

---

## 2. AAMVA PDF417 Barcode Structure (2025 Standard)

The 2D barcode on the reverse side of the card (Zone V) is formatted strictly according to the AAMVA D20 standard.

### A. Header Specification (31 Bytes)

```
Byte 0       : Compliance Indicator = '@' (0x40)
Byte 1       : Data Element Separator = LF / '\n' (0x0A)
Byte 2       : Record Separator = RS / '\x1e' (0x1E)
Byte 3       : Segment Terminator = CR / '\r' (0x0D)
Bytes 4-8    : File Type = 'ANSI ' (5 characters)
Bytes 9-14   : Issuer Identification Number (IIN) = 6 numeric digits (e.g. 636000)
Bytes 15-16  : AAMVA Standard Version Number = '11' (2025 standard) or '10' (2020 standard)
Bytes 17-18  : Jurisdiction Version Number = '00' (2 numeric digits)
Bytes 19-20  : Number of Subfiles = '01' (2 numeric digits)
Bytes 21-22  : Subfile Type = 'DL' (Driver License) or 'ID' (Identification Card)
Bytes 23-26  : Subfile Offset = '0031' (4 numeric digits, offset to subfile payload)
Bytes 27-30  : Subfile Length = '0230' (4 numeric digits, length of subfile data)
```

### B. Subfile Data Elements Structure
Following the header, the subfile data consists of:
`SubfileType + Element_1 + CR + Element_2 + CR + ... + Element_N + CR`

Each element consists of:
- **3-character Element ID** (e.g. `DCS`, `DAC`, `DBA`)
- **Data string** (ANSI uppercase characters)
- **Segment Terminator** (`CR` / `\r` / 0x0D)

---

## 3. AAMVA Data Elements Dictionary

### A. Mandatory Elements (Subfile 'DL' or 'ID')

| Element ID | Field Name | Data Type | Max Length | Format / Allowed Values |
| :--- | :--- | :--- | :--- | :--- |
| **DCS** | Customer Family Name (Last) | Alpha | 40 | Uppercase ANSI characters |
| **DAC** | Customer First Name | Alpha | 40 | Uppercase ANSI characters |
| **DAD** | Customer Middle Name | Alpha | 40 | Uppercase ANSI characters |
| **DBD** | Document Issue Date | Date | 8 | `CCYYMMDD` |
| **DBB** | Date of Birth | Date | 8 | `CCYYMMDD` |
| **DBA** | Customer Expiration Date | Date | 8 | `CCYYMMDD` |
| **DBC** | Customer Sex | Enum | 1 | `1` = Male, `2` = Female, `9` = Non-Binary / Not Specified |
| **DAY** | Customer Eye Color | Enum | 3 | `BLK`, `BLU`, `BRO`, `GRY`, `GRN`, `HAZ`, `MAR`, `PNK`, `DIC`, `UNK` |
| **DAU** | Customer Height | AlphaNum | 6 | `070 in` (inches) or `178 cm` (centimeters) |
| **DAG** | Address - Street Line 1 | AlphaNum | 35 | Uppercase street address |
| **DAI** | Address - City | AlphaNum | 20 | Uppercase city name |
| **DAJ** | Address - State / Jurisdiction | Alpha | 2 | 2-character postal abbreviation (e.g. `CA`, `TX`, `NY`) |
| **DAK** | Address - Postal / ZIP Code | AlphaNum | 11 | 5-digit (`90210`) or 9-digit (`902100000`) |
| **DAQ** | Customer ID / License Number | AlphaNum | 25 | Unique jurisdiction license or ID number |
| **DCF** | Document Discriminator | AlphaNum | 25 | Inventory / audit control number |
| **DCG** | Country Identification | Alpha | 3 | `USA` or `CAN` |
| **DDE** | Family Name Truncation | Enum | 1 | `T` = Truncated, `N` = Not Truncated, `U` = Unknown |
| **DDF** | First Name Truncation | Enum | 1 | `T` = Truncated, `N` = Not Truncated, `U` = Unknown |
| **DDG** | Middle Name Truncation | Enum | 1 | `T` = Truncated, `N` = Not Truncated, `U` = Unknown |
| **DCA** | Vehicle Class | AlphaNum | 6 | Jurisdiction-specific (e.g. `C`, `A`, `NONE`) |
| **DCB** | Restriction Codes | AlphaNum | 12 | Jurisdiction-specific (e.g. `CORRECTIVE LENSES`, `NONE`) |
| **DCD** | Endorsement Codes | AlphaNum | 5 | Jurisdiction-specific (e.g. `M`, `T`, `NONE`) |

---

### B. Optional & Enhanced Indicators

| Element ID | Field Name | Data Type | Max Length | Format / Allowed Values |
| :--- | :--- | :--- | :--- | :--- |
| **DAH** | Address - Street Line 2 | AlphaNum | 35 | Apartment, Suite, Unit |
| **DAZ** | Hair Color | Enum | 3 | `BAL`, `BLK`, `BLN`, `BRO`, `GRY`, `RED`, `SDH`, `WHI`, `UNK` |
| **DAW** | Weight | AlphaNum | 6 | e.g. `180 lb` |
| **DDA** | REAL ID Compliance Indicator | Enum | 1 | `M` = REAL ID Compliant, `N` = Non-Compliant, `E` = Enhanced (EDL) |
| **DDB** | Card Revision Date | Date | 8 | `CCYYMMDD` |
| **DDC** | HAZMAT Expiration Date | Date | 8 | `CCYYMMDD` |
| **DDD** | Limited Duration Indicator | Enum | 1 | `0` = Permanent Resident/Citizen, `1` = Temporary / Limited Duration |
| **DDK** | Organ Donor Indicator | Enum | 1 | `0` = No, `1` = Organ Donor |
| **DDL** | Veteran Indicator | Enum | 1 | `0` = No, `1` = Veteran |
| **DCN** | Non-Domiciled Indicator | Enum | 1 | `0` = No, `1` = Non-Domiciled |
| **DCO** | CDL Indicator | Enum | 1 | `0` = Non-CDL, `1` = Commercial Driver License |
| **DCP** | Permit Indicator | Enum | 1 | `0` = License, `1` = Learner Permit |

---

## 4. Issuer Identification Numbers (IIN) Table

| Jurisdiction | Code | IIN | Jurisdiction | Code | IIN |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Alabama** | AL | 636034 | **Montana** | MT | 636008 |
| **Alaska** | AK | 636059 | **Nebraska** | NE | 636054 |
| **Arizona** | AZ | 636026 | **Nevada** | NV | 636048 |
| **Arkansas** | AR | 636021 | **New Hampshire** | NH | 636036 |
| **California** | CA | 636000 | **New Jersey** | NJ | 636010 |
| **Colorado** | CO | 636020 | **New Mexico** | NM | 636009 |
| **Connecticut** | CT | 636006 | **New York** | NY | 636005 |
| **Delaware** | DE | 636011 | **North Carolina** | NC | 636004 |
| **District of Columbia**| DC | 636039 | **North Dakota** | ND | 636032 |
| **Florida** | FL | 636033 | **Ohio** | OH | 636023 |
| **Georgia** | GA | 636055 | **Oklahoma** | OK | 636058 |
| **Hawaii** | HI | 636047 | **Oregon** | OR | 636029 |
| **Idaho** | ID | 636049 | **Pennsylvania** | PA | 636025 |
| **Illinois** | IL | 636038 | **Rhode Island** | RI | 636052 |
| **Indiana** | IN | 636037 | **South Carolina** | SC | 636001 |
| **Iowa** | IA | 636018 | **South Dakota** | SD | 636042 |
| **Kansas** | KS | 636022 | **Tennessee** | TN | 636053 |
| **Kentucky** | KY | 636046 | **Texas** | TX | 636014 |
| **Louisiana** | LA | 636007 | **Utah** | UT | 636040 |
| **Maine** | ME | 636041 | **Vermont** | VT | 636024 |
| **Maryland** | MD | 636003 | **Virginia** | VA | 636015 |
| **Massachusetts** | MA | 636002 | **Washington** | WA | 636045 |
| **Michigan** | MI | 636030 | **West Virginia** | WV | 636061 |
| **Minnesota** | MN | 636035 | **Wisconsin** | WI | 636031 |
| **Mississippi** | MS | 636051 | **Wyoming** | WY | 636060 |
| **Missouri** | MO | 636027 | **Puerto Rico** | PR | 636017 |

---

## 5. Barcode Symbology Rules (PDF417)

- **Symbology**: PDF417 (ISO/IEC 15438)
- **Error Correction Level**: Level 5 (Recommended for AAMVA DL/ID cards to resist surface scratches)
- **Data Columns**: 12 to 16 data columns
- **Module Aspect Ratio**: 3:1 to 4:1 row height to module width ratio
- **Quiet Zones**: Minimum 4X horizontal quiet zone on leading and trailing edges
- **Print Contrast**: Black modules on solid white background (PCS > 0.80)
