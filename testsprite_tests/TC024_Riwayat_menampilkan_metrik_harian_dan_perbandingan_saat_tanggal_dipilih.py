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
        
        # -> Enter the provided demo credentials in the Email and Kata sandi fields, then submit the Masuk form.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Enter the provided demo credentials in the Email and Kata sandi fields, then submit the Masuk form.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Enter the provided demo credentials in the Email and Kata sandi fields, then submit the Masuk form.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Open the Riwayat tab from the bottom navigation.
        # Riwayat Riwayat button
        elem = page.get_by_role("button", name="Riwayat")
        await elem.click(timeout=10000)
        
        # -> Select the “Waktu aktif” metric and verify that the history view updates.
        # Waktu aktif button
        elem = page.get_by_role("tab", name="Waktu aktif")
        await elem.click(timeout=10000)
        
        # -> Select “Durasi tidur” and verify that the history data and usual-pattern comparison update.
        # Durasi tidur button
        elem = page.get_by_role("tab", name="Durasi tidur")
        await elem.click(timeout=10000)
        
        # -> Select “Bangun malam” and verify that its history metric and usual-pattern comparison appear.
        # Bangun malam button
        elem = page.get_by_role("tab", name="Bangun malam")
        await elem.click(timeout=10000)
        
        # -> Select 22 September in the Bangun malam chart and verify that its day-specific data and usual-pattern comparison are displayed.
        # Sel 22 button
        elem = page.get_by_role("button", name="Selasa, 22 September: 5 kali")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Riwayat menampilkan tampilan hari terpilih untuk 22 September.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Memastikan tampilan hari terpilih untuk 22 September ditampilkan.
        await expect(page.locator("#root").nth(0)).to_contain_text("Hari terpilih \u00b7 Sel, 22 Sep", timeout=15000), "Memastikan tampilan hari terpilih untuk 22 September ditampilkan."
        
        # --> Perbandingan pola biasanya untuk 22 September ditampilkan.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Memastikan perbandingan dengan pola biasanya untuk 22 September ditampilkan.
        await expect(page.locator("#root").nth(0)).to_contain_text("Pola biasanya untuk 22 Sep:", timeout=15000), "Memastikan perbandingan dengan pola biasanya untuk 22 September ditampilkan."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    