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
        
        # -> Sign in to NADI using the provided demo account and verify that Beranda opens.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Sign in to NADI using the provided demo account and verify that Beranda opens.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Sign in to NADI using the provided demo account and verify that Beranda opens.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Open the Pengaturan tab to inspect the sensor mode setting.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Select “Sensor langsung (ESP32)” in the Sumber data section and inspect the resulting settings.
        # data-source radio button
        elem = page.get_by_role("radio", name="Sensor langsung (ESP32)")
        await elem.click(timeout=10000)
        
        # -> Open Beranda and verify the live sensor card, its technical details, and the absence of the “Rekaman uji” chip.
        # Beranda Beranda button
        elem = page.get_by_role("button", name="Beranda")
        await elem.click(timeout=10000)
        
        # -> Open “Detail teknis” on the live sensor card and verify the displayed technical information.
        # Detail teknis Skor perubahan sinyal – Batas gerak...
        elem = page.get_by_text("Detail teknisSkor perubahan")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The “Sensor langsung” chip is displayed on Beranda.
        await page.get_by_role("main").locator("span").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The “Sensor langsung” chip is visible.
        await expect(page.get_by_role("main").locator("span").nth(0)).to_be_visible(timeout=15000), "The \u201cSensor langsung\u201d chip is visible."
        
        # --> Both “Gerakan terakhir” and “Data terakhir diterima” are displayed.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: “Gerakan terakhir” is displayed.
        await expect(page.locator("#root").nth(0)).to_contain_text("Gerakan terakhir", timeout=15000), "\u201cGerakan terakhir\u201d is displayed."
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: “Data terakhir diterima” is displayed.
        await expect(page.locator("#root").nth(0)).to_contain_text("Data terakhir diterima", timeout=15000), "\u201cData terakhir diterima\u201d is displayed."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    