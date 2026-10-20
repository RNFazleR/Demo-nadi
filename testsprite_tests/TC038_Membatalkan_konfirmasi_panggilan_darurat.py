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
        
        # -> Masuk ke NADI menggunakan akun keluarga rina@nadi.id.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Masuk ke NADI menggunakan akun keluarga rina@nadi.id.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Masuk ke NADI menggunakan akun keluarga rina@nadi.id.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Open the Notifikasi tab and locate the Darurat alert.
        # Notifikasi Notifikasi button
        elem = page.get_by_role("button", name="Notifikasi")
        await elem.click(timeout=10000)
        
        # -> Buka alert “Darurat” yang sedang dicek untuk melihat detailnya.
        # Darurat Sedang dicek Belum ada gerakan terdeteksi... button
        elem = page.get_by_role("button", name="Darurat Sedang dicek Belum")
        await elem.click(timeout=10000)
        
        # -> Open the emergency-call confirmation dialog from the alert detail.
        # Hubungi layanan darurat button
        elem = page.get_by_role("button", name="Hubungi layanan darurat")
        await elem.click(timeout=10000)
        
        # -> Pilih “Batal” pada dialog panggilan darurat dan pastikan detail alert tetap tampil.
        # Batal button
        elem = page.get_by_role("button", name="Batal")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The Darurat alert detail screen remains visible with the emergency-service contact action.
        await page.get_by_role("button", name="Hubungi layanan darurat").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The emergency-service contact action is visible on the alert detail screen.
        await expect(page.get_by_role("button", name="Hubungi layanan darurat").nth(0)).to_be_visible(timeout=15000), "The emergency-service contact action is visible on the alert detail screen."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    