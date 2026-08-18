import io
import pandas as pd

def parse_xlsx(file_bytes: bytes) -> str:
    df_dict = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None)
    text = ""
    for sheet_name, df in df_dict.items():
        text += f"--- Sheet: {sheet_name} ---\n"
        text += df.to_string(index=False) + "\n"
    return text
