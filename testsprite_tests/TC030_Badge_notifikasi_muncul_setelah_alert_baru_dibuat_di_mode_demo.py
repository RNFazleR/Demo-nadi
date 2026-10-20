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
        
        # -> Masuk ke NADI menggunakan kredensial demo yang disediakan.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Masuk ke NADI menggunakan kredensial demo yang disediakan.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Masuk ke NADI menggunakan kredensial demo yang disediakan.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Use the “Simulasikan anomali” demo control to create a new unanswered alert and inspect the resulting UI.
        # Simulasikan anomali button
        elem = page.get_by_role("button", name="Simulasikan anomali")
        await elem.click(timeout=10000)
        
        # -> Return from the family-contact screen to the app and continue verifying the unanswered alert in Notifikasi.
        # Kembali ke app keluarga button
        elem = page.get_by_role("button", name="Kembali ke app keluarga")
        await elem.click(timeout=10000)
        
        # -> Open the “Notifikasi” tab and verify the unanswered alert is listed.
        # 1 Notifikasi Notifikasi button
        elem = page.get_by_role("button", name="Notifikasi, 1 belum ditanggapi")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The Notifikasi tab shows a badge for one unanswered notification.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The Notifikasi badge shows one unanswered notification.
        await expect(page.get_by_role("button", name="Notifikasi, 1 belum ditanggapi").nth(0)).to_have_attribute("aria-label", "Notifikasi, 1 belum ditanggapi", timeout=15000), "The Notifikasi badge shows one unanswered notification."
        
        # --> The new unanswered alert appears at the top of the notifications list.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The new unanswered alert appears in the notifications list.
        await expect(page.get_by_label("Perlu ditanggapi (1)").get_by_role("button").nth(0)).to_contain_text("Ibu Sri Wahyuni belum menjawab pertanyaan konfirmasi NADI dalam 20 detik.", timeout=15000), "The new unanswered alert appears in the notifications list."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    