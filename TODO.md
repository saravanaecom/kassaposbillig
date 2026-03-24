# Keyboard Navigation Fixes - PurchaseMasterPage

## Steps:
- [ ] 1. Add gridFocusOrder state + localStorage load
- [ ] 2. Fix FocusConfigModal onSave callback  
- [ ] 3. Add data-field attributes to all form inputs (11 fields)
- [x] 4. Rewrite handleFormEnter → dynamic formFocusOrder lookup
- [x] 5. Update handleCellKey → dynamic gridFocusOrder

Remaining: add refs/data-field to overrides/remarks (if exist), test
- [ ] 6. Fix SupplierDropdown key handlers (stopPropagation)
- [ ] 7. Test Ctrl+F toggle → ENTER skips field
- [ ] 8. Test drag reorder → new sequence
- [ ] 9. Test Ctrl+G grid navigation

**Next:** Edit src/presentation/pages/PurchaseMasterPage.jsx

