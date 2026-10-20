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
        
        # -> Open the “Riwayat” tab and inspect the history view.
        # Riwayat Riwayat button
        elem = page.get_by_role("button", name="Riwayat")
        await elem.click(timeout=10000)
        
        # -> Switch to the “Waktu aktif” metric and inspect the updated history values.
        # Waktu aktif button
        elem = page.get_by_role("tab", name="Waktu aktif")
        await elem.click(timeout=10000)
        
        # -> Select the “Durasi tidur” metric and inspect its history values and usual-pattern comparison.
        # Durasi tidur button
        elem = page.get_by_role("tab", name="Durasi tidur")
        await elem.click(timeout=10000)
        
        # -> Select the “Bangun malam” metric and inspect the updated history data and usual-pattern comparison.
        # Bangun malam button
        elem = page.get_by_role("tab", name="Bangun malam")
        await elem.click(timeout=10000)
        
        # -> Select Selasa, 22 September in the history chart and verify the displayed daily value and comparison with the usual pattern.
        # Sel 22 button
        elem = page.get_by_role("button", name="Selasa, 22 September: 5 kali")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Riwayat menampilkan data Bangun malam untuk Selasa, 22 September.
        await page.get_by_role("button", name="Selasa, 22 September: 5 kali").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Data hari yang dipilih ditampilkan di riwayat.
        await expect(page.get_by_role("button", name="Selasa, 22 September: 5 kali").nth(0)).to_be_visible(timeout=15000), "Data hari yang dipilih ditampilkan di riwayat."
        
        # --> Riwayat menampilkan perbandingan pola biasanya untuk 22 September.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Perbandingan dengan pola biasanya ditampilkan.
        await expect(page.locator("#root").nth(0)).to_contain_text("Pola biasanya untuk 22 Sep:", timeout=15000), "Perbandingan dengan pola biasanya ditampilkan."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    