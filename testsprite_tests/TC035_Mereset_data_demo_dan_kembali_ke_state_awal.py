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
        
        # -> Buka tab Pengaturan dan periksa opsi reset data demo yang tersedia.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Tekan “Reset data demo” dan periksa konfirmasi atau hasil yang ditampilkan.
        # Reset data demo button
        elem = page.get_by_role("button", name="Reset data demo")
        await elem.click(timeout=10000)
        
        # -> Buka tab “Beranda” dan periksa apakah dasbor kembali ke keadaan demo awal setelah muat ulang.
        # Beranda Beranda button
        elem = page.get_by_role("button", name="Beranda")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The dashboard returned to its initial Normal state.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The dashboard shows its initial Normal status.
        await expect(page.locator("#root").nth(0)).to_contain_text("Status saat ini Normal", timeout=15000), "The dashboard shows its initial Normal status."
        
        # --> Beranda reports no new notifications after the reset.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The dashboard reports no new notifications.
        await expect(page.locator("#root").nth(0)).to_contain_text("tidak ada pemberitahuan baru", timeout=15000), "The dashboard reports no new notifications."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    