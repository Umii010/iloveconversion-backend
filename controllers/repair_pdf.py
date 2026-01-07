import sys
import os
import json
import traceback
import tempfile
import shutil

def log_message(message, level="INFO"):
    """Log messages to stderr with JSON format for Node.js to parse"""
    log_entry = {
        "level": level,
        "message": message,
        "timestamp": __import__('time').time()
    }
    print(json.dumps(log_entry), file=sys.stderr)

def analyze_pdf_damage(input_path):
    """Analyze PDF to determine type of damage"""
    try:
        log_message(f"Analyzing PDF: {os.path.basename(input_path)}")
        
        # Get basic file info
        size = os.path.getsize(input_path)
        log_message(f"File size: {size:,} bytes")
        
        if size == 0:
            return {"status": "error", "message": "File is empty", "size": 0}
        
        # Try to read file header
        with open(input_path, 'rb') as f:
            header = f.read(1024)
        
        # Check if it's actually a PDF
        if b'%PDF' not in header:
            return {"status": "error", "message": "Not a valid PDF file", "size": size}
        
        # Check for common corruption signs
        damage_indicators = []
        
        # Check file end
        with open(input_path, 'rb') as f:
            f.seek(-128, 2)  # Last 128 bytes
            trailer = f.read()
            
            if b'%%EOF' not in trailer:
                damage_indicators.append("Missing EOF marker")
            if b'startxref' not in trailer:
                damage_indicators.append("Missing startxref")
        
        # Try to count pages with different methods
        page_counts = {}
        
        # Method 1: Search for page objects
        with open(input_path, 'rb') as f:
            content = f.read()
            page_counts['page_objects'] = content.count(b'/Type /Page')
        
        if page_counts['page_objects'] == 0:
            damage_indicators.append("No page objects found")
        
        return {
            "status": "analyzed",
            "size": size,
            "is_pdf": True,
            "damage_indicators": damage_indicators,
            "estimated_pages": page_counts.get('page_objects', 0),
            "repairable": len(damage_indicators) < 3  # Simple heuristic
        }
        
    except Exception as e:
        log_message(f"Analysis error: {e}", "ERROR")
        return {"status": "error", "message": str(e), "size": size}

def repair_pdf_comprehensive(input_path, output_path):
    """Comprehensive PDF repair with multiple methods"""
    repair_report = {
        "original_file": os.path.basename(input_path),
        "original_size": os.path.getsize(input_path),
        "attempts": [],
        "success": False,
        "repaired_size": 0,
        "pages_recovered": 0,
        "issues_fixed": [],
        "final_status": "failed"
    }
    
    # Method 1: pikepdf (most reliable for minor corruption)
    try:
        log_message("Attempt 1: Using pikepdf...")
        import pikepdf
        
        with pikepdf.open(input_path, allow_overwriting_input=True, strict=False) as pdf:
            pages_recovered = len(pdf.pages)
            pdf.save(output_path)
        
        repaired_size = os.path.getsize(output_path)
        repair_report["attempts"].append({
            "method": "pikepdf",
            "success": True,
            "pages": pages_recovered,
            "size": repaired_size
        })
        repair_report["pages_recovered"] = pages_recovered
        repair_report["repaired_size"] = repaired_size
        repair_report["success"] = True
        repair_report["final_status"] = "repaired"
        repair_report["issues_fixed"].append("File structure repaired")
        
        if pages_recovered > 0:
            repair_report["issues_fixed"].append(f"Recovered {pages_recovered} pages")
        
        log_message(f"✓ pikepdf repair successful! Recovered {pages_recovered} pages")
        return repair_report
        
    except Exception as e:
        repair_report["attempts"].append({
            "method": "pikepdf",
            "success": False,
            "error": str(e)
        })
        log_message(f"pikepdf failed: {e}")
    
    # Method 2: PyPDF with object recovery
    try:
        log_message("Attempt 2: Using PyPDF with object recovery...")
        from pypdf import PdfReader, PdfWriter
        
        reader = PdfReader(input_path, strict=False)
        writer = PdfWriter()
        
        pages_recovered = 0
        for i, page in enumerate(reader.pages):
            try:
                writer.add_page(page)
                pages_recovered += 1
            except Exception as page_error:
                log_message(f"Could not recover page {i}: {page_error}")
                continue
        
        # Try to preserve metadata
        if hasattr(reader, 'metadata') and reader.metadata:
            try:
                writer.add_metadata(reader.metadata)
                repair_report["issues_fixed"].append("Metadata preserved")
            except:
                pass
        
        with open(output_path, 'wb') as f:
            writer.write(f)
        
        repaired_size = os.path.getsize(output_path)
        repair_report["attempts"].append({
            "method": "pypdf",
            "success": True,
            "pages": pages_recovered,
            "size": repaired_size
        })
        
        if pages_recovered > 0:
            repair_report["pages_recovered"] = pages_recovered
            repair_report["repaired_size"] = repaired_size
            repair_report["success"] = True
            repair_report["final_status"] = "partially_repaired"
            repair_report["issues_fixed"].append(f"Recovered {pages_recovered} of {len(reader.pages)} pages")
            log_message(f"✓ PyPDF partially successful! Recovered {pages_recovered} pages")
            return repair_report
        else:
            repair_report["attempts"][-1]["success"] = False
            repair_report["attempts"][-1]["error"] = "No pages could be recovered"
            
    except Exception as e:
        repair_report["attempts"].append({
            "method": "pypdf",
            "success": False,
            "error": str(e)
        })
        log_message(f"PyPDF failed: {e}")
    
    # Method 3: Ghostscript (if available)
    try:
        log_message("Attempt 3: Trying Ghostscript...")
        import subprocess
        
        # Check for Ghostscript
        gs_paths = ['gswin64c', 'gswin32c', 'gs']
        gs_command = None
        
        for gs in gs_paths:
            try:
                subprocess.run([gs, '--version'], capture_output=True, check=True, timeout=5)
                gs_command = gs
                break
            except:
                continue
        
        if gs_command:
            # Create temporary PostScript file
            with tempfile.NamedTemporaryFile(suffix='.ps', delete=False) as temp_ps:
                temp_ps_path = temp_ps.name
            
            # Convert PDF to PS then back to PDF (this can fix many issues)
            cmd1 = [
                gs_command,
                '-o', temp_ps_path,
                '-sDEVICE=ps2write',
                '-dNOPAUSE',
                '-dBATCH',
                '-dSAFER',
                input_path
            ]
            
            cmd2 = [
                gs_command,
                '-o', output_path,
                '-sDEVICE=pdfwrite',
                '-dNOPAUSE',
                '-dBATCH',
                '-dSAFER',
                temp_ps_path
            ]
            
            # Run conversion
            result1 = subprocess.run(cmd1, capture_output=True, text=True, timeout=60)
            if result1.returncode == 0:
                result2 = subprocess.run(cmd2, capture_output=True, text=True, timeout=60)
                
                if result2.returncode == 0 and os.path.exists(output_path):
                    repaired_size = os.path.getsize(output_path)
                    # Try to count pages
                    try:
                        with pikepdf.open(output_path) as pdf:
                            pages_recovered = len(pdf.pages)
                    except:
                        pages_recovered = 0
                    
                    repair_report["attempts"].append({
                        "method": "ghostscript",
                        "success": True,
                        "pages": pages_recovered,
                        "size": repaired_size
                    })
                    
                    if repaired_size > 0:
                        repair_report["repaired_size"] = repaired_size
                        repair_report["pages_recovered"] = pages_recovered
                        repair_report["success"] = True
                        repair_report["final_status"] = "repaired_via_ghostscript"
                        repair_report["issues_fixed"].append("Repaired via Ghostscript conversion")
                        
                        if pages_recovered > 0:
                            repair_report["issues_fixed"].append(f"Recovered {pages_recovered} pages")
                        
                        log_message("✓ Ghostscript repair successful!")
                        return repair_report
            
            # Clean up temp file
            try:
                os.unlink(temp_ps_path)
            except:
                pass
        
        repair_report["attempts"].append({
            "method": "ghostscript",
            "success": False,
            "error": "Ghostscript not available or failed"
        })
        
    except Exception as e:
        repair_report["attempts"].append({
            "method": "ghostscript",
            "success": False,
            "error": str(e)
        })
        log_message(f"Ghostscript failed: {e}")
    
    # All methods failed - create detailed error report
    log_message("❌ All repair methods failed", "ERROR")
    create_error_report_pdf(input_path, output_path, repair_report)
    repair_report["final_status"] = "failed"
    repair_report["issues_fixed"] = ["Could not repair - file is severely corrupted"]
    
    return repair_report

def create_error_report_pdf(input_path, output_path, repair_report):
    """Create a detailed error report PDF"""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        from reportlab.lib import colors
        
        c = canvas.Canvas(output_path, pagesize=letter)
        width, height = letter
        
        # Title
        c.setFont("Helvetica-Bold", 18)
        c.setFillColor(colors.red)
        c.drawCentredString(width/2, height - 50, "⚠️ PDF Repair Failed")
        
        # File info
        c.setFont("Helvetica", 12)
        c.setFillColor(colors.black)
        c.drawString(50, height - 100, f"File: {repair_report['original_file']}")
        c.drawString(50, height - 125, f"Original Size: {repair_report['original_size']:,} bytes")
        
        # Repair attempts
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, height - 160, "Repair Attempts:")
        
        c.setFont("Helvetica", 10)
        y = height - 185
        for attempt in repair_report['attempts']:
            status = "✓" if attempt.get('success') else "✗"
            pages = attempt.get('pages', 'N/A')
            c.drawString(70, y, f"{status} {attempt['method']}: {attempt.get('error', f'{pages} pages')}")
            y -= 20
        
        # Diagnosis
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y - 20, "Diagnosis:")
        
        c.setFont("Helvetica", 10)
        c.drawString(70, y - 45, "The PDF file appears to be severely corrupted or encrypted.")
        c.drawString(70, y - 65, "Automatic repair was not possible.")
        
        # Solutions
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y - 95, "Recommended Actions:")
        
        solutions = [
            "1. Try Adobe Acrobat Pro: Open and use 'Save As' to create a new file",
            "2. Online repair services: Use websites like smallpdf.com or ilovepdf.com",
            "3. Re-download: Get a fresh copy from the original source",
            "4. Source file: Contact the document creator for an uncorrupted version",
            "5. Professional tools: Use dedicated PDF recovery software"
        ]
        
        c.setFont("Helvetica", 10)
        y_solution = y - 120
        for solution in solutions:
            c.drawString(70, y_solution, solution)
            y_solution -= 20
        
        c.save()
        
        # Update repair report
        repair_report["repaired_size"] = os.path.getsize(output_path)
        repair_report["issues_fixed"] = ["Created error report with recovery instructions"]
        
        log_message("Created detailed error report PDF")
        
    except ImportError:
        # Simple PDF without reportlab
        simple_error_pdf = f"""%PDF-1.4
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
<</Length 500>>
stream
BT /F1 18 Tf 50 750 Td (PDF REPAIR FAILED) Tj ET
BT /F1 12 Tf 50 700 Td (File: {repair_report['original_file']}) Tj ET
BT /F1 12 Tf 50 675 Td (Size: {repair_report['original_size']:,} bytes) Tj ET
BT /F1 12 Tf 50 650 Td (Status: Severely corrupted or encrypted) Tj ET
BT /F1 10 Tf 50 600 Td (Try Adobe Acrobat Pro or online repair services) Tj ET
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
520
%%EOF"""
        
        with open(output_path, 'w') as f:
            f.write(simple_error_pdf)
        
        repair_report["repaired_size"] = os.path.getsize(output_path)
        repair_report["issues_fixed"] = ["Created basic error report"]

def main():
    """Main function"""
    log_message("=" * 70)
    log_message("PDF Repair Tool - Comprehensive")
    log_message("=" * 70)
    
    if len(sys.argv) < 3:
        log_message("ERROR: Missing arguments", "ERROR")
        log_message("Usage: python repair_pdf.py <input.pdf> <output.pdf>", "ERROR")
        return json.dumps({"status": "error", "message": "Missing arguments"})
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    if not os.path.exists(input_path):
        error_msg = {"status": "error", "message": "Input file not found"}
        print(json.dumps(error_msg))
        return
    
    # Analyze the PDF first
    analysis = analyze_pdf_damage(input_path)
    
    # Perform comprehensive repair
    repair_report = repair_pdf_comprehensive(input_path, output_path)
    
    # Add analysis to report
    repair_report["analysis"] = analysis
    repair_report["input_file"] = input_path
    repair_report["output_file"] = output_path
    
    # Output final report as JSON
    print(json.dumps(repair_report, indent=2))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        error_report = {
            "status": "error",
            "message": f"Unexpected error: {str(e)}",
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_report))
        sys.exit(1)