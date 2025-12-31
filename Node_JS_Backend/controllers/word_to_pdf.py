import sys
from pdf2docx import parse

input_docx = sys.argv[1]
output_pdf = sys.argv[2]

parse(input_docx, output_pdf, start=0, end=None)
