# Fitment Module E2E Tests

Comprehensive end-to-end tests for the Fitment module using Playwright.

## Test Coverage

### 1. Make CRUD Operations
- ✅ Display makes list page
- ✅ Create a new make
- ✅ Validate required fields
- ✅ Edit existing make
- ✅ Delete a make
- ✅ Cancel creation

### 2. Model CRUD Operations
- ✅ Display models list page
- ✅ Create a new model with make selection
- ✅ Validate required fields
- ✅ Edit existing model
- ✅ Delete a model
- ✅ Filter models by make

### 3. Engine CRUD Operations
- ✅ Display engines list page
- ✅ Create a new engine
- ✅ Validate engine size format
- ✅ Edit existing engine
- ✅ Delete an engine
- ✅ Display engine specifications

### 4. Fitment CRUD Operations
- ✅ Display fitments list page
- ✅ Create fitment using multi-step form
- ✅ Navigate between form steps
- ✅ Validate required fields
- ✅ Edit existing fitment
- ✅ Delete a fitment
- ✅ Filter fitments
- ✅ Display fitment details

### 5. Navigation
- ✅ Navigate from sidebar
- ✅ Navigate between sub-pages
- ✅ Breadcrumb navigation
- ✅ Create form navigation
- ✅ Edit form navigation
- ✅ Browser back button
- ✅ Direct URL navigation
- ✅ Page titles

## Running Tests

### Install Dependencies
```bash
cd apps/medusa
npx playwright install
```

### Run All Tests
```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test e2e/tests/makes.spec.ts

# Run tests in UI mode
npx playwright test --ui

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test by name
npx playwright test -g "should create a new make"
```

### Debug Tests
```bash
# Debug mode
npx playwright test --debug

# Generate code
npx playwright codegen http://localhost:9000/app
```

### View Test Reports
```bash
# Open HTML report
npx playwright show-report
```

## Test Structure

```
e2e/
├── fixtures/
│   └── auth.ts              # Authentication fixture
├── utils/
│   └── helpers.ts           # Test helpers and utilities
└── tests/
    ├── makes.spec.ts        # Make CRUD tests
    ├── models.spec.ts       # Model CRUD tests
    ├── engines.spec.ts      # Engine CRUD tests
    ├── fitments.spec.ts     # Fitment CRUD tests
    └── navigation.spec.ts   # Navigation tests
```

## Configuration

Tests use the configuration in `playwright.config.ts`:
- Base URL: `http://localhost:9000`
- Browser: Chromium (Desktop Chrome)
- Retries: 2 (CI only)
- Screenshots: On failure
- Videos: On failure
- Traces: On first retry

## Authentication

All tests use the `authenticatedPage` fixture which automatically logs in with:
- Email: `admin@medusa-test.com`
- Password: `supersecret`

## Best Practices

1. **Stable Selectors**: Tests use semantic selectors (text, roles, labels) instead of brittle CSS selectors
2. **Waits**: Uses `waitForLoadState` and `waitForTimeout` appropriately
3. **Isolation**: Each test is independent and can run in any order
4. **Cleanup**: Tests clean up created data when possible
5. **Assertions**: Clear assertions with helpful error messages
6. **Helpers**: Reusable helper functions for common operations

## Continuous Integration

To run tests in CI:
```bash
# Set CI environment variable
CI=true npx playwright test
```

This will:
- Run tests with 2 retries
- Use 1 worker
- Fail if `test.only` is found

## Troubleshooting

### Tests Timing Out
- Increase timeout in `playwright.config.ts`
- Check if app is running on correct port
- Verify database is seeded

### Element Not Found
- Check if selector is correct
- Wait for page to fully load
- Verify element is visible in UI mode

### Authentication Failed
- Verify credentials in `.env`
- Check if user exists in database
- Run seed script if needed

## Future Improvements

- [ ] Add visual regression tests
- [ ] Add accessibility tests
- [ ] Add API tests alongside E2E
- [ ] Add performance tests
- [ ] Add mobile viewport tests
- [ ] Add parallel execution
- [ ] Add test data generators
- [ ] Add page object models
