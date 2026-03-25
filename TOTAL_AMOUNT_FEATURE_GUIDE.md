# Gift Collection - Total Amount Feature Guide

## 🎯 Quick Start Guide

### Two Ways to Enter Gifts

#### ✅ **NEW: Total Amount Mode**
Best for when you know the total amount and want to break it down by denominations.

**Steps:**
1. Enter Donor Name: "Ravi Kumar"
2. Enter Place: "Chennai"  
3. ✅ Check: "Collect by Total Amount"
4. Enter Total Amount: ₹5000
5. Select quantities for each denomination:
   ```
   ₹500 → Enter: 10 → Calculates: ₹5000
   ₹200 → Enter: 0
   ₹100 → Enter: 0
   ... (rest are 0)
   ```
6. Watch the status box:
   - Shows "Denominations Total: ₹5000"
   - Shows "✅ Amount matches!" (green)
7. Click "Save Gift" → Receipt prints automatically

---

#### 📋 **Traditional Mode (Original)**
Best for manual denomination entry.

**Steps:**
1. Leave "Collect by Total Amount" **UNCHECKED**
2. Manually enter denomination rows:
   ```
   ₹500 × 10 = ₹5000
   + ₹200 × 0 = ₹0
   ─────────────────
   Total = ₹5000
   ```
3. Click "Save Gift" → Receipt prints

---

## 🔢 Denomination Breakdown Examples

### Example 1: Simple Cash Gift (₹2750)
```
Total Amount Entered: ₹2750

Denomination Selection:
┌──────┬─────┬──────────┐
│Denom │Qty  │Subtotal  │
├──────┼─────┼──────────┤
│₹500  │ 5   │₹2500     │
│₹200  │ 1   │₹200      │
│₹100  │ 0   │₹0        │
│₹50   │ 1   │₹50       │
│₹20   │ 0   │₹0        │
│₹10   │ 0   │₹0        │
│₹5    │ 0   │₹0        │
│₹2    │ 0   │₹0        │
│₹1    │ 0   │₹0        │
└──────┴─────┴──────────┘
      Total = ₹2750 ✅
```

### Example 2: Mixed Denominations (₹1000)
```
Total Amount Entered: ₹1000

Denomination Selection:
┌──────┬─────┬──────────┐
│Denom │Qty  │Subtotal  │
├──────┼─────┼──────────┤
│₹500  │ 2   │₹1000     │
│₹200  │ 0   │₹0        │
│₹100  │ 0   │₹0        │
│₹50   │ 0   │₹0        │
│₹20   │ 0   │₹0        │
│₹10   │ 0   │₹0        │
│₹5    │ 0   │₹0        │
│₹2    │ 0   │₹0        │
│₹1    │ 0   │₹0        │
└──────┴─────┴──────────┘
      Total = ₹1000 ✅
```

### Example 3: Complex Mix (₹3456)
```
Total Amount Entered: ₹3456

Denomination Selection:
┌──────┬─────┬──────────┐
│Denom │Qty  │Subtotal  │
├──────┼─────┼──────────┤
│₹500  │ 6   │₹3000     │
│₹200  │ 2   │₹400      │
│₹100  │ 0   │₹0        │
│₹50   │ 1   │₹50       │
│₹20   │ 0   │₹0        │
│₹10   │ 0   │₹0        │
│₹5    │ 1   │₹5        │
│₹2    │ 0   │₹0        │
│₹1    │ 1   │₹1        │
└──────┴─────┴──────────┘
      Total = ₹3456 ✅
```

---

## ⚠️ Validation Errors

### ❌ Mismatch Error
```
Total Amount Entered: ₹1000
Denominations Selected:
  ₹500 × 1 = ₹500
  ₹200 × 1 = ₹200
  (All others = 0)
  
Calculated Total = ₹700

❌ Status: "Mismatch with entered amount"
Cannot save until amounts match!
```

**Fix:** Add more denominations
```
  ₹500 × 1 = ₹500
  ₹200 × 1 = ₹200
  ₹100 × 3 = ₹300
  ─────────────────
  Calculated = ₹1000 ✅
```

---

## 📊 Receipt Output

After saving with total amount mode, the receipt shows:

```
╔════════════════════════════════════════╗
║          GIFT RECEIPT                  ║
║        Ravi Kumar | Chennai            ║
╠════════════════════════════════════════╣
║ DENOMINATION BREAKDOWN                 ║
├────────────────┬──────┬────────────────┤
│ Denomination   │ Qty  │ Amount         │
├────────────────┼──────┼────────────────┤
│ ₹500           │ 5    │ ₹2500          │
│ ₹200           │ 1    │ ₹200           │
│ ₹50            │ 1    │ ₹50            │
├────────────────┼──────┼────────────────┤
│ TOTAL          │      │ ₹2750          │
╚════════════════════════════════════════╝
```

---

## 🔄 Switching Modes

### From Total Amount → Traditional
```
✅ Check "Collect by Total Amount"
   ├─ Enter: Total ₹5000, ₹500×10
   │
   └─ Uncheck "Collect by Total Amount"
      └─ Your data clears (fresh form)
         └─ Shows empty traditional rows
            └─ Ready for manual entry
```

### From Traditional → Total Amount
```
Traditional mode active
   ├─ Enter: ₹500×10, ₹200×5
   │
   └─ Check "Collect by Total Amount"
      └─ Your data clears (fresh form)
         └─ Shows total amount input + denoms
            └─ Ready for total entry
```

---

## ✅ Advantages of Total Amount Mode

| Feature | Benefit |
|---------|---------|
| **Predefined Denominations** | No typos, consistent values |
| **Real-time Validation** | Know immediately if amounts match |
| **Quick Entry** | Just enter quantities, not values |
| **Clear Feedback** | Green/Red status makes it obvious |
| **Safer** | Cannot save mismatched amounts |
| **Professional** | Uses standard rupee denominations |

---

## 💡 Pro Tips

### Tip 1: Fast Entry for Round Numbers
For ₹5000 total:
- Just enter ₹500 × 10
- Done! Saves instantly

### Tip 2: Verify Large Amounts
For ₹15,000 total:
1. First estimate: ₹500 × 30
2. Check validation status
3. Adjust if needed

### Tip 3: Handle Remainders
For ₹1,234 total:
```
₹500 × 2 = ₹1000
₹200 × 1 = ₹200
₹20  × 1 = ₹20
₹10  × 1 = ₹10
₹2   × 2 = ₹4
─────────────────
         = ₹1234 ✅
```

### Tip 4: Editing Gifts
When you edit an existing gift:
- It loads in **traditional mode** (backward compatible)
- You can switch to total amount mode if preferred
- Changes are automatically saved

---

## 🌐 Language Support

### English UI
- Label: "✅ Collect by Total Amount"
- Status: "✅ Amount matches!" or "⚠️ Mismatch with entered amount"

### Tamil UI (தமிழ்)
- Label: "✅ மொத்த தொகையால் சேகரி"
- Status: "✅ தொகை பொருந்திறது!" or "⚠️ உள்ளிட்ட தொகையுடன் பொருந்தவில்லை"

---

## 🎯 When to Use Each Mode

### ✅ Use Total Amount Mode When:
- You know the exact total cash received
- Donor gives cash in denominations
- You want to verify the breakdown
- You need clear denomination records
- Donor hands you specific notes

### 📋 Use Traditional Mode When:
- You prefer to manually type amounts
- Testing the system
- Entering mixed payment types
- No specific denomination preference
- Legacy workflow comfort

---

## 🔍 Troubleshooting

### Q: My denominations don't add up to the total?
**A:** Check your math! Status box will show ❌ in red. Edit quantities until it shows ✅ in green.

### Q: Can I enter decimal quantities?
**A:** No, only whole numbers. Denominations come in whole units.

### Q: What if I need a denomination not in the list?
**A:** Use traditional mode instead. Denominations are fixed to Indian currency standards.

### Q: Does the receipt show denominations?
**A:** Yes! The receipt prints with a breakdown table showing each denomination and quantity.

### Q: Can I go back to traditional mode?
**A:** Yes! Just uncheck the checkbox. Previous entries are cleared, so you start fresh.

---

## 📞 Need Help?

1. Check validation status (green = good, red = fix it)
2. Look at the calculated total
3. Compare to your entered total
4. Adjust quantities as needed
5. When amounts match, save button works!

---

**Last Updated:** March 19, 2026  
**Feature Status:** ✅ Live and Ready
