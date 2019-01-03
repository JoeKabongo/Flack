import csv
import os
from flask import Flask

from models import *

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "postgres://ijtfmhyfkmzalm:292081f6e539682eb3744e9c10a9e6e8120e02568e549364f3c888861d85ebb1@ec2-23-21-122-141.compute-1.amazonaws.com:5432/d4657936d27ppe"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

def main():
    flight = Username(name="jonathan", password="jedors")
    db.session.add(flight)
    db.session.commit()

if __name__ == "__main__":
    with app.app_context():
        main()
