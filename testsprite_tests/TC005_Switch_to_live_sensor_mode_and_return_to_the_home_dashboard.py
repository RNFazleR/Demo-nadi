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
        
        # -> Sign in to NADI using the provided demo account to reach the home dashboard.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Sign in to NADI using the provided demo account to reach the home dashboard.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Sign in to NADI using the provided demo account to reach the home dashboard.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Open Pengaturan to inspect the sensor source setting.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Select “Sensor langsung (ESP32)” in the data source settings and inspect the newly displayed live-mode options.
        # data-source radio button
        elem = page.get_by_role("radio", name="Sensor langsung (ESP32)")
        await elem.click(timeout=10000)
        
        # -> Return to Beranda and verify the live sensor chip, sensor status card, and technical details.
        # Beranda Beranda button
        elem = page.get_by_role("button", name="Beranda")
        await elem.click(timeout=10000)
        
        # -> Expand “Detail teknis” on the Beranda sensor card and verify the displayed port and device type.
        # Detail teknis
        elem = page.get_by_text("Detail teknis")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The dashboard displays the “Sensor langsung” chip.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The dashboard shows the Sensor langsung chip.
        await expect(page.get_by_role("main").nth(0)).to_contain_text("Sensor langsung", timeout=15000), "The dashboard shows the Sensor langsung chip."
        
        # --> The sensor status card is displayed on the dashboard.
        await page.get_by_text("Detail teknisSkor perubahan").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The sensor card’s technical details are visible on the dashboard.
        await expect(page.get_by_text("Detail teknisSkor perubahan").nth(0)).to_be_visible(timeout=15000), "The sensor card\u2019s technical details are visible on the dashboard."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    