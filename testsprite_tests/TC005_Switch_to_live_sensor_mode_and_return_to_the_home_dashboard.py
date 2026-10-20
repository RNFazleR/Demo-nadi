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
        
        # -> Open the Pengaturan tab to inspect the available sensor-source setting.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Select “Sensor langsung (ESP32)” as the data source and inspect the updated settings state.
        # data-source radio button
        elem = page.get_by_role("radio", name="Sensor langsung (ESP32)")
        await elem.click(timeout=10000)
        
        # -> Open Beranda and verify the live sensor chip, sensor status card, and technical details.
        # Beranda Beranda button
        elem = page.get_by_role("button", name="Beranda")
        await elem.click(timeout=10000)
        
        # -> Open “Detail teknis” on Beranda and verify the live sensor connection details.
        # Detail teknis
        elem = page.get_by_text("Detail teknis")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The live sensor chip is displayed on Beranda.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The live sensor chip is displayed.
        await expect(page.get_by_role("main").nth(0)).to_contain_text("Sensor langsung", timeout=15000), "The live sensor chip is displayed."
        
        # --> The sensor status card is displayed on Beranda.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The sensor status card is displayed.
        await expect(page.locator("#root").nth(0)).to_contain_text("Sensor gerak", timeout=15000), "The sensor status card is displayed."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    