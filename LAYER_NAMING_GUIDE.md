# PSD Layer Naming Guide for Automatic AAMVA Detection

This guide describes how to structure and name layers in any Photoshop (.psd) Driver License or State ID template to achieve **100% zero-configuration automatic detection** in the **AAMVA Auto DL/ID PSD Filler**.

---

## 1. Core Principles

1. **Keep Design Layers Protected**: Holograms, watermarks, guilloché waves, UV ink layers, and background textures are automatically protected as long as their layer name or layer group contains any security/background keywords (e.g. `Security`, `Holo`, `Watermark`, `Guilloche`, `UV`, `Pattern`, `Background`, `Seal`).
2. **Text Layers**: Must be native Photoshop Type layers (not rasterized). The application will read the font, font size, tracking, alignment, color, and layer bounds, and update only the text string.
3. **Image Layers (Photo, Ghost, Signature, Barcode)**: Can be raster layers, smart objects, or shape placeholders. The application scales the input image to fit the layer's bounding box.

---

## 2. Recommended Layer Names (AAMVA 2025 Standard)

### A. Personal Identity & Name (Zone III)

| Target Field | Recommended Layer Name | Recognized Aliases |
| :--- | :--- | :--- |
| **Family / Last Name** | `DCS_LastName` | `last_name`, `lastname`, `family_name`, `surname`, `ln` |
| **First Name** | `DAC_FirstName` | `first_name`, `firstname`, `given_name`, `fn` |
| **Middle Name** | `DAD_MiddleName` | `middle_name`, `middlename`, `mn` |
| **Full Combined Name** | `NAME_FULL` | `name`, `full_name`, `fullname`, `cardholder_name` |

> **Note**: If your card design displays the cardholder's full name on a single text line (e.g. `JANE MARIE DOE`), name that layer `NAME_FULL`. The engine will automatically concatenate First, Middle, and Last names into that single layer.

---

### B. Dates & Document Classification (Zone III)

| Target Field | Recommended Layer Name | Recognized Aliases |
| :--- | :--- | :--- |
| **License / ID Number** | `DAQ_LicenseNumber` | `license_no`, `license_num`, `lic_no`, `dl_number`, `id_number`, `document_no` |
| **Date of Birth** | `DBB_DateOfBirth` | `dob`, `date_of_birth`, `birth_date`, `birthdate` |
| **Expiration Date** | `DBA_ExpirationDate` | `exp`, `exp_date`, `expiration_date`, `expiry` |
| **Issue Date** | `DBD_IssueDate` | `iss`, `iss_date`, `issue_date`, `issued` |
| **Document Discriminator** | `DCF_Discriminator` | `discriminator`, `audit`, `dd`, `doc_discriminator` |

---

### C. Residential Address (Zone III)

| Target Field | Recommended Layer Name | Recognized Aliases |
| :--- | :--- | :--- |
| **Street Address Line 1** | `DAG_StreetAddress` | `street`, `street_address`, `address`, `addr1`, `address_line_1` |
| **Street Address Line 2** | `DAH_AddressLine2` | `street2`, `address_line_2`, `apt`, `suite`, `unit` |
| **City** | `DAI_City` | `city`, `town` |
| **State / Jurisdiction** | `DAJ_State` | `state`, `jurisdiction`, `st` |
| **ZIP / Postal Code** | `DAK_ZipCode` | `zip`, `zipcode`, `postal_code`, `postal` |
| **Combined City, State ZIP** | `CITY_STATE_ZIP` | `csz`, `city_st_zip`, `city_state_postal` |

> **Note**: If City, State, and ZIP appear together on one line (e.g. `LOS ANGELES, CA 90028`), name the layer `CITY_STATE_ZIP`.

---

### D. Physical Demographics & Descriptors (Zone IV)

| Target Field | Recommended Layer Name | Recognized Aliases |
| :--- | :--- | :--- |
| **Sex** | `DBC_Sex` | `sex`, `gender` |
| **Height** | `DAU_Height` | `height`, `hgt`, `ht` |
| **Weight** | `DAW_Weight` | `weight`, `wgt`, `wt` |
| **Eye Color** | `DAY_Eyes` | `eyes`, `eye_color`, `eye` |
| **Hair Color** | `DAZ_Hair` | `hair`, `hair_color` |

---

### E. Driving Privileges & Endorsements (Zone IV)

| Target Field | Recommended Layer Name | Recognized Aliases |
| :--- | :--- | :--- |
| **Vehicle Class** | `DCA_Class` | `class`, `vehicle_class`, `dl_class`, `cls` |
| **Restrictions** | `DCB_Restrictions` | `restrictions`, `rest`, `restriction` |
| **Endorsements** | `DCD_Endorsements` | `endorsements`, `end`, `endorsement` |
| **REAL ID Compliance** | `DDA_Compliance` | `compliance`, `real_id`, `realid` |
| **Organ Donor Indicator** | `DDK_OrganDonor` | `donor`, `organ_donor` |
| **Veteran Indicator** | `DDL_Veteran` | `veteran`, `vet` |

---

### F. Media & Barcode Zones (Zone II, Zone V, Zone VI, Zone VII)

| Target Field | Recommended Layer Name | Recognized Aliases |
| :--- | :--- | :--- |
| **Portrait Photo** | `Zone_II_Portrait` | `portrait`, `photo`, `picture`, `headshot`, `face`, `id_photo` |
| **Ghost Portrait** | `Ghost_Portrait` | `ghost_photo`, `ghost_face`, `secondary_photo` |
| **Signature** | `Zone_VI_Signature` | `signature`, `sig`, `cardholder_sig` |
| **Zone V Barcode** | `Zone_V_PDF417_Barcode` | `barcode`, `pdf417`, `2d_barcode`, `aamva_barcode`, `zone_v` |

---

## 3. Protected Security & Design Layer Keywords

Any layer whose name contains one of these keywords will be **automatically locked and protected**:

- `security`
- `hologram` / `holo`
- `watermark`
- `guilloche` / `fine_line`
- `uv` / `ultraviolet`
- `kinegram`
- `microtext` / `microprint`
- `seal` / `crest`
- `pattern`
- `background` / `bg`
- `ovd` / `optically`
- `overlay`
- `protect` / `do_not_edit`
- `star` / `real_id_star`

All layer masks, blend modes (`screen`, `multiply`, `overlay`, etc.), opacities, and clipping relationships on protected layers remain completely untouched.

---

## 4. Manual Override Flexibility

If a PSD template has unique or non-standard layer names, the application's **PSD Layer Intelligence Inspector** provides dropdown selectors for every detected layer, allowing you to manually map or unmap any layer before filling.
