from getpass import getpass

from app.core.auth import hash_password
from app.core.database import SessionLocal
from app.models.user import User


def main():
    db = SessionLocal()

    try:
        username = input("Admin username: ").strip()
        email = input("Admin email: ").strip()
        password = getpass("Admin password: ")
        confirm_password = getpass("Confirm password: ")

        if password != confirm_password:
            print("Passwords do not match.")
            return

        existing_user = (
            db.query(User)
            .filter(User.username == username)
            .first()
        )

        if existing_user:
            print("Username already exists.")
            return

        existing_email = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_email:
            print("Email already exists.")
            return

        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(password),
            role="admin",
            is_active=True,
        )

        db.add(user)
        db.commit()

        print()
        print("Admin user created successfully.")
        print(f"Username: {username}")
        print(f"Role: {user.role}")

    finally:
        db.close()


if __name__ == "__main__":
    main()