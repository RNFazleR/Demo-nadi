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
        
        # -> Open “Pengaturan” to inspect the monitoring mode and pause controls.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Turn on “Jeda pemantauan” in demo mode and check that “Pemantauan sedang dijeda” appears.
        # button
        elem = page.get_by_role("switch", name="Jeda pemantauan")
        await elem.click(timeout=10000)
        
        # -> Select “Sensor langsung (ESP32)” and check that pause is unavailable while live monitoring continues.
        # Sensor langsung (ESP32)
        elem = page.locator("label").filter(has_text="Sensor langsung (ESP32)")
        await elem.click(timeout=10000)
        
        # -> Select “Demo (data contoh)” and verify that “Pemantauan sedang dijeda” appears again.
        # data-source radio button
        elem = page.get_by_role("radio", name="Demo (data contoh)")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> In Demo mode, “Pemantauan sedang dijeda” is displayed after returning from live mode.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The paused-monitoring message is displayed in Demo mode.
        await expect(page.locator("#root").nth(0)).to_contain_text("Pemantauan sedang dijeda", timeout=15000), "The paused-monitoring message is displayed in Demo mode."
        
        # --> In Sensor langsung mode, the “Jeda pemantauan” switch is disabled and unchecked.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The pause switch is unchecked in live sensor mode.
        await expect(page.get_by_role("switch", name="Jeda pemantauan").nth(0)).to_have_attribute("aria-checked", "false", timeout=15000), "The pause switch is unchecked in live sensor mode."
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The pause switch is disabled in live sensor mode.
        await expect(page.get_by_role("switch", name="Jeda pemantauan").nth(0)).to_have_attribute("disabled", "", timeout=15000), "The pause switch is disabled in live sensor mode."
        
        # --> In Sensor langsung mode, a notice says pausing is unavailable and sensor readings continue.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The live-mode notice explains that pausing is unavailable and sensor readings continue.
        await expect(page.locator("#root").nth(0)).to_contain_text("Jeda belum tersedia di mode sensor langsung. Pembacaan sensor tetap berjalan.", timeout=15000), "The live-mode notice explains that pausing is unavailable and sensor readings continue."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    