from .pdf_parser import parse_pdf
from .docx_parser import parse_docx
from .xlsx_parser import parse_xlsx

def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    ext = filename.lower().split('.')[-1]
    if ext == 'pdf':
        return parse_pdf(file_bytes)
    elif ext == 'docx':
        return parse_docx(file_bytes)
    elif ext == 'xlsx':
        return parse_xlsx(file_bytes)
    else:
        # Fallback to decode as utf-8 text
        try:
            return file_bytes.decode('utf-8')
        except Exception:
            raise ValueError(f"Unsupported file type: {ext}")
