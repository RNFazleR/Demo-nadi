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
        
        # -> Masuk ke NADI menggunakan email dan kata sandi demo untuk melanjutkan ke beranda keluarga.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Masuk ke NADI menggunakan email dan kata sandi demo untuk melanjutkan ke beranda keluarga.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Masuk ke NADI menggunakan email dan kata sandi demo untuk melanjutkan ke beranda keluarga.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Start the anomaly simulation from the family dashboard and inspect the response screen.
        # Simulasikan anomali button
        elem = page.get_by_role("button", name="Simulasikan anomali")
        await elem.click(timeout=10000)
        
        # -> Select “Ya, saya baik-baik saja” to complete the anomaly response and inspect the resulting screen.
        # Ya, saya baik-baik saja button
        elem = page.get_by_role("button", name="Ya, saya baik-baik saja")
        await elem.click(timeout=10000)
        
        # -> Click “Kembali ke app keluarga” and verify the family dashboard and informational alert appear.
        # Kembali ke app keluarga button
        elem = page.get_by_role("button", name="Kembali ke app keluarga")
        await elem.click(timeout=10000)
        
        # -> Buka tab “Notifikasi” dan periksa apakah alert informasi dari simulasi tercatat.
        # Notifikasi Notifikasi button
        elem = page.get_by_role("button", name="Notifikasi")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> An informational alert records that Ibu Sri answered that she was doing well.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The recorded notification is informational.
        await expect(page.get_by_label("Hari ini").get_by_role("list").nth(0)).to_contain_text("Info", timeout=15000), "The recorded notification is informational."
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The informational alert records the well-being response.
        await expect(page.get_by_label("Hari ini").get_by_role("list").nth(0)).to_contain_text("menjawab bahwa ia baik-baik saja", timeout=15000), "The informational alert records the well-being response."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    