# Receipt Format Specification

## Overview
After every gift contribution entry is saved, a receipt is printed for the contributor via a connected printer (browser Print API / thermal printer).

## Receipt Layout (80mm thermal format)

```
┌──────────────────────────────────┐
│          [SITE LOGO]             │
│                                  │
│  Function Name (e.g. Marriage)   │
│  Place: Madurai                  │
│  Phone: +91 98765 43210          │
│                                  │
│  Date: 15/03/2026  Time: 12:30  │
│                                  │
│  Receipt #: 1001                 │
│──────────────────────────────────│
│                                  │
│  Contributor: Ravi Kumar         │
│                                  │
│  Contributing Details            │
│  ────────────────────────────    │
│  ₹500  × 2  = ₹1,000           │
│  ₹1    × 1  = ₹1               │
│  ────────────────────────────    │
│  Total Price: ₹1,001            │
│                                  │
│  Typist: Suresh                  │
│                                  │
│  [Additional Text from Admin]    │
│──────────────────────────────────│
│  Company Brand Name              │
│  Contact Details                 │
│  (configurable in Admin Panel)   │
└──────────────────────────────────┘
```

## Data Fields
| Field | Source |
|-------|--------|
| Logo | Admin Settings → `logoUrl` |
| Function Name | function_types table (nameEn / nameTa based on language) |
| Place | weddings.location |
| Phone | weddings.phoneNumber OR settings.phone |
| Date/Time | Current date/time at print |
| Receipt # | Auto-generated sequential per event |
| Contributor Name | gifts.donorName |
| Denominations | User enters denomination × quantity pairs |
| Total Price | Sum of all denomination × quantity |
| Typist Name | typists.name |
| Additional Text | Admin Settings → `receiptAdditionalText` |
| Brand/Contact | Admin Settings → `brandName`, `brandContact` |

## Gift Entry Changes
Currently, a gift entry is just: `donorName`, `donorPlace`, `amount`.

With the receipt feature, the gift entry form needs:
- Donor Name
- Donor Place
- **Denomination rows**: denomination (₹500, ₹100, etc.) × quantity
- Total auto-calculated from denominations
- These denominations are stored as a JSON field or a child table

## Printing Mechanism
- **Browser Print API**: Use `window.print()` with a hidden receipt component
- Target a connected thermal/regular printer
- Receipt component is rendered in a hidden iframe/div and triggered to print
- The receipt page should have `@media print` CSS for proper formatting
- For thermal printers: set page size to 80mm width
