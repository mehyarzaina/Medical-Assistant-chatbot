"""
Migrate data from a local Postgres database to MongoDB Atlas.

Usage:
    python migrate_pg_to_mongo.py

Requires a .env file with:
    DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME   (Postgres)
    MONGO_URI, MONGO_DB_NAME                          (MongoDB Atlas)
"""

import os
import json
from decimal import Decimal
from datetime import date, datetime

import psycopg2
import psycopg2.extras
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# ---------- Config ----------
PG_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
    "dbname": os.getenv("DB_NAME"),
}

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", PG_CONFIG["dbname"])

# Optional: limit migration to specific tables. Leave empty to migrate all.
TABLES_TO_MIGRATE = []  # e.g. ["patients", "appointments", "doctors"]

BATCH_SIZE = 1000


def json_safe(value):
    """Convert Postgres-specific types into JSON/BSON-friendly Python types."""
    if isinstance(value, (Decimal,)):
        return float(value)
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [json_safe(v) for v in value]
    return value


def get_pg_tables(pg_cursor):
    pg_cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE';
    """)
    return [row[0] for row in pg_cursor.fetchall()]


def migrate_table(pg_conn, mongo_db, table_name):
    print(f"\n→ Migrating table: {table_name}")

    pg_cursor = pg_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    pg_cursor.execute(f'SELECT * FROM "{table_name}";')

    collection = mongo_db[table_name]
    total_migrated = 0
    batch = []

    for row in pg_cursor:
        doc = {k: json_safe(v) for k, v in dict(row).items()}
        batch.append(doc)

        if len(batch) >= BATCH_SIZE:
            collection.insert_many(batch)
            total_migrated += len(batch)
            print(f"  inserted {total_migrated} rows...")
            batch = []

    if batch:
        collection.insert_many(batch)
        total_migrated += len(batch)

    print(f"  done: {total_migrated} documents inserted into '{table_name}'")
    pg_cursor.close()


def main():
    print("Connecting to Postgres...")
    pg_conn = psycopg2.connect(**PG_CONFIG)

    print("Connecting to MongoDB Atlas...")
    mongo_client = MongoClient(MONGO_URI)
    mongo_db = mongo_client[MONGO_DB_NAME]

    # Quick connectivity check
    mongo_client.admin.command("ping")
    print("Mongo connection OK.")

    with pg_conn.cursor() as cur:
        tables = TABLES_TO_MIGRATE or get_pg_tables(cur)

    print(f"Tables to migrate: {tables}")

    for table in tables:
        migrate_table(pg_conn, mongo_db, table)

    pg_conn.close()
    mongo_client.close()
    print("\nMigration complete.")


if __name__ == "__main__":
    main()