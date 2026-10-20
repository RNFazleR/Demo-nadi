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
        
        # -> Kirim formulir Masuk tanpa mengisi Email maupun Kata sandi, lalu periksa pesan validasi yang tampil.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Masukkan email berformat salah dan kata sandi, lalu kirim formulir untuk memverifikasi pesan format email.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina-nadi")
        
        # -> Masukkan email berformat salah dan kata sandi, lalu kirim formulir untuk memverifikasi pesan format email.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("nadi1234")
        
        # -> Masukkan email berformat salah dan kata sandi, lalu kirim formulir untuk memverifikasi pesan format email.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # -> Masukkan email rina@nadi.id dan kata sandi salah123, kirim formulir Masuk, lalu periksa pesan kesalahan, kata sandi kosong, dan judul Masuk ke NADI.
        # email field
        elem = page.get_by_role("textbox", name="Email")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("rina@nadi.id")
        
        # -> Masukkan email rina@nadi.id dan kata sandi salah123, kirim formulir Masuk, lalu periksa pesan kesalahan, kata sandi kosong, dan judul Masuk ke NADI.
        # password field
        elem = page.get_by_role("textbox", name="Kata sandi")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("salah123")
        
        # -> Masukkan email rina@nadi.id dan kata sandi salah123, kirim formulir Masuk, lalu periksa pesan kesalahan, kata sandi kosong, dan judul Masuk ke NADI.
        # Masuk button
        elem = page.get_by_role("button", name="Masuk")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Setelah kredensial ditolak, pesan ketidakcocokan tampil, kolom Kata sandi kosong, dan judul Masuk ke NADI tetap terlihat.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Pesan kredensial tidak cocok ditampilkan.
        await expect(page.locator("#root").nth(0)).to_contain_text("Email atau kata sandi belum cocok. Coba periksa lagi.", timeout=15000), "Pesan kredensial tidak cocok ditampilkan."
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Kolom Kata sandi kosong setelah kredensial ditolak.
        await expect(page.get_by_role("textbox", name="Kata sandi").nth(0)).to_have_value("", timeout=15000), "Kolom Kata sandi kosong setelah kredensial ditolak."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    