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
        
        # -> Scroll down to reveal the “Simulasikan pola berubah” control.
        await page.mouse.wheel(0, 300)
        
        # -> Click “Simulasikan pola berubah” and check whether the status card still prioritizes the serious family-check alert and Notifikasi shows a badge of 1.
        # Simulasikan pola berubah button
        elem = page.get_by_role("button", name="Simulasikan pola berubah")
        await elem.click(timeout=10000)
        
        # -> Open the “Sedang dicek keluarga” alert using “Lihat & tindak lanjuti” and inspect its available actions.
        # Lihat & tindak lanjuti button
        elem = page.get_by_role("button", name="Lihat & tindak lanjuti")
        await elem.click(timeout=10000)
        
        # -> Mark the serious family-check alert as complete and inspect the resulting page state.
        # Tandai selesai button
        elem = page.get_by_role("button", name="Tandai selesai")
        await elem.click(timeout=10000)
        
        # -> Click “Kembali” to return to the status card and verify the changed-pattern Waspada alert appears.
        # Kembali button
        elem = page.get_by_role("button", name="Kembali")
        await elem.click(timeout=10000)
        
        # -> Open the Waspada alert using “Lihat & tindak lanjuti” and inspect its available actions.
        # Lihat & tindak lanjuti button
        elem = page.get_by_role("button", name="Lihat & tindak lanjuti")
        await elem.click(timeout=10000)
        
        # -> Mark the Waspada alert as checked and inspect the updated alert details.
        # Tandai sudah dicek button
        elem = page.get_by_role("button", name="Tandai sudah dicek")
        await elem.click(timeout=10000)
        
        # -> Click “Tandai selesai” on the checked Waspada alert, then return to Beranda and verify the card shows Normal.
        # Tandai selesai button
        elem = page.get_by_role("button", name="Tandai selesai")
        await elem.click(timeout=10000)
        
        # -> Return to Beranda and verify the status card shows “Normal” and “Pola keseharian terlihat seperti biasanya.”
        # Kembali button
        elem = page.get_by_role("button", name="Kembali")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Status saat ini Normal, dengan pola keseharian yang terlihat seperti biasanya.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The status card shows Normal with the usual-pattern message.
        await expect(page.locator("#root").nth(0)).to_contain_text("Normal Pola keseharian terlihat seperti biasanya", timeout=15000), "The status card shows Normal with the usual-pattern message."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    