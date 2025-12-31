import sys
import os
from pdf2image import convert_from_path
from PIL import Image
import pytesseract
from PyPDF2 import PdfWriter

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\tesseract-main\tesseract.exe"

input_pdf = sys.argv[1]
output_pdf = sys.argv[2]
