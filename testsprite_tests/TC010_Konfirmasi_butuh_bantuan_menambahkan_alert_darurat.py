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
        
        # -> Sign in to NADI using the provided family demo credentials.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Sign in to NADI using the provided family demo credentials.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Sign in to NADI using the provided family demo credentials.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Start the anomaly simulation by selecting “Simulasikan anomali” on Beranda.
        # Simulasikan anomali button
        elem = page.get_by_role("button", name="Simulasikan anomali")
        await elem.click(timeout=10000)
        
        # -> Select “Butuh bantuan” on the anomaly response screen and check that the family dashboard shows a newly recorded emergency alert.
        # Butuh bantuan button
        elem = page.get_by_role("button", name="Butuh bantuan")
        await elem.click(timeout=10000)
        
        # -> Tekan “Kembali ke app keluarga” untuk memastikan dashboard tampil kembali dan memeriksa apakah alert darurat baru tercatat.
        # Kembali ke app keluarga button
        elem = page.get_by_role("button", name="Kembali ke app keluarga")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The Beranda dashboard is shown again.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The Beranda dashboard is shown.
        await expect(page.locator("#root").nth(0)).to_contain_text("Kabar hari ini", timeout=15000), "The Beranda dashboard is shown."
        
        # --> A new emergency alert records the “Butuh bantuan” response.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The emergency alert records the “Butuh bantuan” response.
        await expect(page.locator("#root").nth(0)).to_contain_text("menekan tombol \"Butuh bantuan\"", timeout=15000), "The emergency alert records the \u201cButuh bantuan\u201d response."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    