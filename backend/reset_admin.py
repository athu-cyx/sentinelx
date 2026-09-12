from getpass import getpass

from app.core.auth import hash_password
from app.core.database import SessionLocal
from app.models.user import User


def main():
    db = SessionLocal()

    try:
        username = input("Admin username: ").strip()

        user = (
            db.query(User)
            .filter(User.username == username)
            .first()
        )

        if not user:
            print("User not found.")
            return

        password = getpass("New password: ")
        confirm_password = getpass("Confirm new password: ")

        if password != confirm_password:
            print("Passwords do not match.")
            return

        user.hashed_password = hash_password(password)
        user.role = "admin"
        user.is_active = True

        db.commit()

        print()
        print("Admin password reset successfully.")
        print(f"Username: {user.username}")
        print(f"Role: {user.role}")

    finally:
        db.close()


if __name__ == "__main__":
    main()