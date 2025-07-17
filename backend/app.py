from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
from flask_cors import CORS
from dotenv import load_dotenv
import bcrypt
import jwt
import os
import datetime
from functools import wraps
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests  # fixed variable name

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.config["MONGO_URI"] = os.getenv("MONGO_URI")
SECRET_KEY = os.getenv("SECRET_KEY")

mongo = PyMongo(app)
users_collection = mongo.db.users
tasks_collection = mongo.db.tasks


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            try:
                token = request.headers['Authorization'].split(" ")[1]
            except IndexError:
                return jsonify({"message": "Token format is invalid"}), 401

        if not token:
            return jsonify({"message": "Token is missing!"}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = users_collection.find_one({"_id": ObjectId(data["user_id"])})
            if not current_user:
                raise Exception("User not found")
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token expired!"}), 401
        except Exception as e:
            return jsonify({"message": "Token is invalid!", "error": str(e)}), 401

        return f(current_user, *args, **kwargs)
    return decorated


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not (username and email and password):
        return jsonify({"message": "All fields are required"}), 400

    existing_user = users_collection.find_one({"email": email})
    if existing_user:
        return jsonify({"message": "Email already registered"}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    new_user = {
        "username": username,
        "email": email,
        "password": hashed_password
    }

    inserted = users_collection.insert_one(new_user)
    return jsonify({"message": "Registration successful", "user_id": str(inserted.inserted_id)}), 200


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not (email and password):
        return jsonify({"message": "Email and password are required"}), 400

    user = users_collection.find_one({"email": email})
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user["password"]):
        return jsonify({"message": "Invalid credentials"}), 401

    token = jwt.encode({
        "user_id": str(user["_id"]),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }, SECRET_KEY, algorithm="HS256")

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "username": user["username"]
        }
    }), 200


@app.route("/google-login", methods=["POST"])
def google_login():
    try:
        token = request.json.get("access_token")
        if not token:
            return jsonify({"error": "Missing token"}), 400

        CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)

        email = idinfo["email"]
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")

        print("Google ID token payload:", idinfo)

        user = users_collection.find_one({"email": email})
        if not user:
            users_collection.insert_one({
                "email": email,
                "username": name,
                "picture": picture,
                "login_provider": "google",
                "password": None
            })

        return jsonify({
            "message": "Google login successful",
            "email": email,
            "name": name,
            "picture": picture
        }), 200

    except ValueError as e:
        print("Google token error:", e)
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        print("Server error:", e)
        return jsonify({"error": "Internal server error"}), 500


@app.route('/profile', methods=['GET'])
@token_required
def profile(current_user):
    return jsonify({
        "username": current_user.get("username"),
        "email": current_user.get("email")
    }), 200


# ======= TASK ROUTES =======

@app.route('/tasks', methods=['GET'])
@token_required
def get_tasks(current_user):
    user_tasks = list(mongo.db.tasks.find({"user_id": str(current_user["_id"])}))

    for task in user_tasks:
        task["_id"] = str(task["_id"])

    return jsonify({"tasks": user_tasks}), 200


@app.route('/tasks', methods=['POST'])
@token_required
def add_task(current_user):
    data = request.get_json()

    title = data.get("title")
    description = data.get("description")
    frequency = data.get("frequency")
    due_date = data.get("due_date")
    due_time = data.get("due_time")

    if not all([title, frequency, due_date, due_time]):
        return jsonify({"message": "Missing required fields"}), 400

    new_task = {
        "user_id": str(current_user["_id"]),
        "title": title,
        "description": description,
        "frequency": frequency,
        "due_date": due_date,
        "due_time": due_time,
        "created_at": datetime.datetime.utcnow()
    }

    inserted = mongo.db.tasks.insert_one(new_task)
    return jsonify({"message": "Task created", "task_id": str(inserted.inserted_id)}), 201

@app.route('/update_task/<task_id>', methods=['PUT'])
@token_required
def update_task(current_user, task_id):
    data = request.get_json()

    title = data.get("title")
    description = data.get("description")
    frequency = data.get("frequency")
    due_date = data.get("due_date")
    due_time = data.get("due_time")

    if not all([title, frequency, due_date, due_time]):
        return jsonify({"message": "Missing required fields"}), 400

    update_data = {
        "title": title,
        "description": description,
        "frequency": frequency,
        "due_date": due_date,
        "due_time": due_time
    }

    result = mongo.db.tasks.update_one(
        {"_id": ObjectId(task_id), "user_id": str(current_user["_id"])},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        return jsonify({"message": "Task not found or not authorized"}), 404

    return jsonify({"message": "Task updated successfully"}), 200

@app.route('/delete_task/<task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user, task_id):
    result = mongo.db.tasks.delete_one({
        "_id": ObjectId(task_id),
        "user_id": str(current_user["_id"])
    })

    if result.deleted_count == 0:
        return jsonify({"message": "Task not found or not authorized"}), 404

    return jsonify({"message": "Task deleted successfully"}), 200



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
