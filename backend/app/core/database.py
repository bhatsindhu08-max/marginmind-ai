from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def upgrade_database_schema(engine):
    """Safely adds missing columns to existing SQLite/SQL tables."""
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            # Check production_costs table
            result = conn.execute(text("PRAGMA table_info(production_costs);")).fetchall()
            if result:
                existing_cols = {row[1] for row in result}
                needed_cols = [
                    ("worker_count", "INTEGER DEFAULT 1"),
                    ("wage_per_worker_daily", "FLOAT DEFAULT 500.0"),
                    ("daily_output_units", "FLOAT DEFAULT 100.0"),
                    ("processing_jobwork_cost_per_unit", "FLOAT DEFAULT 0.0"),
                    ("inspection_qc_cost_per_unit", "FLOAT DEFAULT 0.0"),
                    ("consumables_cost_per_unit", "FLOAT DEFAULT 0.0"),
                    ("boiler_steam_fuel_per_unit", "FLOAT DEFAULT 0.0"),
                    ("cost_breakdown_json", "TEXT DEFAULT '{}'")
                ]
                for col_name, col_type in needed_cols:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE production_costs ADD COLUMN {col_name} {col_type};"))

            # Check businesses table for location_hub
            biz_cols_res = conn.execute(text("PRAGMA table_info(businesses);")).fetchall()
            if biz_cols_res:
                biz_cols = {row[1] for row in biz_cols_res}
                if "location_hub" not in biz_cols:
                    conn.execute(text("ALTER TABLE businesses ADD COLUMN location_hub VARCHAR(100) DEFAULT 'PUNE_MIDC';"))

            conn.commit()
    except Exception as e:
        print(f"Warning: schema upgrade encountered notice: {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
