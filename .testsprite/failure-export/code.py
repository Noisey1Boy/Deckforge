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
        # @@ts-step {"i":1,"type":"action","action":"navigate","selector":null,"desc":"Navigate to VAR_{url}","input":"VAR_{url}","field":null}
        await page.goto("VAR_{url}")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Start the brief' button to open the brief input form.
        # @@ts-step {"i":2,"type":"action","action":"click","selector":"xpath=/html/body/div[2]/main/div[2]/div/section/div/div/div/div/a","desc":"Click 'Start the brief link'","input":null,"field":"251"}
        # Start the brief link
        elem = page.get_by_role("link", name="Start the brief")
        await elem.click(timeout=10000)
        
        # -> Fill the 'A · Brief' textarea with 'Onboarding playbook for new customer success hires' and click the 'Forge the outline' button.
        # @@ts-step {"i":3,"type":"action","action":"fill","selector":"xpath=/html/body/div[2]/main/div[2]/div/section[3]/div/div[2]/textarea","desc":"Fill 'Onboarding playbook for new customer success hires' into Presentation topic text area","input":"Onboarding playbook for new customer success hires","field":"4"}
        # Presentation topic text area
        elem = page.get_by_role("textbox", name="Presentation topic")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Onboarding playbook for new customer success hires")
        
        # -> Fill the 'A · Brief' textarea with 'Onboarding playbook for new customer success hires' and click the 'Forge the outline' button.
        # @@ts-step {"i":4,"type":"action","action":"click","selector":"xpath=/html/body/div[2]/main/div[2]/div/section[3]/div/div[2]/div[4]/button","desc":"Click 'Forge the outline button'","input":null,"field":"96"}
        # Forge the outline button
        elem = page.get_by_role("button", name="Forge the outline")
        await elem.click(timeout=10000)
        
        # -> Click the 'Approve & write 10 slides' button to generate the slides and open the editor.
        # @@ts-step {"i":5,"type":"action","action":"click","selector":"xpath=/html/body/div[2]/main/div/div/div[2]/button[2]","desc":"Click 'Approve & write 10 slides button'","input":null,"field":"3483"}
        # Approve & write 10 slides button
        elem = page.get_by_role("button", name="Approve & write 10 slides")
        await elem.click(timeout=10000)
        
        # -> Open the 'Export' menu in the editor toolbar by clicking the 'Export' button so the export format options are revealed.
        # @@ts-step {"i":6,"type":"action","action":"click","selector":"xpath=/html/body/div[2]/main/div/div/div/div/button[9]","desc":"Click 'Export button'","input":null,"field":"5517"}
        # Export button
        elem = page.get_by_role("button", name="Export")
        await elem.click(timeout=10000)
        
        # -> Open the 'Export' toolbar menu (click the 'Export' button), wait for the dropdown to appear, and search the page for the 'PPTX' export option text to locate it.
        # @@ts-step {"i":7,"type":"action","action":"click","selector":"xpath=/html/body/div[2]/main/div/div/div/div/button[9]","desc":"Click 'Export button'","input":null,"field":"5517"}
        # Export button
        elem = page.get_by_role("button", name="Export")
        await elem.click(timeout=10000)
        
        # -> Open the 'Export' menu in the editor toolbar and search the page for the text 'PPTX' to confirm the PowerPoint export option is present.
        # @@ts-step {"i":8,"type":"action","action":"click","selector":"xpath=/html/body/div[2]/main/div/div/div/div/button[9]","desc":"Click 'Export button'","input":null,"field":"5517"}
        # Export button
        elem = page.get_by_role("button", name="Export")
        await elem.click(timeout=10000)
        
        # -> Open the Export menu by clicking the 'Export' button in the editor toolbar so the export option elements appear.
        # @@ts-step {"i":9,"type":"action","action":"click","selector":"xpath=/html/body/div[2]/main/div/div/div/div/button[9]","desc":"Click 'Export button'","input":null,"field":"5517"}
        # Export button
        elem = page.get_by_role("button", name="Export")
        await elem.click(timeout=10000)
        
        # -> Open the 'Export' menu and select the 'Standalone HTML' export option to trigger a download or success feedback (verify no error toast).
        # @@ts-step {"i":10,"type":"action","action":"click","selector":"xpath=/html/body/div[2]/main/div/div/div/div/button[9]","desc":"Click 'Export button'","input":null,"field":"5517"}
        # Export button
        elem = page.get_by_role("button", name="Export")
        await elem.click(timeout=10000)
        
        # -> Click the 'Standalone HTML' item in the Export dropdown and verify a download or success toast appears (no error toast).
        # Download: Standalone HTML menu item
        elem = page.get_by_role("menuitem", name="Standalone HTML")
        async with page.expect_download(timeout=30000) as dl_info:
            await elem.click(timeout=10000)
        download = await dl_info.value
        assert download.suggested_filename  # verify file was downloaded
        await download.save_as(f"./downloads/{download.suggested_filename}")
        
        # --> Assertions to verify final state
        
        # --> The editor Export control is visible in the toolbar so export options can be opened.
        await page.get_by_role("button", name="Export").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Expected the Export button to be visible in the editor toolbar.
        await expect(page.get_by_role("button", name="Export").nth(0)).to_be_visible(timeout=15000), "Expected the Export button to be visible in the editor toolbar."
        
        # --> Clicking the PPTX / PowerPoint export did not produce a .pptx download or success toast within 60 seconds.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Expected a .pptx download toast to appear within 60 seconds.
        await expect(page.locator("xpath=/html/body/div[2]/section/ol/li").nth(0)).to_contain_text("pptx", timeout=15000), "Expected a .pptx download toast to appear within 60 seconds."
        
        # --> The Standalone HTML export produced a visible success toast and no error toast was observed.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Expected a Standalone HTML success toast to appear after exporting HTML.
        await expect(page.locator("xpath=/html/body/div[2]/section/ol/li").nth(0)).to_contain_text("Standalone HTML downloaded.", timeout=15000), "Expected a Standalone HTML success toast to appear after exporting HTML."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    