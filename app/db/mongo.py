from pymongo import MongoClient


def get_db():
    client = MongoClient("mongodb://localhost:27017/")  # or your Atlas URI
    db = client["face_recognition"]
    return db


