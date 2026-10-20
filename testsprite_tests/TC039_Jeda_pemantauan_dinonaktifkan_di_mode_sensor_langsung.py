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
        
        # -> Sign in to NADI using the provided test account and continue from the home screen.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Sign in to NADI using the provided test account and continue from the home screen.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Sign in to NADI using the provided test account and continue from the home screen.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Open Pengaturan to inspect the monitoring mode and pause controls.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Turn on “Jeda pemantauan” in demo mode and verify the paused status appears.
        # button
        elem = page.get_by_role("switch", name="Jeda pemantauan")
        await elem.click(timeout=10000)
        
        # -> Select “Sensor langsung (ESP32)” and inspect the pause control and live-mode status message.
        # Sensor langsung (ESP32)
        elem = page.locator("label").filter(has_text="Sensor langsung (ESP32)")
        await elem.click(timeout=10000)
        
        # -> Select “Demo (data contoh)” and verify that “Pemantauan sedang dijeda” appears again.
        # Demo (data contoh)
        elem = page.locator("label").filter(has_text="Demo (data contoh)")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Di mode Demo, “Pemantauan sedang dijeda” tampil.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Pastikan status “Pemantauan sedang dijeda” tampil.
        await expect(page.locator("#root").nth(0)).to_contain_text("Pemantauan sedang dijeda", timeout=15000), "Pastikan status \u201cPemantauan sedang dijeda\u201d tampil."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    