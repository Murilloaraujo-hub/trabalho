"""
EPHYRA FINANCE — Camada de Armazenamento
Preparado para substituir LocalStorage por SQLite/MySQL no futuro.
"""
import json
from pathlib import Path
from typing import Optional, Dict, Any


class StorageBackend:
    """Backend de armazenamento — substitua por SQLite/MySQL futuramente."""

    def __init__(self, filepath: str = "ephyra_data.json"):
        self.filepath = Path(filepath)

    def salvar(self, dados: Dict[str, Any]) -> bool:
        try:
            with open(self.filepath, 'w', encoding='utf-8') as f:
                json.dump(dados, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Erro ao salvar: {e}")
            return False

    def carregar(self) -> Optional[Dict[str, Any]]:
        try:
            if self.filepath.exists():
                with open(self.filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Erro ao carregar: {e}")
        return None

    def limpar(self) -> bool:
        try:
            if self.filepath.exists():
                self.filepath.unlink()
            return True
        except Exception:
            return False

    def exportar(self) -> Optional[str]:
        dados = self.carregar()
        return json.dumps(dados, ensure_ascii=False, indent=2) if dados else None

    def importar(self, json_str: str) -> bool:
        try:
            dados = json.loads(json_str)
            return self.salvar(dados)
        except Exception:
            return False
