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
        
        # -> Sign in to NADI with the provided demo account to reach the home screen.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Sign in to NADI with the provided demo account to reach the home screen.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Sign in to NADI with the provided demo account to reach the home screen.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Trigger the demo anomaly flow using the visible “Simulasikan anomali” control and inspect its result.
        # Simulasikan anomali button
        elem = page.get_by_role("button", name="Simulasikan anomali")
        await elem.click(timeout=10000)
        
        # -> Pilih “Butuh bantuan” pada prompt Ibu Sri untuk melanjutkan alur alert darurat.
        # Butuh bantuan button
        elem = page.get_by_role("button", name="Butuh bantuan")
        await elem.click(timeout=10000)
        
        # -> Close the simulated call screen using “Kembali ke app keluarga” and verify the emergency alert remains in follow-up status.
        # Kembali ke app keluarga button
        elem = page.get_by_role("button", name="Kembali ke app keluarga")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The emergency alert remains in follow-up with a prompt to contact Ibu Sri Wahyuni.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The alert still shows its follow-up contact message.
        await expect(page.locator("#root").nth(0)).to_contain_text("Butuh perhatian sekarang, segera hubungi", timeout=15000), "The alert still shows its follow-up contact message."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    