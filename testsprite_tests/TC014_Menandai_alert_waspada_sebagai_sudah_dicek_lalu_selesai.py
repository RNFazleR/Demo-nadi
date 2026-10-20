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
        
        # -> Open the Notifikasi tab and inspect the available alerts.
        # Notifikasi Notifikasi button
        elem = page.get_by_role("button", name="Notifikasi")
        await elem.click(timeout=10000)
        
        # -> Open Beranda and inspect the demo controls for a way to generate a new Waspada alert.
        # Beranda Beranda button
        elem = page.get_by_role("button", name="Beranda")
        await elem.click(timeout=10000)
        
        # -> Trigger “Simulasikan pola berubah” to generate a new Waspada alert, then verify the UI response.
        # Simulasikan pola berubah button
        elem = page.get_by_role("button", name="Simulasikan pola berubah")
        await elem.click(timeout=10000)
        
        # -> Open the “Notifikasi” tab and inspect the newly generated warning alert.
        # 1 Notifikasi Notifikasi button
        elem = page.get_by_role("button", name="Notifikasi, 1 belum ditanggapi")
        await elem.click(timeout=10000)
        
        # -> Open the new Waspada alert about Ibu Sri Wahyuni’s reduced movement to inspect its response options.
        # Waspada Baru Pagi ini gerakan Ibu Sri Wahyuni... button
        elem = page.get_by_role("button", name="Waspada Baru Pagi ini gerakan")
        await elem.click(timeout=10000)
        
        # -> Mark the new Waspada alert as checked by selecting “Tandai sudah dicek.”
        # Tandai sudah dicek button
        elem = page.get_by_role("button", name="Tandai sudah dicek")
        await elem.click(timeout=10000)
        
        # -> Select “Tandai selesai” for the checked Waspada alert and verify that the response is recorded and the alert is resolved.
        # Tandai selesai button
        elem = page.get_by_role("button", name="Tandai selesai")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> A response is recorded for the alert.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The alert shows that a response was recorded.
        await expect(page.get_by_role("status").nth(0)).to_contain_text("Respons tercatat", timeout=15000), "The alert shows that a response was recorded."
        
        # --> The Waspada alert is marked Selesai.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The alert is marked Selesai.
        await expect(page.locator("#root").nth(0)).to_contain_text("Selesai", timeout=15000), "The alert is marked Selesai."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    