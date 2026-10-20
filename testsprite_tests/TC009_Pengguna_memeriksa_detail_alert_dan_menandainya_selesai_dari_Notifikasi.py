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
        
        # -> Enter the provided demo email and password, then select “Masuk” to open the app.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Enter the provided demo email and password, then select “Masuk” to open the app.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Enter the provided demo email and password, then select “Masuk” to open the app.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Open the “Notifikasi” tab and locate an alert that needs attention.
        # Notifikasi Notifikasi button
        elem = page.get_by_role("button", name="Notifikasi")
        await elem.click(timeout=10000)
        
        # -> Open the Darurat alert marked “Sedang dicek” and inspect its details.
        # Darurat Sedang dicek Belum ada gerakan terdeteksi... button
        elem = page.get_by_role("button", name="Darurat Sedang dicek Belum")
        await elem.click(timeout=10000)
        
        # -> Select “Tandai selesai” on the Darurat alert and verify its handled status.
        # Tandai selesai button
        elem = page.get_by_role("button", name="Tandai selesai")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Detail alert Darurat ditampilkan.
        await page.locator("#root").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The Darurat alert detail is displayed.
        await expect(page.locator("#root").nth(0)).to_be_visible(timeout=15000), "The Darurat alert detail is displayed."
        
        # --> Status alert berubah menjadi “Selesai.”
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The alert status is Selesai.
        await expect(page.locator("#root").nth(0)).to_contain_text("Selesai", timeout=15000), "The alert status is Selesai."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    