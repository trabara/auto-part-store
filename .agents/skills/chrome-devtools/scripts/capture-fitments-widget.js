import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    console.log("Logging in...");
    await page.goto("http://localhost:9000/app/login", {
      waitUntil: "networkidle2",
    });

    await page.waitForSelector(
      'input[name="email"], input[type="email"], input[placeholder*="Email" i]',
    );
    await page.type(
      'input[name="email"], input[type="email"], input[placeholder*="Email" i]',
      "admin@medusa-test.com",
    );
    await page.type(
      'input[name="password"], input[type="password"], input[placeholder*="Password" i]',
      "supersecret",
    );
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log("Navigating to product...");
    await page.goto(
      "http://localhost:9000/app/products/prod_01KHERTVSBKS2BVKR2X5QS37FX",
      { waitUntil: "networkidle2" },
    );
    await new Promise((r) => setTimeout(r, 5000)); // Wait for widget to load

    console.log("Finding and capturing Fitments widget...");

    // Find the Fitments heading and scroll to it
    const fitmentsSectionExists = await page.evaluate(() => {
      const headings = Array.from(
        document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
      );
      const fitmentsHeading = headings.find(
        (h) => h.textContent.trim() === "Fitments",
      );
      if (fitmentsHeading) {
        // Scroll to the heading
        fitmentsHeading.scrollIntoView({ behavior: "instant", block: "start" });
        return true;
      }
      return false;
    });

    if (!fitmentsSectionExists) {
      console.log("❌ Fitments section not found!");
      await browser.close();
      return;
    }

    console.log("✓ Fitments section found, waiting for render...");
    await new Promise((r) => setTimeout(r, 2000));

    // Take a screenshot of just the Fitments widget area
    const fitmentsWidget = await page.evaluate(() => {
      const headings = Array.from(
        document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
      );
      const fitmentsHeading = headings.find(
        (h) => h.textContent.trim() === "Fitments",
      );
      if (fitmentsHeading) {
        // Find the container (usually the parent or grandparent)
        let container = fitmentsHeading.closest(
          '[class*="container"], section, div[class*="widget"]',
        );
        if (!container) {
          container = fitmentsHeading.parentElement;
        }

        if (container) {
          const rect = container.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          };
        }
      }
      return null;
    });

    if (fitmentsWidget) {
      console.log("Taking focused screenshot of Fitments widget...");
      await page.screenshot({
        path: "/home/oussama/Projects/snap-store/docs/screenshots/fitments-widget-focused.png",
        clip: {
          x: Math.max(0, fitmentsWidget.x),
          y: Math.max(0, fitmentsWidget.y),
          width: Math.min(fitmentsWidget.width, 1920),
          height: Math.min(fitmentsWidget.height, 1080),
        },
      });
      console.log("✓ Focused screenshot saved!");
    }

    // Also take full page screenshot showing the widget in context
    await page.screenshot({
      path: "/home/oussama/Projects/snap-store/docs/screenshots/product-with-fitments-widget.png",
      fullPage: true,
    });
    console.log("✓ Full page screenshot saved!");

    // Get the widget content to verify data
    const widgetData = await page.evaluate(() => {
      const headings = Array.from(
        document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
      );
      const fitmentsHeading = headings.find(
        (h) => h.textContent.trim() === "Fitments",
      );
      if (fitmentsHeading) {
        const container =
          fitmentsHeading.closest('[class*="container"], section, div') ||
          fitmentsHeading.parentElement;
        return {
          html: container.outerHTML.substring(0, 500), // First 500 chars
          text: container.innerText.substring(0, 300),
        };
      }
      return null;
    });

    console.log("\n=== Widget Content ===");
    console.log(widgetData?.text || "No content found");
    console.log("=====================\n");
  } catch (error) {
    console.error("Error:", error.message);
    await page.screenshot({
      path: "/home/oussama/Projects/snap-store/docs/screenshots/error.png",
    });
  } finally {
    await browser.close();
  }
})();
