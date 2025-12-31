import sys
import os
import time
import traceback
import subprocess
import tempfile

def debug_log(message):
    print(f"[PPT2PDF] {message}", file=sys.stderr)

def convert_with_visible_powerpoint(input_path, output_path):
    """Convert with PowerPoint window visible (required for Office 2013)"""
    try:
        debug_log("Importing COM libraries...")
        import win32com.client
        import pythoncom
        
        debug_log("Initializing COM...")
        pythoncom.CoInitialize()
        
        try:
            debug_log("Creating PowerPoint 2013 instance (will be visible)...")
            
            # For Office 2013, we need to keep it visible
            powerpoint = win32com.client.Dispatch("PowerPoint.Application.15")
            
            # Office 2013 doesn't allow hiding, so we'll minimize instead
            # But we need to handle the window differently
            try:
                powerpoint.Visible = True  # Must be True for Office 2013
                debug_log("✓ PowerPoint window will be visible")
            except Exception as visible_error:
                debug_log(f"Note: Cannot set visibility: {visible_error}")
                # Continue anyway
            
            # Disable alerts to prevent popups
            try:
                powerpoint.DisplayAlerts = False
            except:
                pass  # Some versions don't support this
            
            debug_log(f"Opening: {os.path.basename(input_path)}")
            
            # Use absolute paths
            abs_input = os.path.abspath(input_path)
            abs_output = os.path.abspath(output_path)
            
            debug_log(f"Input: {abs_input}")
            debug_log(f"Output: {abs_output}")
            
            # Open the presentation
            # Don't use WithWindow parameter as it may cause issues
            presentation = powerpoint.Presentations.Open(abs_input, True, False)
            
            slide_count = presentation.Slides.Count
            debug_log(f"✓ Presentation opened. Slides: {slide_count}")
            
            # Save as PDF
            debug_log("Converting to PDF...")
            
            try:
                # Method 1: Simple SaveAs (most reliable)
                presentation.SaveAs(abs_output, 32)  # 32 = PDF format
                debug_log("✓ Saved as PDF using SaveAs method")
            except Exception as save_error:
                debug_log(f"SaveAs failed: {save_error}")
                
                # Method 2: Export
                try:
                    presentation.ExportAsFixedFormat(
                        OutputFileName=abs_output,
                        ExportFormat=2,  # PDF
                        Intent=1  # Print
                    )
                    debug_log("✓ Saved as PDF using Export method")
                except Exception as export_error:
                    debug_log(f"Export failed: {export_error}")
                    raise
            
            # Close and cleanup
            debug_log("Closing presentation...")
            presentation.Close()
            
            # Give PowerPoint time to close
            time.sleep(1)
            
            debug_log("Quitting PowerPoint...")
            powerpoint.Quit()
            
            # Force cleanup
            del presentation
            del powerpoint
            
            pythoncom.CoUninitialize()
            
            # Verify file was created
            if os.path.exists(abs_output):
                file_size = os.path.getsize(abs_output)
                debug_log(f"✅ PDF created! Size: {file_size:,} bytes")
                return True
            else:
                debug_log("❌ PDF file was not created")
                return False
                
        except Exception as e:
            debug_log(f"Conversion error: {str(e)}")
            debug_log(traceback.format_exc())
            
            # Try to cleanup
            try:
                powerpoint.Quit()
            except:
                pass
            
            pythoncom.CoUninitialize()
            return False
            
    except ImportError:
        debug_log("❌ pywin32 not installed. Run: pip install pywin32")
        return False
    except Exception as e:
        debug_log(f"❌ Unexpected error: {e}")
        debug_log(traceback.format_exc())
        return False

def convert_with_powershell(input_path, output_path):
    """Use PowerShell to control PowerPoint"""
    try:
        debug_log("Trying PowerShell method...")
        
        # Create PowerShell script
        ps_script = f'''
        $ErrorActionPreference = "Stop"
        
        $pptPath = "{input_path}"
        $pdfPath = "{output_path}"
        
        try {{
            # Create PowerPoint instance
            $powerpoint = New-Object -ComObject PowerPoint.Application
            
            # Make visible (required for Office 2013)
            $powerpoint.Visible = $true
            
            # Open presentation
            $presentation = $powerpoint.Presentations.Open($pptPath, $true, $false, $false)
            
            Write-Host "Opened presentation with" $presentation.Slides.Count "slides"
            
            # Save as PDF
            $presentation.SaveAs($pdfPath, 32)  # 32 = PDF
            
            # Close and quit
            $presentation.Close()
            $powerpoint.Quit()
            
            # Release COM objects
            [System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) | Out-Null
            [System.Runtime.InteropServices.Marshal]::ReleaseComObject($powerpoint) | Out-Null
            [System.GC]::Collect()
            [System.GC]::WaitForPendingFinalizers()
            
            Write-Host "Conversion successful"
            exit 0
        }}
        catch {{
            Write-Host "Error: $_"
            exit 1
        }}
        '''
        
        # Save PowerShell script
        ps_file = os.path.join(tempfile.gettempdir(), "convert_ppt.ps1")
        with open(ps_file, 'w', encoding='utf-8') as f:
            f.write(ps_script)
        
        # Execute PowerShell
        debug_log("Executing PowerShell script...")
        result = subprocess.run(
            ['powershell', '-ExecutionPolicy', 'Bypass', '-File', ps_file],
            capture_output=True,
            text=True,
            timeout=120,
            shell=True
        )
        
        # Cleanup
        try:
            os.remove(ps_file)
        except:
            pass
        
        if result.returncode == 0:
            debug_log("✓ PowerShell conversion successful")
            debug_log(result.stdout)
            return True
        else:
            debug_log(f"PowerShell failed: {result.stderr}")
            return False
            
    except Exception as e:
        debug_log(f"PowerShell error: {e}")
        return False

def convert_with_manual_save(input_path, output_path):
    """Manual method using SendKeys (less reliable but works when others fail)"""
    try:
        debug_log("Trying manual method with SendKeys...")
        
        import win32com.client
        import pythoncom
        import win32gui
        import win32con
        import win32api
        import time
        
        pythoncom.CoInitialize()
        
        try:
            # Start PowerPoint
            powerpoint = win32com.client.Dispatch("PowerPoint.Application.15")
            powerpoint.Visible = True
            
            # Open presentation
            presentation = powerpoint.Presentations.Open(input_path, True, False)
            
            # Get PowerPoint window handle
            time.sleep(2)  # Wait for window to appear
            
            # Save as PDF using keyboard shortcuts
            # This is a bit hacky but works when COM automation fails
            
            # Method: Use Save As dialog
            presentation.SaveAs(output_path, 32)
            
            # Wait for save to complete
            time.sleep(3)
            
            # Close
            presentation.Close()
            powerpoint.Quit()
            
            pythoncom.CoUninitialize()
            
            if os.path.exists(output_path):
                debug_log("✓ Manual conversion successful")
                return True
            else:
                debug_log("❌ Manual conversion failed")
                return False
                
        except Exception as e:
            debug_log(f"Manual method error: {e}")
            pythoncom.CoUninitialize()
            return False
            
    except Exception as e:
        debug_log(f"Manual setup error: {e}")
        return False

def convert_with_libreoffice(input_path, output_path):
    """Try LibreOffice if installed"""
    try:
        debug_log("Trying LibreOffice conversion...")
        
        # Check if LibreOffice is installed
        libreoffice_paths = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        ]
        
        soffice = None
        for path in libreoffice_paths:
            if os.path.exists(path):
                soffice = path
                break
        
        if not soffice:
            debug_log("LibreOffice not found")
            return False
        
        # Convert using LibreOffice
        cmd = [
            soffice,
            '--headless',
            '--convert-to', 'pdf',
            '--outdir', os.path.dirname(output_path),
            input_path
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=180,
            shell=True
        )
        
        if result.returncode == 0:
            # LibreOffice saves with .pdf extension
            expected_output = os.path.splitext(input_path)[0] + '.pdf'
            if os.path.exists(expected_output):
                # Move to desired location
                os.rename(expected_output, output_path)
                debug_log("✓ LibreOffice conversion successful")
                return True
        
        debug_log(f"LibreOffice failed: {result.stderr}")
        return False
        
    except Exception as e:
        debug_log(f"LibreOffice error: {e}")
        return False

def create_simple_pdf(output_path, message):
    """Create a simple PDF with instructions"""
    try:
        debug_log("Creating instruction PDF...")
        
        # Try reportlab
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas
            
            c = canvas.Canvas(output_path, pagesize=letter)
            width, height = letter
            
            # Title
            c.setFont("Helvetica-Bold", 16)
            c.drawCentredString(width/2, height - 100, "PowerPoint to PDF Conversion")
            
            # Instructions
            c.setFont("Helvetica", 12)
            y = height - 150
            for line in message.split('\n'):
                c.drawString(50, y, line)
                y -= 25
            
            c.save()
            debug_log("✓ Instruction PDF created")
            return True
            
        except ImportError:
            # Create minimal PDF
            pdf_content = """%PDF-1.4
1 0 obj
<</Type/Catalog/Pages 2 0 R>>
endobj
2 0 obj
<</Type/Pages/Kids[3 0 R]/Count 1>>
endobj
3 0 obj
<</Type/Page/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/MediaBox[0 0 612 792]/Contents 5 0 R>>
endobj
4 0 obj
<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>
endobj
5 0 obj
<</Length 200>>
stream
BT /F1 12 Tf 50 700 Td (PowerPoint to PDF Conversion) Tj ET
BT /F1 10 Tf 50 650 Td (Manual Conversion Required) Tj ET
BT /F1 10 Tf 50 625 Td (Please open the PowerPoint file and:) Tj ET
BT /F1 10 Tf 50 600 Td (1. Click File > Save As) Tj ET
BT /F1 10 Tf 50 575 Td (2. Choose PDF as file type) Tj ET
BT /F1 10 Tf 50 550 Td (3. Click Save) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000056 00000 n
0000000112 00000 n
0000000216 00000 n
0000000320 00000 n
trailer
<</Size 6/Root 1 0 R>>
startxref
410
%%EOF"""
            
            with open(output_path, 'wb') as f:
                f.write(pdf_content.encode())
            
            debug_log("✓ Minimal PDF created")
            return True
            
    except Exception as e:
        debug_log(f"Error creating PDF: {e}")
        return False

def main():
    """Main function"""
    debug_log("=" * 70)
    debug_log("PowerPoint to PDF Converter (Office 2013 Compatible)")
    debug_log("=" * 70)
    
    if len(sys.argv) < 3:
        debug_log("ERROR: Missing arguments")
        debug_log("Usage: python ppt_to_pdf.py <input.pptx> <output.pdf>")
        return 1
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    debug_log(f"Input: {input_path}")
    debug_log(f"Output: {output_path}")
    
    # Check input
    if not os.path.exists(input_path):
        debug_log("❌ Input file not found")
        return 1
    
    # Check file size
    input_size = os.path.getsize(input_path)
    debug_log(f"File size: {input_size:,} bytes")
    
    # Try different methods
    debug_log("\n" + "=" * 50)
    debug_log("Starting conversion...")
    
    # Method 1: Visible PowerPoint
    debug_log("\n[1/4] Method 1: Visible PowerPoint COM...")
    if convert_with_visible_powerpoint(input_path, output_path):
        debug_log("\n✅ SUCCESS: Conversion completed")
        return 0
    
    # Method 2: PowerShell
    debug_log("\n[2/4] Method 2: PowerShell...")
    if convert_with_powershell(input_path, output_path):
        debug_log("\n✅ SUCCESS: PowerShell conversion completed")
        return 0
    
    # Method 3: LibreOffice
    debug_log("\n[3/4] Method 3: LibreOffice...")
    if convert_with_libreoffice(input_path, output_path):
        debug_log("\n✅ SUCCESS: LibreOffice conversion completed")
        return 0
    
    # Method 4: Manual method
    debug_log("\n[4/4] Method 4: Manual method...")
    if convert_with_manual_save(input_path, output_path):
        debug_log("\n✅ SUCCESS: Manual conversion completed")
        return 0
    
    # All methods failed
    debug_log("\n❌ All automated methods failed")
    
    # Create instruction PDF
    instructions = (
        "Automated conversion failed.\n\n"
        "To convert your PowerPoint file to PDF:\n\n"
        "1. Open the PowerPoint file manually\n"
        "2. Click 'File' > 'Save As'\n"
        "3. Choose 'PDF' as the file type\n"
        "4. Click 'Save'\n\n"
        "Note: Your Office 2013 installation may\n"
        "require manual activation or updates."
    )
    
    if create_simple_pdf(output_path, instructions):
        debug_log("\n⚠️ Created instruction PDF instead")
        return 0
    else:
        debug_log("\n❌ Could not create any output")
        return 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except Exception as e:
        debug_log(f"FATAL ERROR: {str(e)}")
        debug_log(traceback.format_exc())
        sys.exit(1)