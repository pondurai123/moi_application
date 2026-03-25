# 🧪 Validation Testing Guide - Total Amount Feature

**Date:** March 19, 2026  
**Feature:** Total Amount Denomination Validation  
**Status:** Fixed & Ready for Testing

---

## 🔧 What Was Fixed

### Issue Identified
"Invalid value" errors were appearing during form submission. The issue was:
1. Form fields had `required: true` validation that was showing before proper field validation
2. The validation logic needed to be moved to the onSubmit handler
3. Form validation and business logic validation weren't aligned

### What Changed
- ✅ Removed `required: true` from form field registration
- ✅ Added comprehensive validation in onSubmit function
- ✅ Added field trimming to remove extra spaces
- ✅ Better error messages for each validation step

---

## ✅ Validation Checklist - Test All Scenarios

### Test 1: Empty Donor Name
```
1. Leave Donor Name field empty
2. Fill other fields correctly:
   - Place: "Chennai"
   - Total Amount: 5000
   - ₹500 × 10
3. Click Save
4. Expected: Toast error "Please enter donor name"
Status: TEST THIS
```

### Test 2: Empty Place
```
1. Fill Donor Name: "Ravi Kumar"
2. Leave Place field empty
3. Fill other fields:
   - Total Amount: 5000
   - ₹500 × 10
4. Click Save
5. Expected: Toast error "Please enter donor place"
Status: TEST THIS
```

### Test 3: Missing Total Amount
```
1. Fill Donor Name: "Ravi Kumar"
2. Fill Place: "Chennai"
3. Leave Total Amount empty
4. Fill denominations: ₹500 × 10
5. Click Save
6. Expected: Toast error "Please enter a total amount"
Status: TEST THIS
```

### Test 4: Total Amount Zero or Negative
```
1. Fill all basic fields correctly
2. Enter Total Amount: 0 (or negative)
3. Fill denominations
4. Click Save
5. Expected: Toast error "Please enter a total amount"
Status: TEST THIS
```

### Test 5: Denomination Mode - No Entries
```
1. Fill Donor Name: "Ravi Kumar"
2. Fill Place: "Chennai"
3. Fill Total Amount: 5000
4. UNCHECK checkbox (traditional mode)
5. Leave all denomination rows empty
6. Click Save
7. Expected: Toast error "Please add denominations with a total > 0"
Status: TEST THIS
```

### Test 6: Predefined Mode - Mismatch (CHECKED)
```
1. Fill Donor Name: "Ravi Kumar"
2. Fill Place: "Chennai"
3. Fill Total Amount: 1000
4. CHECK checkbox (predefined mode)
5. Enter: ₹500 × 1 (only ₹500, need ₹1000)
6. See status: ❌ "Mismatch warning"
7. Try to click Save
8. Expected: Toast error with amounts shown
Status: TEST THIS
```

### Test 7: Predefined Mode - Correct Match (CHECKED)
```
1. Fill Donor Name: "Ravi Kumar"
2. Fill Place: "Chennai"
3. Fill Total Amount: 2750
4. CHECK checkbox (predefined mode)
5. Enter: ₹500 × 5, ₹200 × 1, ₹50 × 1
6. See status: ✅ "Amount matches!"
7. Click Save
8. Expected: Success toast "Gift saved! 🎁"
9. Expected: Receipt prints automatically
Status: TEST THIS
```

### Test 8: Traditional Mode - Correct Entry (UNCHECKED)
```
1. Fill Donor Name: "Ravi Kumar"
2. Fill Place: "Chennai"
3. Fill Total Amount: 2000
4. UNCHECK checkbox (traditional mode)
5. Enter traditional rows:
   - ₹500 × 2
   - ₹200 × 5
6. Total shows: ₹2000
7. Click Save
8. Expected: Success "Gift saved! 🎁"
9. Expected: Receipt prints
Status: TEST THIS
```

### Test 9: Spaces in Names
```
1. Donor Name: "  Ravi Kumar  " (with spaces)
2. Place: "  Chennai  " (with spaces)
3. Fill other fields correctly
4. Click Save
5. Expected: Spaces trimmed, saves successfully
Status: TEST THIS
```

### Test 10: Special Characters
```
1. Donor Name: "Ravi & Kumar"
2. Place: "Chennai-West"
3. Fill other fields correctly
4. Click Save
5. Expected: Saves successfully
Status: TEST THIS
```

### Test 11: Large Amount
```
1. Fill Donor Name: "Ravi Kumar"
2. Fill Place: "Chennai"
3. Fill Total Amount: 999999
4. CHECK checkbox
5. Enter: ₹500 × 1999, ₹200 × 1, ₹100 × 4, ₹50 × 1, ₹20 × 4, ₹5 × 1
6. Verify calculation matches
7. Click Save
8. Expected: Success (no limits on amount)
Status: TEST THIS
```

### Test 12: Decimal Total Amount
```
1. Fill Total Amount: 1500.50
2. Fill denominations
3. Expected: Should accept decimals
4. Amount should be stored as 1500.50
Status: TEST THIS
```

### Test 13: Mode Switch with Data
```
1. Fill: Total: 1000, ₹500 × 2 (predefined mode checked)
2. Uncheck checkbox → switches to traditional mode
3. Expected: Predefined data cleared, traditional rows show empty
4. Check checkbox again → switches to predefined
5. Expected: Traditional data cleared, predefined cleared
Status: TEST THIS
```

### Test 14: Edit Existing Gift
```
1. Create gift: "Ravi Kumar", "Chennai", ₹1000
2. Click Edit
3. Change Total Amount: 2000
4. Can enter new denominations
5. Click Save
6. Expected: Gift updated successfully
Status: TEST THIS
```

### Test 15: Tamil Language
```
1. Switch to Tamil
2. Run Test 6 (mismatch error)
3. Expected: Error message in Tamil
4. Run Test 7 (correct match)
5. Expected: Success message in Tamil
Status: TEST THIS
```

---

## 📊 Expected Behavior Matrix

### Field Validation
| Field | Empty | Invalid | Valid | Result |
|-------|-------|---------|-------|--------|
| Donor Name | ❌ | N/A | "Ravi Kumar" | ✅ |
| Place | ❌ | N/A | "Chennai" | ✅ |
| Total Amount | ❌ | 0 or negative | 5000 | ✅ |
| Denominations | ❌ (mode dependent) | Varies | Matches total | ✅ |

### Denomination Validation
| Scenario | Total | Denom Sum | Status | Can Save? |
|----------|-------|-----------|--------|-----------|
| Match | 1000 | 1000 | ✅ Green | YES |
| Mismatch | 1000 | 500 | ❌ Red | NO |
| Mismatch | 1000 | 1500 | ❌ Red | NO |
| Zero | 0 | 0 | ❌ Error | NO |

---

## 🎯 Test Execution Steps

### Before Testing
1. Rebuild frontend: `npm run build`
2. Restart dev server if needed
3. Clear browser cache (Ctrl+Shift+Delete)
4. Log in to admin panel
5. Create a test event

### Running Each Test
1. Navigate to Gift Collection page
2. Follow the steps in the test case
3. Note the result
4. Take screenshot if error occurs
5. Record whether it PASSED or FAILED

### After Testing
1. If all pass: Feature is ready ✅
2. If any fail: Report error with test number

---

## 🔍 Debugging Tips

### If "Invalid value" appears
- Check the form inputs are filled
- Check Total Amount field has a number
- Check browser console for JavaScript errors
- Clear cache and reload

### If validation doesn't trigger
- Check the onSubmit function is being called
- Open browser DevTools → Console
- Look for error messages in console
- Try submitting an obviously invalid form

### If "Amount matches" doesn't show
- Make sure checkbox is checked
- Make sure at least one denomination has a quantity
- Make sure total amount is filled
- Try entering: Total 500, ₹500 × 1 (simplest case)

---

## ✨ Success Criteria

✅ All 15 tests pass  
✅ No "Invalid value" errors on valid input  
✅ Clear error messages for each validation failure  
✅ Denominations sum validates correctly  
✅ Receipt prints automatically on success  
✅ Mode switching clears data properly  
✅ Works in both English and Tamil  

---

## 📝 Test Results Template

For each test, record:
```
Test #: [Number]
Scenario: [Description]
Expected: [Expected outcome]
Actual: [What actually happened]
Status: PASS / FAIL / BLOCKED
Notes: [Any additional info]
```

---

## 🚀 Deployment Readiness

**After all tests pass:**
- [ ] All 15 tests: PASS
- [ ] No console errors
- [ ] No "Invalid value" messages on valid input
- [ ] Receipts print correctly
- [ ] Both languages work
- [ ] Ready for production ✅

---

**Test Date:** March 19, 2026  
**Tester:** [Your Name]  
**Overall Status:** [PASS/FAIL]
