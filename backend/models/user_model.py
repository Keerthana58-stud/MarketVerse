import bcrypt

class UserModel:
    @staticmethod
    def create_user(db, name, email, password, role):
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user_data = {
            "name": name,
            "email": email,
            "password": hashed.decode('utf-8'),
            "role": role
        }
        return db.users.insert_one(user_data)

    @staticmethod
    def get_user_by_email(db, email):
        return db.users.find_one({"email": email})

    @staticmethod
    def verify_password(password, hashed_password):
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
