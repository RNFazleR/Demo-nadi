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
        
        # -> Masuk ke aplikasi keluarga menggunakan akun rina@nadi.id dan kata sandi demo.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Masuk ke aplikasi keluarga menggunakan akun rina@nadi.id dan kata sandi demo.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Masuk ke aplikasi keluarga menggunakan akun rina@nadi.id dan kata sandi demo.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Buka tab Pengaturan untuk menemukan pilihan sumber sensor langsung.
        # Pengaturan Pengaturan button
        elem = page.get_by_role("button", name="Pengaturan")
        await elem.click(timeout=10000)
        
        # -> Select “Sensor langsung (lewat HP Pusat)” in Pengaturan, then verify the resulting live state on Beranda.
        # data-source radio button
        elem = page.get_by_role("radio", name="Sensor langsung (lewat HP")
        await elem.click(timeout=10000)
        
        # -> Open the “Beranda” tab and verify the live sensor status and technical details shown there.
        # Beranda Beranda button
        elem = page.get_by_role("button", name="Beranda")
        await elem.click(timeout=10000)
        
        # -> Buka “Detail teknis” pada kartu Sensor gerak dan periksa informasi teknis yang ditampilkan.
        # Detail teknis Skor perubahan sinyal – Batas gerak...
        elem = page.get_by_text("Detail teknisSkor perubahan")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Beranda menampilkan chip “Sensor langsung”.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Tampilkan chip “Sensor langsung” di Beranda.
        await expect(page.get_by_role("main").nth(0)).to_contain_text("Sensor langsung", timeout=15000), "Tampilkan chip \u201cSensor langsung\u201d di Beranda."
        
        # --> Kartu Sensor gerak menampilkan status “Sensor terputus”.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Tampilkan status “Sensor terputus” pada kartu sensor.
        await expect(page.locator("#root").nth(0)).to_contain_text("Sensor terputus", timeout=15000), "Tampilkan status \u201cSensor terputus\u201d pada kartu sensor."
        
        # --> Beranda menampilkan label “Gerakan terakhir” dan “Data terakhir diterima”.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Tampilkan label “Gerakan terakhir”.
        await expect(page.locator("#root").nth(0)).to_contain_text("Gerakan terakhir", timeout=15000), "Tampilkan label \u201cGerakan terakhir\u201d."
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Tampilkan label “Data terakhir diterima”.
        await expect(page.locator("#root").nth(0)).to_contain_text("Data terakhir diterima", timeout=15000), "Tampilkan label \u201cData terakhir diterima\u201d."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    