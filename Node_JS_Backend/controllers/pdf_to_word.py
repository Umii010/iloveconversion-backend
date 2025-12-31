import sys
from pdf2docx import parse

input_pdf = sys.argv[1]
output_docx = sys.argv[2]

parse(input_pdf, output_docx, start=0, end=None)
