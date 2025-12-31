import sys
import os
import time
import win32com.client

def ppt_to_pdf(input_path, output_path):
    powerpoint = win32com.client.DispatchEx("PowerPoint.Application")
    powerpoint.Visible = 1

    try:
        presentation = powerpoint.Presentations.Open(
            input_path,
            WithWindow=False
        )

        # 32 = PDF format
        presentation.SaveAs(output_path, 32)

        presentation.Close()
    finally:
        powerpoint.Quit()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: ppt_to_pdf.py input.pptx output.pdf")
        sys.exit(1)

    input_ppt = os.path.abspath(sys.argv[1])
    output_pdf = os.path.abspath(sys.argv[2])

    ppt_to_pdf(input_ppt, output_pdf)

    # Small delay to release file lock
    time.sleep(1)
