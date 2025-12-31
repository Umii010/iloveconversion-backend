import sys
import os
from pdf2docx import Converter

def convert_pdf_to_word(pdf_path, docx_path):
    """Convert PDF to Word document"""
    try:
        print(f"Converting PDF to Word: {pdf_path}")
        
        # Initialize converter
        cv = Converter(pdf_path)
        
        # Convert
        cv.convert(docx_path, start=0, end=None)
        
        # Close
        cv.close()
        
        print(f"Conversion successful: {docx_path}")
        return True
        
    except Exception as e:
        print(f"Conversion error: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python pdf_to_word.py <input_pdf> <output_docx>")
        sys.exit(1)
    
    input_pdf = sys.argv[1]
    output_docx = sys.argv[2]
    
    if not os.path.exists(input_pdf):
        print(f"Error: Input PDF not found: {input_pdf}")
        sys.exit(1)
    
    success = convert_pdf_to_word(input_pdf, output_docx)
    sys.exit(0 if success else 1)