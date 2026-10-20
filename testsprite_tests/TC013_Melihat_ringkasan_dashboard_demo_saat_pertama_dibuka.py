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
        
        # -> Masuk sebagai keluarga tertaut dengan mengisi email dan kata sandi Rina, lalu mengirim formulir Masuk.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Masuk sebagai keluarga tertaut dengan mengisi email dan kata sandi Rina, lalu mengirim formulir Masuk.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Masuk sebagai keluarga tertaut dengan mengisi email dan kata sandi Rina, lalu mengirim formulir Masuk.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Chip “Demo · data contoh” ditampilkan di Beranda.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Chip mode demo ditampilkan.
        await expect(page.locator("#root").nth(0)).to_contain_text("Demo \u00b7 data contoh", timeout=15000), "Chip mode demo ditampilkan."
        
        # --> Kartu status menampilkan “Sedang dicek keluarga” dengan badge “Darurat” dan waktu “Hari ini, 09.12”.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Kartu status menampilkan status darurat beserta waktunya.
        await expect(page.locator("#root").nth(0)).to_contain_text("Sedang dicek keluarga Darurat Hari ini, 09.12", timeout=15000), "Kartu status menampilkan status darurat beserta waktunya."
        
        # --> Teks pembaruan “Diperbarui 24 September 2026, 09.20” ditampilkan di atas kartu metrik.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Teks pembaruan ditampilkan di atas kartu metrik.
        await expect(page.locator("#root").nth(0)).to_contain_text("Diperbarui 24 September 2026, 09.20", timeout=15000), "Teks pembaruan ditampilkan di atas kartu metrik."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    