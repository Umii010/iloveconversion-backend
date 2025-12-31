import sys
import os
import traceback

# Add debug logging
def debug_log(message):
    print(f"[DEBUG] {message}", file=sys.stderr)

def main():
    try:
        debug_log("Python script started")
        
        # Check arguments
        if len(sys.argv) < 3:
            debug_log(f"Error: Not enough arguments. Got {len(sys.argv)}, expected at least 3")
            debug_log(f"Arguments: {sys.argv}")
            return 1
        
        pdf_path = sys.argv[1]
        pptx_path = sys.argv[2]
        
        debug_log(f"PDF path: {pdf_path}")
        debug_log(f"PPTX path: {pptx_path}")
        
        # Check if files exist
        if not os.path.exists(pdf_path):
            debug_log(f"Error: PDF file does not exist: {pdf_path}")
            return 1
        
        debug_log("Attempting to import required modules...")
        
        try:
            from pdf2image import convert_from_path
            from pptx import Presentation
            from pptx.util import Inches
            from PIL import Image
            debug_log("All modules imported successfully")
        except ImportError as e:
            debug_log(f"Import error: {e}")
            debug_log("Make sure these packages are installed:")
            debug_log("  pip install pdf2image python-pptx Pillow")
            debug_log("Also install poppler: https://github.com/oschwartz10612/poppler-windows/releases/")
            return 1
        
        # Verify poppler is in PATH
        debug_log("Checking for poppler...")
        
        try:
            # First conversion test
            debug_log("Converting first page of PDF...")
            images = convert_from_path(pdf_path, dpi=150, first_page=1, last_page=1)
            debug_log(f"Successfully converted. Got {len(images)} images")
        except Exception as e:
            debug_log(f"PDF conversion failed: {e}")
            debug_log("Please check if poppler is installed and in PATH")
            debug_log("Download from: https://github.com/oschwartz10612/poppler-windows/releases/")
            debug_log("Add poppler's bin folder to system PATH")
            return 1
        
        # Complete conversion
        debug_log("Converting full PDF...")
        images = convert_from_path(pdf_path, dpi=200)
        debug_log(f"Converted {len(images)} pages")
        
        # Create presentation
        prs = Presentation()
        
        # Use standard 16:9 slide size
        prs.slide_width = Inches(13.33)
        prs.slide_height = Inches(7.5)
        
        blank_slide_layout = prs.slide_layouts[6]  # Blank layout
        
        import tempfile
        temp_dir = tempfile.mkdtemp()
        debug_log(f"Using temp directory: {temp_dir}")
        
        for i, img in enumerate(images):
            debug_log(f"Processing page {i + 1}/{len(images)}")
            
            # Save temporary image
            temp_img_path = os.path.join(temp_dir, f"page_{i}.png")
            img.save(temp_img_path, "PNG")
            
            # Add to slide
            slide = prs.slides.add_slide(blank_slide_layout)
            
            # Calculate dimensions to maintain aspect ratio
            img_width, img_height = img.size
            slide_width = prs.slide_width.inches
            slide_height = prs.slide_height.inches
            
            # Calculate scaling to fit within slide
            width_ratio = slide_width / (img_width / 96)  # Convert pixels to inches (96 DPI)
            height_ratio = slide_height / (img_height / 96)
            scale = min(width_ratio, height_ratio) * 0.95  # 95% to add margin
            
            # Calculate position to center
            width = Inches((img_width / 96) * scale)
            height = Inches((img_height / 96) * scale)
            left = (prs.slide_width - width) / 2
            top = (prs.slide_height - height) / 2
            
            slide.shapes.add_picture(temp_img_path, left, top, width=width, height=height)
            
            # Clean up
            os.remove(temp_img_path)
        
        # Clean up temp directory
        os.rmdir(temp_dir)
        
        # Save presentation
        debug_log(f"Saving PowerPoint to: {pptx_path}")
        prs.save(pptx_path)
        
        # Verify file was created
        if os.path.exists(pptx_path):
            file_size = os.path.getsize(pptx_path) / (1024 * 1024)
            debug_log(f"Success! File created: {file_size:.2f} MB")
            return 0
        else:
            debug_log("Error: PowerPoint file was not created")
            return 1
            
    except Exception as e:
        debug_log(f"Unexpected error: {e}")
        debug_log(traceback.format_exc())
        return 1

if __name__ == "__main__":
    sys.exit(main())