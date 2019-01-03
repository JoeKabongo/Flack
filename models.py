from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Username(db.Model):
    __tablename__ = "usernames"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    password = db.Column(db.String, nullable=False)


    def get_id(self):
        return self.id

    def get_name(self):
        return self.name

    def get_password(self):
        return self.password

    def __str__(self):
        return self.name


class Chatroom(db.Model):
    __tablename__ = "chatrooms"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)

    def get_id(self):
        return self.id

    def __str__(self):
        return self.name

class Message(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String, nullable=False)
    sender = db.Column(db.Integer, db.ForeignKey("usernames.id" ,ondelete='CASCADE'), nullable=False)
    date = db.Column(db.String, nullable=False)
    time = db.Column(db.String, nullable=False)
    chatroom = db.Column(db.Integer, db.ForeignKey("chatrooms.id", ondelete='CASCADE'), nullable=False)


class Username_Chatroom(db.Model):
    __tablename__ = "usernames_chatrooms"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.Integer, db.ForeignKey("usernames.id", ondelete='CASCADE'), nullable=False)
    chatroom = db.Column(db.Integer, db.ForeignKey("chatrooms.id", ondelete='CASCADE'),  nullable=False)

class Chatroom_messages(db.Model):
    __tablename__ = "chatrooms_messages"
    id = db.Column(db.Integer, primary_key=True)
    chatroom = db.Column(db.Integer, db.ForeignKey("chatrooms.id",ondelete='CASCADE'), nullable=False)
    message = db.Column(db.Integer, db.ForeignKey("messages.id",ondelete='CASCADE'), nullable=False)
