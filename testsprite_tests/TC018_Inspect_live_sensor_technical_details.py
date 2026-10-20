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
        
        # -> Enter the provided demo email and password, then submit the login form using Masuk.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Enter the provided demo email and password, then submit the login form using Masuk.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Enter the provided demo email and password, then submit the login form using Masuk.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Open Pengaturan to choose the live sensor data source.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Select “Sensor langsung (ESP32)” in the Sumber data settings and then inspect the live-mode fields.
        # data-source radio button
        elem = page.get_by_role("radio", name="Sensor langsung (ESP32)")
        await elem.click(timeout=10000)
        
        # -> Open Beranda to inspect the live sensor status card.
        # Beranda Beranda button
        elem = page.get_by_role("button", name="Beranda")
        await elem.click(timeout=10000)
        
        # -> Expand “Detail teknis” on the live sensor card and verify the displayed port, data source, and signal-strength information.
        # Detail teknis
        elem = page.get_by_text("Detail teknis")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The technical details should show the RSSI value in dBm.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Expected the technical details to show the RSSI value in dBm.
        await expect(page.get_by_role("group").nth(0)).to_contain_text("dBm", timeout=15000), "Expected the technical details to show the RSSI value in dBm."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    