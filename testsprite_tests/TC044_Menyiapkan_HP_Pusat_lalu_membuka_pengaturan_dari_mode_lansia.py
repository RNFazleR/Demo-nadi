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
        
        # -> Masuk ke NADI menggunakan akun HP Pusat Sri untuk memulai penyiapan perangkat.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("sri@nadi.id")
        
        # -> Masuk ke NADI menggunakan akun HP Pusat Sri untuk memulai penyiapan perangkat.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Masuk ke NADI menggunakan akun HP Pusat Sri untuk memulai penyiapan perangkat.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Click “Lewati, pakai data demo” to continue to the family-code step.
        # Lewati, pakai data demo button
        elem = page.get_by_role("button", name="Lewati, pakai data demo")
        await elem.click(timeout=10000)
        
        # -> Click “Lanjut” to continue the HP Pusat setup.
        # Lanjut button
        elem = page.get_by_role("button", name="Lanjut")
        await elem.click(timeout=10000)
        
        # -> Click “Mulai” and verify the elder screen displays “Halo Bu Sri” without bottom navigation.
        # Mulai button
        elem = page.get_by_role("button", name="Mulai")
        await elem.click(timeout=10000)
        
        # -> Enter “salah” in the family-settings password field and submit it to verify the rejection message.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("salah")
        
        # -> Enter “salah” in the family-settings password field and submit it to verify the rejection message.
        # Buka pengaturan button
        elem = page.get_by_role("button", name="Buka pengaturan")
        await elem.click(timeout=10000)
        
        # -> Enter the valid account password and open family settings.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Enter the valid account password and open family settings.
        # Buka pengaturan button
        elem = page.get_by_role("button", name="Buka pengaturan")
        await elem.click(timeout=10000)
        
        # -> Click “Kembali ke layar orang tua” and verify that “Halo Bu Sri” appears again.
        # Kembali ke layar orang tua button
        elem = page.get_by_role("button", name="Kembali ke layar orang tua")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The elder screen shows “Halo Bu Sri” again after returning from settings.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The elder screen should show “Halo Bu Sri” after returning from settings.
        await expect(page.locator("#root").nth(0)).to_contain_text("Halo Bu Sri", timeout=15000), "The elder screen should show \u201cHalo Bu Sri\u201d after returning from settings."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    