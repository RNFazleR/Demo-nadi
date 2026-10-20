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
        
        # -> Masuk ke aplikasi keluarga dengan email rina@nadi.id dan kata sandi nadi1234.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Masuk ke aplikasi keluarga dengan email rina@nadi.id dan kata sandi nadi1234.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Masuk ke aplikasi keluarga dengan email rina@nadi.id dan kata sandi nadi1234.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Open “Pratinjau HP Pusat” to reach the elder confirmation screen.
        # Pratinjau HP Pusat button
        elem = page.get_by_role("button", name="Pratinjau HP Pusat")
        await elem.click(timeout=10000)
        
        # -> Return to the family app and check the alert history or notifications for the new emergency alert.
        # Kembali ke app keluarga button
        elem = page.get_by_role("button", name="Kembali ke app keluarga")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The family app shows that Ibu Sri Wahyuni needs to be contacted after the unanswered confirmation.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The family app should indicate that Ibu Sri Wahyuni needs to be contacted.
        await expect(page.locator("#root").nth(0)).to_contain_text("segera hubungi Ibu Sri Wahyuni", timeout=15000), "The family app should indicate that Ibu Sri Wahyuni needs to be contacted."
        
        # --> The emergency alert is recorded in the family app.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The family app should show that the emergency alert was recorded.
        await expect(page.locator("#root").nth(0)).to_contain_text("Tercatat pukul", timeout=15000), "The family app should show that the emergency alert was recorded."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    