"""
EPHYRA FINANCE — Modelos de Dados
Preparado para futura migração de LocalStorage para SQLite/MySQL.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict
import uuid


@dataclass
class Usuario:
    """Modelo de usuário do sistema."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    nome: str = ""
    email: str = ""
    senha: str = ""
    foto: str = ""  # Base64
    salario: float = 0.0
    data_cadastro: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "nome": self.nome,
            "email": self.email,
            "senha": self.senha,
            "foto": self.foto,
            "salario": self.salario,
            "dataCadastro": self.data_cadastro
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "Usuario":
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            nome=data.get("nome", ""),
            email=data.get("email", ""),
            senha=data.get("senha", ""),
            foto=data.get("foto", ""),
            salario=data.get("salario", 0.0),
            data_cadastro=data.get("dataCadastro", datetime.now().isoformat())
        )


@dataclass
class Categoria:
    """Modelo de categoria para transações."""
    id: str
    nome: str
    icone: str
    tipo: str
    cor: str

    def to_dict(self) -> Dict:
        return {"id": self.id, "nome": self.nome, "icone": self.icone, "tipo": self.tipo, "cor": self.cor}


@dataclass
class Transacao:
    """Modelo de transação financeira."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    tipo: str = "receita"
    nome: str = ""
    categoria: str = ""
    valor: float = 0.0
    data: str = field(default_factory=lambda: datetime.now().isoformat())
    descricao: str = ""
    data_criacao: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict:
        return {
            "id": self.id, "tipo": self.tipo, "nome": self.nome,
            "categoria": self.categoria, "valor": self.valor,
            "data": self.data, "descricao": self.descricao,
            "dataCriacao": self.data_criacao
        }


@dataclass
class Meta:
    """Modelo de meta financeira."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    nome: str = ""
    descricao: str = ""
    valor_objetivo: float = 0.0
    valor_guardado: float = 0.0
    data_limite: Optional[str] = None
    cor: str = "#3b82f6"
    icone: str = "🎯"
    prioridade: str = "media"
    status: str = "ativa"
    data_criacao: str = field(default_factory=lambda: datetime.now().isoformat())
    data_conclusao: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "id": self.id, "nome": self.nome, "descricao": self.descricao,
            "valorObjetivo": self.valor_objetivo, "valorGuardado": self.valor_guardado,
            "dataLimite": self.data_limite, "cor": self.cor, "icone": self.icone,
            "prioridade": self.prioridade, "status": self.status,
            "dataCriacao": self.data_criacao, "dataConclusao": self.data_conclusao
        }


@dataclass
class Conquista:
    """Modelo de conquista."""
    id: str
    nome: str
    desc: str
    xp: int
    icone: str
    cat: str
    data: str = field(default_factory=lambda: datetime.now().isoformat())
    desbloqueada: bool = False

    def to_dict(self) -> Dict:
        return {
            "id": self.id, "nome": self.nome, "desc": self.desc,
            "xp": self.xp, "icone": self.icone, "cat": self.cat,
            "data": self.data, "desbloqueada": self.desbloqueada
        }


@dataclass
class EstadoApp:
    """Estado completo da aplicação para um usuário."""
    saldo: float = 0.0
    receitas: List[Transacao] = field(default_factory=list)
    despesas: List[Transacao] = field(default_factory=list)
    metas: List[Meta] = field(default_factory=list)
    historico: List[Transacao] = field(default_factory=list)
    conquistas: List[Conquista] = field(default_factory=list)
    categorias: List[Categoria] = field(default_factory=list)
    xp: int = 0
    nivel: int = 1
    config: Dict = field(default_factory=lambda: {
        "tema": "dark", "diasUsando": 1,
        "ultimoLogin": datetime.now().isoformat()
    })
    user: Dict = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return {
            "saldo": self.saldo,
            "receitas": [r.to_dict() for r in self.receitas],
            "despesas": [d.to_dict() for d in self.despesas],
            "metas": [m.to_dict() for m in self.metas],
            "historico": [h.to_dict() for h in self.historico],
            "conquistas": [c.to_dict() for c in self.conquistas],
            "categorias": [c.to_dict() for c in self.categorias],
            "xp": self.xp, "nivel": self.nivel,
            "config": self.config, "user": self.user
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "EstadoApp":
        return cls(
            saldo=data.get("saldo", 0.0),
            receitas=[Transacao(**r) for r in data.get("receitas", [])],
            despesas=[Transacao(**d) for d in data.get("despesas", [])],
            metas=[Meta(**m) for m in data.get("metas", [])],
            historico=[Transacao(**h) for h in data.get("historico", [])],
            conquistas=[Conquista(**c) for c in data.get("conquistas", [])],
            categorias=[Categoria(**c) for c in data.get("categorias", [])],
            xp=data.get("xp", 0), nivel=data.get("nivel", 1),
            config=data.get("config", {}), user=data.get("user", {})
        )
