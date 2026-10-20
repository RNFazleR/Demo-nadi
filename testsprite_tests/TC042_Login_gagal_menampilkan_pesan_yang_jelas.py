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
        
        # -> Submit the empty login form and verify that both required-field messages are displayed.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Enter “rina-nadi” and “nadi1234,” submit the login form, and check for the malformed-email message.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina-nadi")
        
        # -> Enter “rina-nadi” and “nadi1234,” submit the login form, and check for the malformed-email message.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Enter “rina-nadi” and “nadi1234,” submit the login form, and check for the malformed-email message.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Replace the email and password with the specified incorrect credentials, submit the form, and verify the error message, cleared password field, and “Masuk ke NADI” heading.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Replace the email and password with the specified incorrect credentials, submit the form, and verify the error message, cleared password field, and “Masuk ke NADI” heading.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("salah123")
        
        # -> Replace the email and password with the specified incorrect credentials, submit the form, and verify the error message, cleared password field, and “Masuk ke NADI” heading.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Kredensial yang salah menampilkan pesan ketidakcocokan, mengosongkan kolom kata sandi, dan mempertahankan layar masuk.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Pesan ketidakcocokan kredensial ditampilkan.
        await expect(page.locator("#root").nth(0)).to_contain_text("Email atau kata sandi belum cocok. Coba periksa lagi.", timeout=15000), "Pesan ketidakcocokan kredensial ditampilkan."
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Kolom kata sandi kosong setelah percobaan masuk.
        await expect(page.get_by_role("textbox", name="Kata sandi").nth(0)).to_have_value("", timeout=15000), "Kolom kata sandi kosong setelah percobaan masuk."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    