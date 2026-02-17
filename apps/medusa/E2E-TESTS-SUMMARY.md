# Fitment Module - E2E Testing Suite

## 📋 Overview

Comprehensive Playwright E2E test suite for the Fitment module covering all CRUD operations and navigation flows.

## 🎯 Test Coverage

### ✅ Completed Test Suites

1. **Make CRUD Tests** (`makes.spec.ts`)
   - Create, Read, Update, Delete operations
   - Form validation
   - Cancel operations
   - 6 test cases

2. **Model CRUD Tests** (`models.spec.ts`)
   - Create with make selection
   - Edit and delete operations
   - Form validation
   - Filtering by make
   - 6 test cases

3. **Engine CRUD Tests** (`engines.spec.ts`)
   - Create with fuel type, engine type, size
   - Validation for invalid size format
   - Edit and delete operations
   - Display specifications
   - 6 test cases

4. **Fitment CRUD Tests** (`fitments.spec.ts`)
   - Multi-step form navigation
   - Complete CRUD operations
   - Field validation
   - Filtering
   - 8 test cases

5. **Navigation Tests** (`navigation.spec.ts`)
   - Sidebar navigation
   - Sub-page navigation
   - Breadcrumb usage
   - Form navigation
   - Browser back button
   - Direct URL access
   - 12 test cases

6. **Smoke Tests** (`smoke.spec.ts`)
   - Login verification
   - Module access
   - Navigation links
   - 3 quick validation tests

## 📁 Project Structure

```
apps/medusa/
├── playwright.config.ts              # Playwright configuration
├── run-e2e-tests.sh                  # Test runner script
├── package.json                      # Added test scripts
└── e2e/
    ├── README.md                     # Documentation
    ├── fixtures/
    │   └── auth.ts                   # Authentication fixture
    ├── utils/
    │   └── helpers.ts                # Test utilities
    └── tests/
        ├── smoke.spec.ts             # Smoke tests
        ├── makes.spec.ts             # Make CRUD tests
        ├── models.spec.ts            # Model CRUD tests
        ├── engines.spec.ts           # Engine CRUD tests
        ├── fitments.spec.ts          # Fitment CRUD tests
        └── navigation.spec.ts        # Navigation tests
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd apps/medusa
npm install
npx playwright install chromium
```

### 2. Run Tests

#### Using NPM Scripts
```bash
# Run all tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View report
npm run test:e2e:report
```

#### Using Test Runner Script
```bash
# Make script executable (if not already)
chmod +x run-e2e-tests.sh

# Run specific test suites
./run-e2e-tests.sh smoke        # Quick smoke tests
./run-e2e-tests.sh makes        # Make tests only
./run-e2e-tests.sh models       # Model tests only
./run-e2e-tests.sh engines      # Engine tests only
./run-e2e-tests.sh fitments     # Fitment tests only
./run-e2e-tests.sh navigation   # Navigation tests
./run-e2e-tests.sh all          # All tests
./run-e2e-tests.sh ui           # Open UI mode
```

## 🧪 Test Features

### Authentication
- Automatic login using `authenticatedPage` fixture
- Credentials: `admin@medusa-test.com` / `supersecret`
- Session reuse across tests

### Smart Selectors
- Semantic selectors (text, roles, labels)
- Fallback selectors for flexibility
- Minimal brittle CSS selectors

### Test Isolation
- Each test is independent
- Can run in any order
- Cleanup where possible

### Error Handling
- Screenshots on failure
- Video recording on failure
- Detailed error traces
- Retry logic (2 retries in CI)

### Utilities
- `waitForPageLoad()` - Wait for complete page load
- `fillInputByLabel()` - Fill form by label text
- `clickButton()` - Click button by text
- `verifyToast()` - Verify toast notifications
- `generateMakeData()` - Generate test data
- And more...

## 📊 Test Statistics

| Test Suite | Test Cases | Coverage |
|------------|------------|----------|
| Makes | 6 | CRUD + Validation |
| Models | 6 | CRUD + Filtering |
| Engines | 6 | CRUD + Validation |
| Fitments | 8 | Multi-step CRUD |
| Navigation | 12 | Full navigation flow |
| Smoke | 3 | Quick validation |
| **Total** | **41** | **Complete** |

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)
```typescript
{
  baseURL: 'http://localhost:9000',
  browser: 'chromium',
  retries: 2 (CI only),
  workers: 1,
  screenshots: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry'
}
```

## 📝 Writing New Tests

### Example Test
```typescript
import { test, expect } from '../fixtures/auth';
import { waitForPageLoad, clickButton } from '../utils/helpers';

test.describe('My Feature', () => {
  test('should do something', async ({ authenticatedPage: page }) => {
    await page.goto('/app/my-feature');
    await waitForPageLoad(page);
    
    await clickButton(page, 'Create');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## 🐛 Debugging

### UI Mode (Recommended)
```bash
npm run test:e2e:ui
```
- Visual test runner
- Step through tests
- Time travel debugging
- Watch mode

### Debug Mode
```bash
npm run test:e2e:debug
```
- Playwright Inspector
- Set breakpoints
- Step through code

### Headed Mode
```bash
npm run test:e2e:headed
```
- See browser in action
- Slower execution
- Visual feedback

## 📈 CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E Tests
  run: npm run test:e2e
  env:
    CI: true

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## 🎯 Best Practices

1. **Use Fixtures** - Leverage `authenticatedPage` fixture
2. **Wait Properly** - Use `waitForLoadState` and `waitForTimeout`
3. **Semantic Selectors** - Prefer text/role over CSS
4. **Test Isolation** - Each test should be independent
5. **Helper Functions** - Reuse common operations
6. **Descriptive Names** - Clear test descriptions
7. **Error Messages** - Meaningful assertions

## 🔍 Troubleshooting

### Tests Timeout
- Increase timeout in config
- Check app is running on port 9000
- Verify database is seeded

### Authentication Fails
- Check credentials in `.env`
- Verify user exists: `npm run add-user`
- Check database connection

### Element Not Found
- Use UI mode to inspect
- Check selector accuracy
- Wait for page load

### Flaky Tests
- Add proper waits
- Check for race conditions
- Use `waitForLoadState`

## 📚 Resources

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
- [Debugging Guide](https://playwright.dev/docs/debug)

## 🎉 Next Steps

- [ ] Run smoke tests: `./run-e2e-tests.sh smoke`
- [ ] Explore UI mode: `npm run test:e2e:ui`
- [ ] Add more test cases as needed
- [ ] Integrate with CI/CD pipeline
- [ ] Monitor test stability
- [ ] Add visual regression tests (future)

---

**Total Test Cases**: 41  
**Test Suites**: 6  
**Coverage**: Complete CRUD + Navigation  
**Status**: ✅ Ready to use
