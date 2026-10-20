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
        
        # -> Sign in to NADI as Sri using the provided demo credentials.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("sri@nadi.id")
        
        # -> Sign in to NADI as Sri using the provided demo credentials.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Sign in to NADI as Sri using the provided demo credentials.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Choose “Lewati, pakai data demo” to continue setup using demo data.
        # Lewati, pakai data demo button
        elem = page.get_by_role("button", name="Lewati, pakai data demo")
        await elem.click(timeout=10000)
        
        # -> Continue setup by selecting “Lanjut” on the family-code screen.
        # Lanjut button
        elem = page.get_by_role("button", name="Lanjut")
        await elem.click(timeout=10000)
        
        # -> Click “Mulai” to finish setup and open Sri’s HP Pusat screen.
        # Mulai button
        elem = page.get_by_role("button", name="Mulai")
        await elem.click(timeout=10000)
        
        # -> Open “Tampilkan pertanyaan konfirmasi” and verify that the question appears.
        # Tampilkan pertanyaan konfirmasi button
        elem = page.get_by_role("button", name="Tampilkan pertanyaan")
        await elem.click(timeout=10000)
        
        # -> Select “Butuh bantuan” and verify the confirmation message and “Selesai” button.
        # Butuh bantuan button
        elem = page.get_by_role("button", name="Butuh bantuan")
        await elem.click(timeout=10000)
        
        # -> Click “Selesai” to return to Sri’s HP Pusat screen and continue the family-settings flow.
        # Selesai button
        elem = page.get_by_role("button", name="Selesai")
        await elem.click(timeout=10000)
        
        # -> Open “Pengaturan (untuk keluarga)” from Sri’s HP Pusat screen.
        # Pengaturan (untuk keluarga) Tekan dan tahan button
        elem = page.get_by_role("button", name="Pengaturan (untuk keluarga)")
        await elem.click(timeout=10000)
        
        # -> Use Enter on the “Pengaturan (untuk keluarga)” control to open the family-settings password prompt.
        # Pengaturan (untuk keluarga) Tekan dan tahan button
        elem = page.get_by_role("button", name="Pengaturan (untuk keluarga)")
        await elem.click(timeout=10000)
        
        # -> Enter the provided account password and open the family settings.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Enter the provided account password and open the family settings.
        # Buka pengaturan button
        elem = page.get_by_role("button", name="Buka pengaturan")
        await elem.click(timeout=10000)
        
        # -> Select “Keluar dari akun” in Sri’s settings to return to the sign-in screen.
        # Keluar dari akun button
        elem = page.get_by_role("button", name="Keluar dari akun")
        await elem.click(timeout=10000)
        
        # -> Sign in as Rina using the visible email and password fields, then verify her family app status.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Sign in as Rina using the visible email and password fields, then verify her family app status.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Sign in as Rina using the visible email and password fields, then verify her family app status.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Open the “Notifikasi” tab and verify it shows one pending item.
        # 1 Notifikasi Notifikasi button
        elem = page.get_by_role("button", name="Notifikasi, 1 belum ditanggapi")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Notifikasi menunjukkan 1 item yang perlu ditanggapi.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Notifikasi menampilkan 1 item yang perlu ditanggapi.
        await expect(page.locator("#root").nth(0)).to_contain_text("Perlu ditanggapi (1)", timeout=15000), "Notifikasi menampilkan 1 item yang perlu ditanggapi."
        
        # --> Notifikasi Darurat menyebut Ibu Sri menekan “Butuh bantuan”.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Notifikasi Darurat menyebut jawaban “Butuh bantuan” dari Ibu Sri.
        await expect(page.get_by_label("Perlu ditanggapi (1)").get_by_role("button").nth(0)).to_contain_text("Ibu Sri Wahyuni menekan tombol \"Butuh bantuan\" di pertanyaan konfirmasi NADI.", timeout=15000), "Notifikasi Darurat menyebut jawaban \u201cButuh bantuan\u201d dari Ibu Sri."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    