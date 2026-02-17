#!/bin/bash

# E2E Test Runner for Fitment Module
# This script helps run Playwright tests with various configurations

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Fitment Module E2E Test Runner       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js${NC}"
    exit 1
fi

# Function to run tests
run_tests() {
    local mode=$1
    
    case $mode in
        "all")
            echo -e "${YELLOW}Running all E2E tests...${NC}"
            npx playwright test
            ;;
        "smoke")
            echo -e "${YELLOW}Running smoke tests...${NC}"
            npx playwright test smoke.spec.ts
            ;;
        "makes")
            echo -e "${YELLOW}Running Make CRUD tests...${NC}"
            npx playwright test makes.spec.ts
            ;;
        "models")
            echo -e "${YELLOW}Running Model CRUD tests...${NC}"
            npx playwright test models.spec.ts
            ;;
        "engines")
            echo -e "${YELLOW}Running Engine CRUD tests...${NC}"
            npx playwright test engines.spec.ts
            ;;
        "fitments")
            echo -e "${YELLOW}Running Fitment CRUD tests...${NC}"
            npx playwright test fitments.spec.ts
            ;;
        "navigation")
            echo -e "${YELLOW}Running Navigation tests...${NC}"
            npx playwright test navigation.spec.ts
            ;;
        "ui")
            echo -e "${YELLOW}Opening Playwright UI mode...${NC}"
            npx playwright test --ui
            ;;
        "headed")
            echo -e "${YELLOW}Running tests in headed mode...${NC}"
            npx playwright test --headed
            ;;
        "debug")
            echo -e "${YELLOW}Running tests in debug mode...${NC}"
            npx playwright test --debug
            ;;
        "report")
            echo -e "${YELLOW}Opening test report...${NC}"
            npx playwright show-report
            ;;
        *)
            echo -e "${RED}Unknown test mode: $mode${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Show help
show_help() {
    echo ""
    echo "Usage: ./run-e2e-tests.sh [mode]"
    echo ""
    echo "Modes:"
    echo "  all         - Run all tests"
    echo "  smoke       - Run smoke tests only"
    echo "  makes       - Run Make CRUD tests"
    echo "  models      - Run Model CRUD tests"
    echo "  engines     - Run Engine CRUD tests"
    echo "  fitments    - Run Fitment CRUD tests"
    echo "  navigation  - Run Navigation tests"
    echo "  ui          - Open Playwright UI mode"
    echo "  headed      - Run with visible browser"
    echo "  debug       - Run in debug mode"
    echo "  report      - Show test report"
    echo ""
    echo "Examples:"
    echo "  ./run-e2e-tests.sh all"
    echo "  ./run-e2e-tests.sh smoke"
    echo "  ./run-e2e-tests.sh ui"
}

# Main
if [ $# -eq 0 ]; then
    show_help
    echo -e "${YELLOW}No mode specified, running smoke tests...${NC}"
    echo ""
    run_tests "smoke"
else
    run_tests "$1"
fi

echo ""
echo -e "${GREEN}✓ Done!${NC}"
