"""Uppkoppling för karakteriseringstesterna av src/legacy/price_calc.py.

price_calc öppnar databasanslutningen redan vid import (price_calc.py:10).
Därför sätts DATABASE_URL till testdatabasen innan modulen importeras, så att
testerna aldrig rör utvecklingsdatabasen butik.
"""

import os
import sys
from pathlib import Path

import pytest

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/butik_test",
)

# Måste sättas innan price_calc importeras (importen öppnar anslutningen).
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

LEGACY_DIR = Path(__file__).resolve().parent.parent / "src" / "legacy"
sys.path.insert(0, str(LEGACY_DIR))


def pytest_configure(config):
    """Avbryt hela körningen om testdatabasen inte nås (ingen skip)."""
    import psycopg

    try:
        psycopg.connect(TEST_DATABASE_URL, connect_timeout=5).close()
    except psycopg.Error:
        pytest.exit(
            "Testdatabasen nås inte. Kör: npm run db:up && npm run db:reset",
            returncode=1,
        )


@pytest.fixture(autouse=True)
def logg_i_tmp(monkeypatch, tmp_path):
    """Pekar om price_calc.LOGG till en tillfällig fil.

    Gäller anrop i samma process. CLI-körningar via subprocess skriver till
    modulens egen loggsökväg, eftersom LOGG sätts från __file__ (price_calc.py:13).
    """
    import price_calc

    monkeypatch.setattr(price_calc, "LOGG", str(tmp_path / "price_calc.log"))


@pytest.fixture
def cli_env():
    """Miljö för subprocess, med DATABASE_URL pekande på testdatabasen."""
    env = os.environ.copy()
    env["DATABASE_URL"] = TEST_DATABASE_URL
    return env
