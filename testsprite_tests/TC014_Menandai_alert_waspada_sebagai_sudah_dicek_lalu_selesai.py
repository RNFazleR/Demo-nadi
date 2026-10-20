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
        
        # -> Masuk ke NADI menggunakan akun keluarga Rina.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Masuk ke NADI menggunakan akun keluarga Rina.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Masuk ke NADI menggunakan akun keluarga Rina.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Trigger a new Waspada alert by selecting “Simulasikan pola berubah” on Beranda.
        # Simulasikan pola berubah button
        elem = page.get_by_role("button", name="Simulasikan pola berubah")
        await elem.click(timeout=10000)
        
        # -> Buka tab “Notifikasi” untuk melihat alert Waspada yang baru dibuat.
        # 1 Notifikasi Notifikasi button
        elem = page.get_by_role("button", name="Notifikasi, 1 belum ditanggapi")
        await elem.click(timeout=10000)
        
        # -> Buka alert berlabel “Waspada” dan “Baru” untuk melihat tindakan tindak lanjut yang tersedia.
        # Waspada Baru Pagi ini gerakan Ibu Sri Wahyuni... button
        elem = page.get_by_role("button", name="Waspada Baru Pagi ini gerakan")
        await elem.click(timeout=10000)
        
        # -> Tandai alert Waspada baru sebagai sudah dicek dan periksa tindakan lanjutan yang muncul.
        # Tandai sudah dicek button
        elem = page.get_by_role("button", name="Tandai sudah dicek")
        await elem.click(timeout=10000)
        
        # -> Klik “Tandai selesai” pada detail alert Waspada untuk menyelesaikan tindak lanjut.
        # Tandai selesai button
        elem = page.get_by_role("button", name="Tandai selesai")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Respons tercatat ditampilkan pada detail alert.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Detail alert menampilkan respons yang tercatat.
        await expect(page.locator("#root").nth(0)).to_contain_text("Respons tercatat", timeout=15000), "Detail alert menampilkan respons yang tercatat."
        
        # --> Alert ditampilkan dengan status Selesai.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Detail alert menunjukkan status Selesai.
        await expect(page.locator("#root").nth(0)).to_contain_text("Selesai", timeout=15000), "Detail alert menunjukkan status Selesai."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    