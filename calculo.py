def calcular_regra_50_30_20(valor):
    """Recebe um valor e calcula a divisao financeira 50/30/20."""
    if valor < 0:
        raise ValueError("O valor nao pode ser negativo.")

    return {
        "necessidades": valor * 0.50,
        "desejos": valor * 0.30,
        "investimentos": valor * 0.20,
    }


def guardar_dinheiro(saldo, valor_guardado, deposito):
    """Simula guardar dinheiro em uma meta sem permitir saldo negativo."""
    if saldo < 0 or valor_guardado < 0 or deposito < 0:
        raise ValueError("Os valores nao podem ser negativos.")

    if deposito > saldo:
        raise ValueError("Saldo insuficiente para guardar esse valor.")

    return {
        "novo_saldo": saldo - deposito,
        "novo_valor_guardado": valor_guardado + deposito,
    }


def formatar_numero(valor):
    """Mostra o numero com duas casas decimais."""
    return f"{valor:.2f}"


def converter_valor(texto):
    """Converte valores como 3000, 3000,00 ou 3.000,00 para numero."""
    valor = texto.strip().replace("R$", "").replace(" ", "")

    if "," in valor and "." in valor:
        valor = valor.replace(".", "").replace(",", ".")
    elif "," in valor:
        valor = valor.replace(",", ".")
    elif valor.count(".") > 1:
        valor = valor.replace(".", "")

    return float(valor)


if __name__ == "__main__":
    print("Ephyra Finance - Calculadora Financeira")

    try:
        entrada = input("Digite sua renda ou receita total: ")
        valor_digitado = converter_valor(entrada)
        resultado = calcular_regra_50_30_20(valor_digitado)

        print("\nRegra 50/30/20")
        print(f"Necessidades: {formatar_numero(resultado['necessidades'])}")
        print(f"Desejos: {formatar_numero(resultado['desejos'])}")
        print(f"Investimentos: {formatar_numero(resultado['investimentos'])}")

        deposito = converter_valor(input("\nValor para guardar em uma meta: "))
        simulacao = guardar_dinheiro(valor_digitado, 0, deposito)

        print("\nSimulacao de meta")
        print(f"Novo saldo: {formatar_numero(simulacao['novo_saldo'])}")
        print(f"Valor guardado: {formatar_numero(simulacao['novo_valor_guardado'])}")
    except ValueError as erro:
        print(f"Entrada invalida: {erro}")
