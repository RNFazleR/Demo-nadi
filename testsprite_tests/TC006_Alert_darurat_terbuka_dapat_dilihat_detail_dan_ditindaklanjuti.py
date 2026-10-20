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
        
        # -> Masukkan kredensial demo pada kolom Email dan Kata sandi, lalu pilih tombol Masuk untuk membuka Beranda.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Masukkan kredensial demo pada kolom Email dan Kata sandi, lalu pilih tombol Masuk untuk membuka Beranda.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Masukkan kredensial demo pada kolom Email dan Kata sandi, lalu pilih tombol Masuk untuk membuka Beranda.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Open the emergency alert using “Lihat & tindak lanjuti” to view its details.
        # Lihat & tindak lanjuti button
        elem = page.get_by_role("button", name="Lihat & tindak lanjuti")
        await elem.click(timeout=10000)
        
        # -> Mark the emergency alert as complete using “Tandai selesai,” then verify the updated handling status.
        # Tandai selesai button
        elem = page.get_by_role("button", name="Tandai selesai")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Detail alert Darurat ditampilkan.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The alert detail view is displayed.
        await expect(page.locator("#root").nth(0)).to_contain_text("Apa yang terdeteksi", timeout=15000), "The alert detail view is displayed."
        
        # --> Status alert menunjukkan “Selesai”.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The alert is marked as completed.
        await expect(page.locator("#root").nth(0)).to_contain_text("Selesai", timeout=15000), "The alert is marked as completed."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    