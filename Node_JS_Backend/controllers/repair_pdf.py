import sys
import os
import pikepdf

input_pdf = sys.argv[1]
output_pdf = sys.argv[2]

try:
    with pikepdf.open(input_pdf, allow_overwriting_input=True) as pdf:
        pdf.save(output_pdf)
    print("Repair successful")
except Exception as e:
    print(f"Repair failed: {str(e)}")
    exit(1)
