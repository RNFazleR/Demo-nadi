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
        
        # -> Buka tab “Pengaturan” untuk mencari opsi reset data demo.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Klik “Reset data demo” dan periksa konfirmasi atau hasil reset yang ditampilkan.
        # Reset data demo button
        elem = page.get_by_role("button", name="Reset data demo")
        await elem.click(timeout=10000)
        
        # -> Buka tab “Beranda” dan periksa apakah dashboard menampilkan kembali cerita demo awal.
        # Beranda Beranda button
        elem = page.get_by_role("button", name="Beranda")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> After the reset, the home dashboard shows its demo follow-up story.
        await page.get_by_role("button", name="Lihat & tindak lanjuti").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The demo follow-up action is visible on the home dashboard.
        await expect(page.get_by_role("button", name="Lihat & tindak lanjuti").nth(0)).to_be_visible(timeout=15000), "The demo follow-up action is visible on the home dashboard."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    