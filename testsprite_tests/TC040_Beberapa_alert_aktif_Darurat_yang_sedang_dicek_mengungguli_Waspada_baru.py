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
        
        # -> Masuk ke NADI menggunakan email dan kata sandi demo agar kartu status di Beranda dapat diuji.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Masuk ke NADI menggunakan email dan kata sandi demo agar kartu status di Beranda dapat diuji.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Masuk ke NADI menggunakan email dan kata sandi demo agar kartu status di Beranda dapat diuji.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Scroll to the demo controls and select “Simulasikan pola berubah” to test whether the status card keeps the more serious alert.
        # Simulasikan pola berubah button
        elem = page.get_by_role("button", name="Simulasikan pola berubah")
        await elem.click(timeout=10000)
        
        # -> Open “Lihat & tindak lanjuti” on the status card and inspect the available follow-up actions.
        # Lihat & tindak lanjuti button
        elem = page.get_by_role("button", name="Lihat & tindak lanjuti")
        await elem.click(timeout=10000)
        
        # -> Click “Tandai selesai” on the Darurat alert detail, then inspect the resulting page state.
        # Tandai selesai button
        elem = page.get_by_role("button", name="Tandai selesai")
        await elem.click(timeout=10000)
        
        # -> Return from the completed Darurat alert to Beranda and verify the status card shows the Waspada alert.
        # Kembali button
        elem = page.get_by_role("button", name="Kembali")
        await elem.click(timeout=10000)
        
        # -> Open “Lihat & tindak lanjuti” for the Waspada alert and inspect its available actions.
        # Lihat & tindak lanjuti button
        elem = page.get_by_role("button", name="Lihat & tindak lanjuti")
        await elem.click(timeout=10000)
        
        # -> Click “Tandai sudah dicek” on the Waspada alert and inspect the updated detail view.
        # Tandai sudah dicek button
        elem = page.get_by_role("button", name="Tandai sudah dicek")
        await elem.click(timeout=10000)
        
        # -> Click “Tandai selesai” for the Waspada alert and confirm that it is marked complete.
        # Tandai selesai button
        elem = page.get_by_role("button", name="Tandai selesai")
        await elem.click(timeout=10000)
        
        # -> Return to Beranda after completing the Waspada alert and verify that the status card shows Normal.
        # Kembali button
        elem = page.get_by_role("button", name="Kembali")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> After both alerts are handled, the status card shows Normal with its usual-pattern message.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The status card shows Normal.
        await expect(page.locator("#root").nth(0)).to_contain_text("Normal", timeout=15000), "The status card shows Normal."
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The status card shows the usual-pattern message.
        await expect(page.locator("#root").nth(0)).to_contain_text("Pola keseharian terlihat seperti biasanya, tidak ada pemberitahuan baru.", timeout=15000), "The status card shows the usual-pattern message."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    