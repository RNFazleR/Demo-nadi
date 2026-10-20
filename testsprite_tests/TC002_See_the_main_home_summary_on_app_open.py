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
        
        # --> Assertions to verify final state
        
        # --> Beranda menampilkan bagian status saat ini.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The home summary shows the current-status section.
        await expect(page.locator("#root").nth(0)).to_contain_text("Status saat ini", timeout=15000), "The home summary shows the current-status section."
        
        # --> Beranda menampilkan metrik tidur semalam.
        await page.get_by_text("7,1").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The home summary shows the sleep metric.
        await expect(page.get_by_text("7,1").nth(0)).to_be_visible(timeout=15000), "The home summary shows the sleep metric."
        
        # --> Beranda menampilkan metrik waktu aktif hari ini.
        await page.get_by_text("47").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The home summary shows the daily active-time metric.
        await expect(page.get_by_text("47").nth(0)).to_be_visible(timeout=15000), "The home summary shows the daily active-time metric."
        
        # --> Beranda menampilkan metrik terbangun malam.
        await page.get_by_text("1", exact=True).nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The home summary shows the night-waking metric.
        await expect(page.get_by_text("1", exact=True).nth(0)).to_be_visible(timeout=15000), "The home summary shows the night-waking metric."
        
        # --> Beranda menampilkan informasi aktivitas terakhir.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The home summary shows the latest-activity information.
        await expect(page.locator("#root").nth(0)).to_contain_text("Aktivitas terakhir terdeteksi:", timeout=15000), "The home summary shows the latest-activity information."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    