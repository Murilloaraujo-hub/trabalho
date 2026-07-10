"""
EPHYRA FINANCE — Aplicação Principal Python
Ponto de entrada preparado para futura integração com servidor web.
Atualmente funciona como módulo de demonstração e testes.

Para executar: python app.py
"""
from models import EstadoApp, Usuario
from storage import StorageBackend
from services import TransacaoService, MetaService, XPService, ConquistaService


class EphyraApp:
    """Aplicação principal Ephyra Finance."""

    def __init__(self):
        self.storage = StorageBackend()
        self.estado = EstadoApp()
        self.usuario = None

    def inicializar(self):
        dados = self.storage.carregar()
        if dados:
            print("✅ Dados carregados com sucesso")
        else:
            print("📝 Nenhum dado encontrado — sistema pronto para primeiro uso")

    def criar_usuario(self, nome: str, email: str, senha: str) -> Usuario:
        self.usuario = Usuario(nome=nome, email=email, senha_hash=senha)
        print(f"✅ Usuário '{nome}' criado")
        return self.usuario

    def adicionar_receita(self, nome: str, valor: float, categoria: str = "salario"):
        tx = TransacaoService.adicionar(self.estado, "receita", nome, valor, categoria)
        XPService.adicionar(self.estado, 5)
        print(f"💰 Receita: {nome} — R$ {valor:.2f}")
        return tx

    def adicionar_despesa(self, nome: str, valor: float, categoria: str = "outros_desp"):
        tx = TransacaoService.adicionar(self.estado, "despesa", nome, valor, categoria)
        XPService.adicionar(self.estado, 3)
        print(f"💳 Despesa: {nome} — R$ {valor:.2f}")
        return tx

    def criar_meta(self, nome: str, valor: float):
        meta = MetaService.criar(self.estado, nome, valor)
        print(f"🎯 Meta criada: {nome} — R$ {valor:.2f}")
        return meta

    def depositar_meta(self, meta_id: str, valor: float):
        if MetaService.depositar(self.estado, meta_id, valor):
            print(f"🐷 R$ {valor:.2f} guardado na meta")
            return True
        print("❌ Depósito falhou")
        return False

    def resumo(self):
        totais = TransacaoService.totais(self.estado)
        prog = XPService.progresso(self.estado)
        novas = ConquistaService.verificar(self.estado)

        print("\n" + "=" * 50)
        print("📊 RESUMO EPHYRA FINANCE")
        print("=" * 50)
        print(f"💰 Saldo:    R$ {self.estado.saldo:.2f}")
        print(f"📈 Receitas: R$ {totais['receitas']:.2f}")
        print(f"📉 Despesas: R$ {totais['despesas']:.2f}")
        print(f"🎯 Metas:    {len(self.estado.metas)}")
        print(f"⭐ Nível:    {self.estado.nivel} ({prog:.0f}%)")
        print(f"🏆 Conquistas novas: {len(novas)}")
        print("=" * 50)

    def salvar(self):
        # Futuramente salvar no banco
        print("💾 Estado salvo (preparado para banco de dados)")


def main():
    """Demonstração do sistema."""
    app = EphyraApp()
    app.inicializar()

    # Criar usuário
    app.criar_usuario("João Silva", "joao@email.com", "1234")

    # Adicionar transações
    app.adicionar_receita("Salário", 5000)
    app.adicionar_despesa("Aluguel", 1500)
    app.adicionar_despesa("Mercado", 800)
    app.adicionar_receita("Freelance", 2000)

    # Criar e depositar em meta
    meta = app.criar_meta("Viagem", 3000)
    app.depositar_meta(meta.id, 1000)

    # Resumo
    app.resumo()
    app.salvar()


if __name__ == "__main__":
    main()
