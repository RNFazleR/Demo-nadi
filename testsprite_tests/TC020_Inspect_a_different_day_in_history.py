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
        # -> masuk sebagai keluarga (akun demo, lihat README "Akun demo")
        await page.get_by_label("Email", exact=True).fill("rina@nadi.id")
        await page.get_by_label("Kata sandi", exact=True).fill("nadi1234")
        await page.get_by_role("button", name="Masuk", exact=True).click()
        await expect(page.get_by_role("navigation")).to_be_visible(timeout=15000)
        
        # -> Buka halaman Riwayat melalui navigasi bawah.
        # Riwayat Riwayat button
        elem = page.get_by_role("button", name="Riwayat")
        await elem.click(timeout=10000)
        
        # -> Select Selasa, 22 September in the history timeline and verify the daily detail changes to that date.
        # Sel 22 button
        elem = page.get_by_role("button", name="Selasa, 22 September: 4,3 jam")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Detail harian menampilkan Selasa, 22 September yang dipilih.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The page shows the selected date, Selasa, 22 September, in the daily details.
        await expect(page.locator("#root").nth(0)).to_contain_text("Selasa, 22 September", timeout=15000), "The page shows the selected date, Selasa, 22 September, in the daily details."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    