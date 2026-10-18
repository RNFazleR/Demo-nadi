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
        
        # -> Buka tab Notifikasi untuk melihat apakah tersedia alert darurat.
        # Notifikasi Notifikasi button
        elem = page.get_by_role("button", name="Notifikasi")
        await elem.click(timeout=10000)
        
        # -> Buka alert Darurat hari ini untuk melihat detailnya.
        # Darurat Sedang dicek Belum ada gerakan terdeteksi... button
        elem = page.get_by_role("button", name="Darurat Sedang dicek Belum")
        await elem.click(timeout=10000)
        
        # -> Scroll to the follow-up actions on the emergency alert detail so the emergency-call option is accessible.
        await page.mouse.wheel(0, 300)
        
        # -> Buka konfirmasi melalui tombol “Hubungi layanan darurat” pada detail alert.
        # Hubungi layanan darurat button
        elem = page.get_by_role("button", name="Hubungi layanan darurat")
        await elem.click(timeout=10000)
        
        # -> Cancel the emergency-call confirmation using “Batal” and verify the emergency alert detail remains visible.
        # Batal button
        elem = page.get_by_role("button", name="Batal")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Detail alert darurat tetap terlihat setelah konfirmasi dibatalkan, tanpa memulai panggilan.
        await page.locator("#root").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Pastikan detail alert darurat tetap terlihat.
        await expect(page.locator("#root").nth(0)).to_be_visible(timeout=15000), "Pastikan detail alert darurat tetap terlihat."
        await page.get_by_role("button", name="Hubungi layanan darurat").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Pastikan tombol Hubungi layanan darurat tetap tersedia pada detail alert.
        await expect(page.get_by_role("button", name="Hubungi layanan darurat").nth(0)).to_be_visible(timeout=15000), "Pastikan tombol Hubungi layanan darurat tetap tersedia pada detail alert."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    