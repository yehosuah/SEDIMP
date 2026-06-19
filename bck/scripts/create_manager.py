from app.db.seed import ensure_admin
from app.db.session import SessionLocal


def main() -> None:
    db = SessionLocal()
    try:
        user = ensure_admin(db)
        if user is None:
            raise SystemExit("MANAGER_EMAIL and MANAGER_PASSWORD must be set.")
        print(f"Admin ready: {user.email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
