"""
EPHYRA FINANCE — Serviços de Negócio
Camada de lógica preparada para integração com banco de dados.
"""
from typing import List, Dict, Any
from datetime import datetime
from models import Transacao, Meta, Conquista, EstadoApp


class TransacaoService:
    """Serviço de gerenciamento de transações."""

    @staticmethod
    def adicionar(estado: EstadoApp, tipo: str, nome: str, valor: float, categoria_id: str) -> Transacao:
        tx = Transacao(tipo=tipo, nome=nome, valor=valor, categoria_id=categoria_id)
        if tipo == "receita":
            estado.saldo += valor
            estado.receitas.append(tx)
        else:
            estado.saldo -= valor
            estado.despesas.append(tx)
        estado.historico.append(tx)
        return tx

    @staticmethod
    def remover(estado: EstadoApp, tx_id: str) -> bool:
        for lista in [estado.receitas, estado.despesas]:
            for i, tx in enumerate(lista):
                if tx.id == tx_id:
                    if tx.tipo == "receita":
                        estado.saldo -= tx.valor
                    else:
                        estado.saldo += tx.valor
                    lista.pop(i)
                    estado.historico = [h for h in estado.historico if h.id != tx_id]
                    return True
        return False

    @staticmethod
    def totais(estado: EstadoApp) -> Dict[str, float]:
        return {
            "receitas": sum(r.valor for r in estado.receitas),
            "despesas": sum(d.valor for d in estado.despesas),
            "saldo": estado.saldo
        }


class MetaService:
    """Serviço de gerenciamento de metas."""

    @staticmethod
    def criar(estado: EstadoApp, nome: str, valor_objetivo: float, **kwargs) -> Meta:
        meta = Meta(nome=nome, valor_objetivo=valor_objetivo, **kwargs)
        estado.metas.append(meta)
        return meta

    @staticmethod
    def depositar(estado: EstadoApp, meta_id: str, valor: float) -> bool:
        meta = next((m for m in estado.metas if m.id == meta_id), None)
        if not meta or valor <= 0 or valor > estado.saldo:
            return False
        estado.saldo -= valor
        meta.valor_guardado += valor
        if meta.valor_guardado >= meta.valor_objetivo:
            meta.status = "concluida"
        return True


class XPService:
    """Serviço de XP e níveis."""
    XP_POR_NIVEL = 100

    @staticmethod
    def adicionar(estado: EstadoApp, quantidade: int) -> bool:
        estado.xp += quantidade
        nivel_necessario = estado.nivel * XPService.XP_POR_NIVEL
        if estado.xp >= nivel_necessario:
            estado.xp -= nivel_necessario
            estado.nivel += 1
            return True  # Subiu de nível
        return False

    @staticmethod
    def progresso(estado: EstadoApp) -> float:
        necessario = estado.nivel * XPService.XP_POR_NIVEL
        return (estado.xp / necessario) * 100 if necessario > 0 else 0


class ConquistaService:
    """Serviço de conquistas."""

    @staticmethod
    def verificar(estado: EstadoApp) -> List[str]:
        novas = []
        checks = {
            'primeira_receita': len(estado.receitas) >= 1,
            'primeira_despesa': len(estado.despesas) >= 1,
            'primeira_meta': len(estado.metas) >= 1,
            'milionario': estado.saldo >= 1000,
        }
        for id_ach, condicao in checks.items():
            if condicao and not any(c.id == id_ach for c in estado.conquistas):
                novas.append(id_ach)
        return novas
