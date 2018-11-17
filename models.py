import os

from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, nullable=False)
    password = db.Column(db.String, nullable=False)
    chatrooms = db.relationship("Passenger", backref="flight", lazy=True)

    def add_toChannel(self, username):
        chatroom = Chatroom(name=name, flight_id=self.id)
        db.session.add(p)
        db.session.commit()

    def remove_fromChannel(self, username):
        pass



class Chatroom(db.Model):
    __tablename__ = "chatrooms"
    id = db.Column(db.Integer, primary_key=True)
    members = db.Column(db.Integer, db.ForeignKey("flights.id"))
    founder = db.Column(db.Integer, db.ForeignKey("flights.id"))



class Flight(db.Model):
    __tablename__ = "flights"
    id = db.Column(db.Integer, primary_key=True)
    origin = db.Column(db.String, nullable=False)
    destination = db.Column(db.String, nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    passengers = db.relationship("Passenger", backref="flight", lazy=True)

    def add_passenger(self, name):
        p = Passenger(name=name, flight_id=self.id)
        db.session.add(p)
        db.session.commit()


class Passenger(db.Model):
    __tablename__ = "passengers"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    flight_id = db.Column(db.Integer, db.ForeignKey("flights.id"), nullable=False)
