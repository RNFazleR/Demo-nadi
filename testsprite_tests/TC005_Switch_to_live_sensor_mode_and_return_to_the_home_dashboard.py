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
        
        # -> Sign in to the family app using the provided Rina account.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Sign in to the family app using the provided Rina account.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Sign in to the family app using the provided Rina account.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Open the “Pengaturan” tab to locate the sensor data source setting.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Select “Sensor langsung (lewat HP Pusat)” in the Sumber data settings.
        # data-source radio button
        elem = page.get_by_role("radio", name="Sensor langsung (lewat HP")
        await elem.click(timeout=10000)
        
        # -> Open Beranda and verify the live sensor indicator and sensor status card on the dashboard.
        # Beranda Beranda button
        elem = page.get_by_role("button", name="Beranda")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The dashboard displays the “Sensor langsung” chip.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The dashboard displays the live sensor chip.
        await expect(page.get_by_role("main").nth(0)).to_contain_text("Sensor langsung", timeout=15000), "The dashboard displays the live sensor chip."
        
        # --> The dashboard’s sensor status card reports “Sensor terputus.”
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The dashboard displays the disconnected sensor status.
        await expect(page.locator("#root").nth(0)).to_contain_text("Sensor terputus", timeout=15000), "The dashboard displays the disconnected sensor status."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    