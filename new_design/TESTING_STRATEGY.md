# Incremental Testing Strategy

## Test After Each Change

### After Updating Design Tokens:
```bash
# Test: No broken styles
npm run dev
# Check: Console for CSS errors
# Check: Page loads normally
```

### After Updating Existing Component #1:
```bash
# Test: Component renders
# Check: API calls still work (Network tab)
# Check: No TypeScript errors
# Check: Existing functionality intact
```

### After Creating New Component:
```bash
# Test: Component imports correctly
# Test: Props interface matches usage
# Test: API connection works
# Test: Responsive breakpoints
```

### Rollback Strategy:
```bash
# If something breaks:
git stash           # Save changes
git checkout HEAD~1 # Go back
# Fix the issue
git stash pop       # Reapply
```

## Testing Checklist Per Component

- [ ] Component renders without errors
- [ ] Matches design reference PNG
- [ ] Responsive on mobile/tablet/desktop
- [ ] API calls return data correctly
- [ ] Click handlers work
- [ ] Form submissions work (if applicable)
- [ ] No console errors
- [ ] TypeScript compiles