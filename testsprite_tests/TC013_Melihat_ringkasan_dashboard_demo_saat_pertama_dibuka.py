import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:4173")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # --> Assertions to verify final state
        
        # --> The demo chip “Demo · data contoh” is displayed.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The demo chip is displayed.
        await expect(page.locator("#root").nth(0)).to_contain_text("Demo \u00b7 data contoh", timeout=15000), "The demo chip is displayed."
        
        # --> The status card shows “Sedang dicek keluarga” with a “Darurat” badge and a today time label.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The status card shows the expected status, badge, and today time label.
        await expect(page.locator("#root").nth(0)).to_contain_text("Sedang dicek keluarga Darurat Hari ini,", timeout=15000), "The status card shows the expected status, badge, and today time label."
        
        # --> The page displays an update label above the metric cards.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: An update label is displayed.
        await expect(page.locator("#root").nth(0)).to_contain_text("Diperbarui", timeout=15000), "An update label is displayed."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    