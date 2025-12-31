import sys
import camelot
import pandas as pd
from pathlib import Path

input_pdf = sys.argv[1]
output_xlsx = sys.argv[2]

tables = camelot.read_pdf(input_pdf, pages='all', flavor='stream')

if tables.n == 0:
    raise Exception("No tables found in PDF")

writer = pd.ExcelWriter(output_xlsx, engine='openpyxl')

for i, table in enumerate(tables):
    table.df.to_excel(writer, sheet_name=f"Table_{i+1}", index=False)

writer.close()
