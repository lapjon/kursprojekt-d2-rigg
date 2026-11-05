"""Karakteriseringstester för src/legacy/price_calc.py.

De låser fast dagens beteende, även där det är en avvikelse. Underlag:
docs/legacy/codemap.md, avsnitt 4 (observerat beteende) och 6 (kandidater).
Förväntade värden kommer från körningar mot db/seed.sql. Ändra dem inte för
att få testerna gröna: ett rött test betyder att beteendet har ändrats.
"""

import subprocess
import sys
from decimal import Decimal
from pathlib import Path

from price_calc import calc_price

SKRIPT = Path(__file__).resolve().parent.parent / "src" / "legacy" / "price_calc.py"


def kor_cli(order_id, env):
    return subprocess.run(
        [sys.executable, str(SKRIPT), str(order_id)],
        capture_output=True,
        text=True,
        env=env,
        check=False,
    )


def test_order_utan_rabatt():
    """Låser grundberäkningen: order 1042 (950 utan rabattkod) ger moms 25 %.

    Ingen avvikelse, referensfall för resten (codemap avsnitt 4).
    """
    pris = calc_price(1042)

    assert pris.net == Decimal("950")
    assert pris.vat == Decimal("237.5")
    assert pris.total == Decimal("1187.5")


def test_momsen_trunkeras_inte_avrundas():
    """Låser avvikelse 2 (codemap): _kapa trunkerar mot noll.

    Order 1044: 179.91 * 25 % = 44.9775 blir 44.97. Avrundning hade gett 44.98.
    """
    pris = calc_price(1044)

    assert pris.vat == Decimal("44.97")
    assert pris.total == Decimal("224.88")


def test_utgangen_rabatt_tillampas_anda():
    """Låser avvikelse 5 (codemap): rabattens giltighetstid ignoreras.

    Order 1045 använder GAMMAL15 (giltig bara 2024) och får ändå 15 % rabatt:
    649.00 - 15 % = 551.65.
    """
    pris = calc_price(1045)

    assert pris.net == Decimal("551.65")
    assert pris.total == Decimal("689.56")


def test_cli_order_som_inte_finns(cli_env):
    """Låser felbeteendet för okänd order (codemap avsnitt 4).

    CLI skriver {"error": "finns inte"} och avslutar med returkod 1. Koden 1
    används även för tracebacks (avvikelse 7), så den skiljer inte fel åt.
    """
    resultat = kor_cli(9999, cli_env)

    assert resultat.stdout == '{"error": "finns inte"}\n'
    assert resultat.returncode == 1


def test_cli_loggar_till_price_calc_log(cli_env, tmp_path):
    """Låser att loggsökvägen styrs av miljövariabeln PRICE_CALC_LOG.

    CLI med order 1042 ska skriva exakt en rad till den angivna filen, i
    formatet "ISO-tid order_id total" (codemap avsnitt 3, filer).
    """
    logg = tmp_path / "egen.log"
    env = {**cli_env, "PRICE_CALC_LOG": str(logg)}

    resultat = kor_cli(1042, env)

    assert resultat.returncode == 0
    rader = logg.read_text().splitlines()
    assert len(rader) == 1
    assert rader[0].endswith(" 1042 1187.5")


def test_cli_utdataformat_med_rabatt(cli_env):
    """Låser avvikelse 4 (codemap): str(Decimal) ger ojämnt antal decimaler.

    Order 1041 (736 med SOMMAR20, 20 %) ger "588.8", "147.2" och "736.0" i
    stället för fasta två decimaler. Låser också att rabatten dras av.
    """
    resultat = kor_cli(1041, cli_env)

    assert resultat.stdout == '{"net": "588.8", "vat": "147.2", "total": "736.0"}\n'
    assert resultat.returncode == 0
