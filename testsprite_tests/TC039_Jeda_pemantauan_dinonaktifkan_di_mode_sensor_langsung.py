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
        
        # -> Masuk ke NADI menggunakan akun HP Cabang yang sudah tertaut.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Masuk ke NADI menggunakan akun HP Cabang yang sudah tertaut.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Masuk ke NADI menggunakan akun HP Cabang yang sudah tertaut.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Buka tab “Pengaturan” untuk memeriksa dan mengatur Jeda pemantauan.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Aktifkan switch “Jeda pemantauan” dalam mode Demo dan periksa status yang muncul.
        # button
        elem = page.get_by_role("switch", name="Jeda pemantauan")
        await elem.click(timeout=10000)
        
        # -> Select “Sensor langsung (lewat HP Pusat)” and verify the pause control and status update for live mode.
        # Sensor langsung (lewat HP Pusat)
        elem = page.locator("label").filter(has_text="Sensor langsung (lewat HP")
        await elem.click(timeout=10000)
        
        # -> Select “Demo (data contoh)” and verify that “Pemantauan sedang dijeda” appears again.
        # data-source radio button
        elem = page.get_by_role("radio", name="Demo (data contoh)")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> In Demo mode, “Pemantauan sedang dijeda” is displayed.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Verify that the paused-monitoring status is displayed in Demo mode.
        await expect(page.locator("#root").nth(0)).to_contain_text("Pemantauan sedang dijeda", timeout=15000), "Verify that the paused-monitoring status is displayed in Demo mode."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    