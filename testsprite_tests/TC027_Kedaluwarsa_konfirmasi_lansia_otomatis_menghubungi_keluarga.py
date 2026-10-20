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
        
        # -> Sign in to NADI using the provided demo credentials and open the family app home screen.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Sign in to NADI using the provided demo credentials and open the family app home screen.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Sign in to NADI using the provided demo credentials and open the family app home screen.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Start the “Simulasikan anomali” flow and inspect the elder confirmation screen.
        # Simulasikan anomali button
        elem = page.get_by_role("button", name="Simulasikan anomali")
        await elem.click(timeout=10000)
        
        # -> Click “Kembali ke app keluarga” to return and check the family app’s status and emergency alert.
        # Kembali ke app keluarga button
        elem = page.get_by_role("button", name="Kembali ke app keluarga")
        await elem.click(timeout=10000)
        
        # -> Open “Notifikasi” and verify that the emergency alert appears in the notification list.
        # 1 Notifikasi Notifikasi button
        elem = page.get_by_role("button", name="Notifikasi, 1 belum ditanggapi")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> A new emergency alert is recorded in Notifikasi.
        await page.get_by_role("button", name="Darurat Baru Ibu Sri Wahyuni").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: A new emergency alert is visible in the notification list.
        await expect(page.get_by_role("button", name="Darurat Baru Ibu Sri Wahyuni").nth(0)).to_be_visible(timeout=15000), "A new emergency alert is visible in the notification list."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    