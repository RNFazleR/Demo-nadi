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
        
        # -> Sign in to NADI using the provided demo account and continue to Beranda.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Sign in to NADI using the provided demo account and continue to Beranda.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Sign in to NADI using the provided demo account and continue to Beranda.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Open Pengaturan and inspect the available demo reset controls.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Activate “Reset data demo” in Pengaturan and inspect the resulting confirmation or feedback.
        # Reset data demo button
        elem = page.get_by_role("button", name="Reset data demo")
        await elem.click(timeout=10000)
        
        # -> Buka Beranda dan pastikan kartu status serta cerita demo awal tampil kembali.
        # Beranda Beranda button
        elem = page.get_by_role("button", name="Beranda")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Reset mengembalikan aplikasi ke mode Demo dengan data contoh.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Pastikan aplikasi kembali ke mode Demo dengan data contoh.
        await expect(page.locator("#root").nth(0)).to_contain_text("Demo \u00b7 data contoh", timeout=15000), "Pastikan aplikasi kembali ke mode Demo dengan data contoh."
        
        # --> Beranda menampilkan kembali cerita awal tentang belum adanya gerakan selama 90 menit.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Pastikan Beranda menampilkan cerita awal tentang belum adanya gerakan.
        await expect(page.locator("#root").nth(0)).to_contain_text("Belum ada gerakan terdeteksi selama 90 menit, padahal biasanya Ibu sedang beraktivitas di jam ini.", timeout=15000), "Pastikan Beranda menampilkan cerita awal tentang belum adanya gerakan."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    