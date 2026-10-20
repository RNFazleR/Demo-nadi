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
        
        # -> Isi Email dan Kata sandi dengan kredensial demo, lalu pilih tombol Masuk.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Isi Email dan Kata sandi dengan kredensial demo, lalu pilih tombol Masuk.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Isi Email dan Kata sandi dengan kredensial demo, lalu pilih tombol Masuk.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Open Pengaturan and check whether the Akun section shows Rina Wahyuni and rina@nadi.id.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Click “Keluar” and verify the login heading and logout confirmation message appear.
        # Keluar button
        elem = page.get_by_role("button", name="Keluar")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> After logout and reload, the login screen remains visible with the logout confirmation.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The login heading is visible after reload.
        await expect(page.locator("#root").nth(0)).to_contain_text("Masuk ke NADI", timeout=15000), "The login heading is visible after reload."
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The logout confirmation is visible after reload.
        await expect(page.locator("#root").nth(0)).to_contain_text("Kamu sudah keluar. Masuk lagi kapan saja.", timeout=15000), "The logout confirmation is visible after reload."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    