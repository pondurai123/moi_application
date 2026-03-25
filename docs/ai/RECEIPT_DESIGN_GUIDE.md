# Receipt Design Reference Guide

## Color Palette

### Primary Gradient
- **Start:** `#667eea` (Medium Purple)
- **End:** `#764ba2` (Dark Purple)
- Used for: Header, Total Amount highlight, Labels

### Neutral Colors
- **Primary Text:** `#1a1a1a` (Near Black)
- **Secondary Text:** `#666` (Medium Gray)
- **Tertiary Text:** `#999` (Light Gray)
- **Accents:** `#aaa` (Lighter Gray)
- **Background:** `#fff` (White)
- **Box Background:** `#fafafa` (Off White)
- **Borders:** `#e0e0e0` (Light Gray)
- **Dividers:** `#f0f0f0` (Very Light Gray)

## Typography

### Font Stack
```css
font-family: 'Segoe UI', 'Helvetica Neue', sans-serif
```

### Size Hierarchy
- **Receipt Title:** 13px, Bold (900 weight)
- **Section Labels:** 11px, Bold (700 weight), Purple
- **Field Labels:** 8px, Regular, Gray, Uppercase
- **Content Text:** 9-10px, Regular
- **Total Amount:** 13px, Bold (800 weight), White on Gradient
- **Small Text:** 8px, Regular, Gray

### Spacing Standards
- **Receipt Width:** 80mm (thermal standard)
- **Padding:** 6mm all sides
- **Section Gap:** 8px
- **Line Height:** 1.5
- **Grid Gap:** 12px (for two-column layouts)

## Component Styles

### Header Section
```javascript
{
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#fff',
  padding: '8mm 6mm',
  margin: '-6mm -6mm 8mm -6mm',
  borderRadius: '0 0 8px 8px',
  textAlign: 'center',
}
```

### Divider
```javascript
{
  borderTop: '2px solid #e0e0e0',
  margin: '6px 0',
  padding: 0,
}
```

### Box Container
```javascript
{
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
  padding: '6px 8px',
  marginBottom: '8px',
  background: '#fafafa',
}
```

### Amount Highlight
```javascript
{
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#fff',
  padding: '8px',
  borderRadius: '6px',
  fontWeight: 800,
  fontSize: '13px',
  textAlign: 'center',
  margin: '6px 0',
}
```

### Section Label
```javascript
{
  textAlign: 'center',
  fontWeight: 700,
  color: '#667eea',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '6px',
}
```

## Layout Patterns

### Two-Column Grid
```javascript
{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
  fontSize: '9px',
}
```

### Field Layout
```
┌─────────────────────┐
│  Label (8px gray)   │
│  Content (9px bold) │
└─────────────────────┘
```

### Table Header
```javascript
{
  textAlign: 'left/center/right',
  padding: '6px 4px',
  color: '#999',
  fontSize: '8px',
  fontWeight: 600,
  textTransform: 'uppercase',
  borderBottom: '2px solid #e0e0e0',
}
```

### Table Data
```javascript
{
  padding: '6px 4px',
  borderBottom: '1px solid #f0f0f0',
}
```

## Responsive Adjustments

### For Different Receipt Widths

#### 80mm (Thermal - Default)
- Current implementation

#### A4 (210mm)
- Increase padding to 10mm
- Increase font sizes by 10-15%
- Adjust grid gaps to 16px

#### Mobile (80mm on narrow screens)
- Font sizes remain same
- Ensure readability with proper contrast
- Stack two-column grids vertically if needed

## Print CSS

### Page Setup
```css
@page {
  size: 80mm auto;
  margin: 0;
  padding: 0;
}

@media print {
  * {
    box-shadow: none !important;
    text-shadow: none !important;
  }
  
  body {
    margin: 0;
    padding: 0;
  }
}
```

## Icons & Symbols

- 📍 Location
- 📞 Phone
- 🙏 Thank you
- ₹ Currency
- × Multiplication

## Logo Specifications

### Recommended Dimensions
- **Max Width:** 24mm
- **Max Height:** 12mm
- **Format:** PNG (recommended) or JPG
- **Background:** Transparent (for PNG)
- **Style:** Works best with simple, clean logos

### In Header (White Background)
- Use logo with dark colors
- Or invert filter: `filter: 'brightness(0) invert(1)'`

### Logo Conversion
```typescript
// Automatic data URI conversion handles:
// - CORS issues
// - Same-origin policy
// - Cross-window printing
// - Image caching
```

## Best Practices

1. **Color Contrast**
   - All text meets WCAG AA standards
   - 4.5:1 ratio for body text
   - 3:1 ratio for large text

2. **Font Loading**
   - System fonts only (no web fonts for print reliability)
   - Fallback stack ensures compatibility

3. **Print Reliability**
   - Avoid shadows and transforms in print
   - Use solid colors with gradients for header
   - Test on target printer

4. **Data Accuracy**
   - All monetary values formatted to 2 decimals
   - Date/time in locale format (en-IN)
   - Unicode support for Tamil characters

## Customization Guide

To customize the receipt design, modify these in `ReceiptPrint.tsx`:

```typescript
// Change primary color
const headerStyle = {
  background: 'linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%)',
  // ... rest of styles
};

// Change fonts
const receiptStyle = {
  fontFamily: "'Your Font', sans-serif",
  // ... rest of styles
};

// Change padding
const receiptStyle = {
  padding: '8mm',  // Adjust as needed
  // ... rest of styles
};

// Change section gaps
const boxedStyle = {
  marginBottom: '10px',  // Increase for more space
  // ... rest of styles
};
```

---

**Last Updated:** March 17, 2026
**Version:** v2.0
**Designed for:** Thermal Printers (80mm) & Modern Browsers
