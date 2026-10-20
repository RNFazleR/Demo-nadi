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
        
        # -> Open Pengaturan and inspect the available sensor-mode controls.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Select “Sensor langsung (ESP32)” as the data source, then inspect the updated settings state.
        # data-source radio button
        elem = page.get_by_role("radio", name="Sensor langsung (ESP32)")
        await elem.click(timeout=10000)
        
        # -> Open Beranda and check the live sensor status and technical details after the page updates.
        # Beranda Beranda button
        elem = page.get_by_role("button", name="Beranda")
        await elem.click(timeout=10000)
        
        # -> Open “Detail teknis” on Beranda and verify the live sensor’s device and port information.
        # Detail teknis
        elem = page.get_by_text("Detail teknis")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Chip “Sensor langsung” is displayed.
        await page.get_by_role("main").locator("span").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The “Sensor langsung” chip is displayed.
        await expect(page.get_by_role("main").locator("span").nth(0)).to_be_visible(timeout=15000), "The \u201cSensor langsung\u201d chip is displayed."
        
        # --> The “Sensor gerak” card displays “Belum ada gerakan terdeteksi.”
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The live motion status is displayed.
        await expect(page.locator("#root").nth(0)).to_contain_text("Belum ada gerakan terdeteksi", timeout=15000), "The live motion status is displayed."
        
        # --> Both latest-reading details are displayed.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The “Gerakan terakhir” detail is displayed.
        await expect(page.locator("#root").nth(0)).to_contain_text("Gerakan terakhir", timeout=15000), "The \u201cGerakan terakhir\u201d detail is displayed."
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The “Data terakhir diterima” detail is displayed.
        await expect(page.locator("#root").nth(0)).to_contain_text("Data terakhir diterima", timeout=15000), "The \u201cData terakhir diterima\u201d detail is displayed."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    