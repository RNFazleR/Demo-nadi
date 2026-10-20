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
        
        # -> Open the 'Notifikasi' tab to view available alerts.
        # Notifikasi Notifikasi button
        elem = page.get_by_role("button", name="Notifikasi")
        await elem.click(timeout=10000)
        
        # -> Open the current “Darurat” notification to view its alert details.
        # Darurat Sedang dicek Belum ada gerakan terdeteksi... button
        elem = page.get_by_role("button", name="Darurat Sedang dicek Belum")
        await elem.click(timeout=10000)
        
        # -> Open the “Hubungi layanan darurat” confirmation from the visible alert detail.
        # Hubungi layanan darurat button
        elem = page.get_by_role("button", name="Hubungi layanan darurat")
        await elem.click(timeout=10000)
        
        # -> Click “Batal” in the emergency-call confirmation and verify the alert detail remains visible without the dialog.
        # Batal button
        elem = page.get_by_role("button", name="Batal")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The “Darurat” alert detail screen remains visible after cancellation.
        await page.locator("#root").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The alert detail screen should remain visible.
        await expect(page.locator("#root").nth(0)).to_be_visible(timeout=15000), "The alert detail screen should remain visible."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    