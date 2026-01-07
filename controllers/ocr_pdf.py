# ocr_pdf.py - Creates PDF with selectable/searchable OCR text
import sys
import os
import io
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import tempfile

# Remove PIL image size limit
Image.MAX_IMAGE_PIXELS = None

# Fix Windows encoding
if os.name == 'nt':
    import codecs
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def create_searchable_pdf(input_path, output_path, dpi=200):
    """
    Create a PDF with selectable/searchable OCR text overlay
    """
    try:
        print(f"Creating searchable PDF...")
        print(f"Input: {input_path}")
        print(f"Output: {output_path}")
        
        # Open source PDF
        source_doc = fitz.open(input_path)
        total_pages = len(source_doc)
        print(f"Total pages: {total_pages}")
        
        # Create new PDF document
        output_doc = fitz.open()
        
        for page_num in range(total_pages):
            print(f"Processing page {page_num + 1}/{total_pages}...")
            
            source_page = source_doc.load_page(page_num)
            
            # Convert page to image with reasonable DPI
            pix = source_page.get_pixmap(dpi=dpi)
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))
            
            # Perform OCR to get text and bounding boxes
            ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
            
            # Create a new page with same dimensions
            new_page = output_doc.new_page(
                width=source_page.rect.width,
                height=source_page.rect.height
            )
            
            # Add original page as background image (optional)
            # If you want clean text without background, comment this line
            new_page.show_pdf_page(new_page.rect, source_doc, page_num)
            
            # Add OCR text as selectable text layer
            n_boxes = len(ocr_data['text'])
            for i in range(n_boxes):
                text = ocr_data['text'][i].strip()
                if text:  # Only add non-empty text
                    # Get coordinates (convert from image to PDF coordinates)
                    x = ocr_data['left'][i]
                    y = ocr_data['top'][i]
                    w = ocr_data['width'][i]
                    h = ocr_data['height'][i]
                    
                    # Calculate PDF coordinates (scale from image to PDF)
                    scale_x = source_page.rect.width / pix.width
                    scale_y = source_page.rect.height / pix.height
                    
                    pdf_x = x * scale_x
                    pdf_y = y * scale_y
                    pdf_w = w * scale_x
                    pdf_h = h * scale_y
                    
                    # Create text rectangle
                    text_rect = fitz.Rect(pdf_x, pdf_y, pdf_x + pdf_w, pdf_y + pdf_h)
                    
                    # Add text with appropriate font size
                    # Font size based on bounding box height
                    font_size = pdf_h * 0.8  # Adjust as needed
                    
                    try:
                        new_page.insert_textbox(
                            text_rect,
                            text,
                            fontsize=font_size,
                            fontname="helv",  # Standard PDF font
                            color=(0, 0, 0),  # Black text (visible)
                            overlay=True  # Place on top
                        )
                    except:
                        # Fallback: simpler text insertion
                        new_page.insert_text(
                            (pdf_x, pdf_y + pdf_h),
                            text,
                            fontsize=font_size,
                            color=(0, 0, 0)
                        )
            
            # Cleanup
            del pix
            del img
            del img_data
        
        # Save the PDF with text layer
        output_doc.save(output_path)
        output_doc.close()
        source_doc.close()
        
        print(f"SUCCESS: Searchable PDF created: {output_path}")
        return True
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False

def create_simple_searchable_pdf(input_path, output_path, dpi=150):
    """
    Simpler version for better compatibility
    """
    try:
        print(f"Creating OCR PDF with selectable text...")
        
        source_doc = fitz.open(input_path)
        output_doc = fitz.open()
        
        for page_num in range(len(source_doc)):
            print(f"Page {page_num + 1}/{len(source_doc)}")
            
            source_page = source_doc[page_num]
            
            # Convert to image
            pix = source_page.get_pixmap(dpi=dpi)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            
            # Get OCR text
            ocr_text = pytesseract.image_to_string(img)
            
            # Create new page
            new_page = output_doc.new_page(
                width=source_page.rect.width,
                height=source_page.rect.height
            )
            
            # Add original as background (optional - comment if you want text-only)
            new_page.show_pdf_page(new_page.rect, source_doc, page_num)
            
            # Add OCR text as invisible but selectable layer
            # Using a trick: white text on white background = invisible but selectable
            if ocr_text.strip():
                # Add text in a way that makes it selectable
                text_rect = fitz.Rect(50, 50, source_page.rect.width - 50, source_page.rect.height - 50)
                
                new_page.insert_textbox(
                    text_rect,
                    ocr_text,
                    fontsize=12,  # Reasonable size
                    fontname="helv",
                    color=(0, 0, 0),  # BLACK TEXT - VISIBLE
                    # OR for invisible but selectable: color=(1, 1, 1) for white on white background
                    overlay=True
                )
            
            del pix
            del img
        
        output_doc.save(output_path)
        output_doc.close()
        source_doc.close()
        
        print(f"SUCCESS: PDF created: {output_path}")
        return True
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False

def create_pdf_with_ocr_layer(input_path, output_path, dpi=150):
    """
    Method 3: Create PDF with OCR text as annotation/layer
    """
    try:
        print("Method: OCR text as overlay layer")
        
        doc = fitz.open(input_path)
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Get page as image
            pix = page.get_pixmap(dpi=dpi)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            
            # Get OCR data with positions
            ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
            
            # Add text annotations for each word
            for i in range(len(ocr_data['text'])):
                text = ocr_data['text'][i].strip()
                if text and int(ocr_data['conf'][i]) > 60:  # Confidence > 60%
                    # Get coordinates
                    x = ocr_data['left'][i]
                    y = ocr_data['top'][i]
                    w = ocr_data['width'][i]
                    h = ocr_data['height'][i]
                    
                    # Convert to PDF coordinates
                    scale_x = page.rect.width / pix.width
                    scale_y = page.rect.height / pix.height
                    
                    rect = fitz.Rect(
                        x * scale_x,
                        y * scale_y,
                        (x + w) * scale_x,
                        (y + h) * scale_y
                    )
                    
                    # Add annotation (invisible but selectable)
                    annot = page.add_freetext_annot(
                        rect,
                        text,
                        fontsize=10,
                        text_color=(0, 0, 0),  # Visible text
                        fill_color=(1, 1, 1)    # White background
                    )
                    annot.set_opacity(0.3)  # Semi-transparent
            
            del pix
            del img
        
        # Save with incremental update to preserve original
        doc.save(output_path, incremental=True, encryption=False)
        doc.close()
        
        print(f"SUCCESS: PDF with OCR layer: {output_path}")
        return True
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python ocr_pdf.py <input_pdf> <output_pdf>")
        print("Example: python ocr_pdf.py scanned.pdf searchable.pdf")
        sys.exit(1)
    
    input_pdf = sys.argv[1]
    output_pdf = sys.argv[2]
    
    if not os.path.exists(input_pdf):
        print(f"ERROR: Input file not found: {input_pdf}")
        sys.exit(1)
    
    # Try different methods until one works
    methods = [
        create_searchable_pdf,
        create_simple_searchable_pdf,
        create_pdf_with_ocr_layer
    ]
    
    success = False
    for method in methods:
        print(f"\nTrying method: {method.__name__}...")
        try:
            if method(input_pdf, output_pdf, dpi=150):
                success = True
                break
        except Exception as e:
            print(f"Method failed: {str(e)}")
            continue
    
    if not success:
        print("\nAll methods failed. Creating fallback PDF...")
        # Last resort: copy original
        import shutil
        shutil.copy2(input_pdf, output_pdf)
        print(f"Copied original as fallback: {output_pdf}")
    
    sys.exit(0 if success else 1)