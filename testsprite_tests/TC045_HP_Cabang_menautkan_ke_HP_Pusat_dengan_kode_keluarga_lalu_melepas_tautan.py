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
        
        # -> Masukkan kredensial Budi dan masuk untuk memeriksa alur tautkan HP orang tua.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("budi@nadi.id")
        
        # -> Masukkan kredensial Budi dan masuk untuk memeriksa alur tautkan HP orang tua.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Masukkan kredensial Budi dan masuk untuk memeriksa alur tautkan HP orang tua.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Submit the empty family-code form and verify the displayed validation message.
        # Tautkan button
        elem = page.get_by_role("button", name="Tautkan")
        await elem.click(timeout=10000)
        
        # -> Enter the incorrect family code “111 111” and submit it to verify the rejection message.
        # text field
        elem = page.get_by_role("textbox", name="Kode keluarga (6 angka)")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("111 111")
        
        # -> Enter the incorrect family code “111 111” and submit it to verify the rejection message.
        # Tautkan button
        elem = page.get_by_role("button", name="Tautkan")
        await elem.click(timeout=10000)
        
        # -> Replace the family code with “482 917” and submit it using “Tautkan”.
        # text field
        elem = page.get_by_role("textbox", name="Kode keluarga (6 angka)")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("482 917")
        
        # -> Replace the family code with “482 917” and submit it using “Tautkan”.
        # Tautkan button
        elem = page.get_by_role("button", name="Tautkan")
        await elem.click(timeout=10000)
        
        # -> Open “Pengaturan” from the bottom navigation and verify the linked account details.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Click “Lepas tautan” in the Akun section and verify the confirmation dialog appears.
        # Lepas tautan button
        elem = page.get_by_role("button", name="Lepas tautan")
        await elem.click(timeout=10000)
        
        # -> Confirm unlinking with “Ya, lepas tautan” and verify that “Tautkan ke HP orang tua” appears again.
        # Ya, lepas tautan button
        elem = page.get_by_role("button", name="Ya, lepas tautan")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Setelah tautan dilepas, layar kembali menampilkan “Tautkan ke HP orang tua”.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The family-linking heading is displayed again after unlinking.
        await expect(page.locator("#root").nth(0)).to_contain_text("Tautkan ke HP orang tua", timeout=15000), "The family-linking heading is displayed again after unlinking."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    