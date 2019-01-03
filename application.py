import os
import sys

from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from flask_socketio import SocketIO, emit, send
import json
from passlib.hash import pbkdf2_sha256
from models import *
app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "postgres://ijqbolaknohivt:f8dea6cdb0906300228cd31274d5bfc2b98c5b16fb61fd99e21873acb9b759a8@ec2-54-225-89-156.compute-1.amazonaws.com:5432/d79sv2ea3fj85a"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)
app.config["SECRET_KEY"] = "secret key"

# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"

socketio = SocketIO(app)

@app.route("/")
def index():

    """
        Go to the homapege when the user first get to the webpage
    """
    return render_template("index.html")

@app.route("/home/<user_id>")
def home(user_id):
    """
        When the user goes back to the homapage
    """
    session["user_id"] = int(user_id)

    #query all the channels the user is associated to and display it in the navbar
    user_channels =  db.session.query(Username_Chatroom.chatroom).filter_by(username=user_id).all()
    channels = []
    for i  in range (len(user_channels)):
        channel = Chatroom.query.get(user_channels[i][0])
        channels.append(channel)
    for i in range (len(channels)):
        channels[i] = channels[i].name
    channels.sort()

    return jsonify({"channels": channels})

@app.route("/signup", methods=["POST"])
def signup():
    """
        Allow the user to create an unique display name(aka username)
        Make sure the user picked an unique display name that does not exist yet
    """
    username = request.form.get("username")
    password = request.form.get("password")
    confirm_password = request.form.get("confirm_password")

    user = Username.query.filter_by(name=username).first()

    if user:
        return jsonify({"success":False, "message":"This username has already been taken, sorry"})

    #if password does not match
    if password != confirm_password:
        return jsonify({"sucess": False, "message":"Make sure the passwords match"})

    else:
        # hash the password
        hash = pbkdf2_sha256.hash(password)

        user = Username(name=username, password=hash)
        db.session.add(user)
        db.session.commit()
        user_id = user.get_id()

        session["user_id"] = user_id

        return jsonify({"success":True, "user_id":user_id})

@app.route("/signin", methods=["POST"])
def signin():
    """
        allow the user to sign in
    """
    username = request.form.get("username")
    password = request.form.get("password")

    user = Username.query.filter_by(name=username).first()
    print(f"user {user}")

    if user is None:
        return jsonify({"success": False, "message":"The username you entered cannot be found in our records."})

    hash_password = user.get_password()

    if pbkdf2_sha256.verify(password, hash_password) is False:
        return jsonify({"success": False, "message":"The password you entered does not match with the username"})
    else:
        user_id =  user.get_id()
        session["user_id"] = user_id
        return jsonify({"success": True, "user_id":user_id})


@app.route("/create_channel_post", methods=["POST"])
def create_channel():
    """
        Allow the user to create a channel as long as the name of the channel
        name has not been taken yet"""

    channel = request.form.get("channel-name").lower()
    user_id = request.form.get("user_id")
    chatroom = Chatroom.query.filter_by(name=channel).first()
    if chatroom:
        return jsonify({"failure":True})

    else:
        #add chatroom into th database
        chatroom = Chatroom(name=channel)
        db.session.add(chatroom)
        db.session.commit()

        chatroom_id = chatroom.get_id()

        print(f"user_id {user_id}, chat id {chatroom_id}")

        user_channel = Username_Chatroom(username=user_id, chatroom=chatroom_id)
        db.session.add(user_channel)
        db.session.commit()
        return jsonify({"failure":False, "channel_id": chatroom_id})

@app.route("/create_channel/<username>")
def go_create_channel(username):
    return render_template("index.html")

@app.route("/channel/json/<channel_name>")
def channel_page(channel_name):
    """
        Display the channel content(messages), when user click on channel link
    """

    chatroom = Chatroom.query.filter_by(name=channel_name).first()
    chatroom_id = chatroom.id
    relation = Chatroom_messages.query.filter_by(chatroom=chatroom_id).all()

    messages = []
    for element in relation:
        message = Message.query.get(element.message)
        username = Username.query.get(message.sender).name
        messages.append({"username": username, "time":message.time, "date":message.date, "content":message.message, "id":message.id})

    return jsonify({"messages":messages, "channel_id":chatroom_id})

@app.route("/channel/<channel_name>")
def channel(channel_name):
    """
        Display the channel content. This is when the user refresh the webpage
    """
    return render_template("index.html")


@socketio.on("sending message")
def send_message(data):
    """
        allow the user to send a message, and other user to receive inside a channel
        add message to the channel
    """

    message = data["message"]
    username_id = data["username_id"]
    username = data["username"]
    current_time = data["current_time"]
    channel = data["channel"]
    date = data["date"]

    #save message in database
    msg = Message(message=message, sender=username_id, date=date, time=current_time, chatroom=channel)
    db.session.add(msg)
    db.session.commit()

    msg_relation = Chatroom_messages.query.filter_by(chatroom=channel).all()

    #if it is the first message in the channel, immediatly dispaly it with today's date
    if len(msg_relation) == 0:
        emit("broadcast message", {"date":date, "message":message, "username":username, "current_time":current_time, "channel":channel, "id":msg.id}, broadcast=True)

    else:
        last_msg_date = Message.query.get(msg_relation[-1].message).date

        if date != last_msg_date:
            emit("broadcast message", {"date":date, "message":message, "username":username, "current_time":current_time, "channel":channel, "id":msg.id}, broadcast=True)

        else:
             emit("broadcast message", {"message":message, "username":username, "current_time":current_time, "channel":channel, "id":msg.id}, broadcast=True)


    msg_chatroom = Chatroom_messages(chatroom=channel, message=msg.id)
    db.session.add(msg_chatroom)
    db.session.commit()

@app.route("/deleteMessage/<id>")
def delete_message(id):
    """
        delete a message
    """
    id=int(id)
    msg = Message.query.get(id)
    db.session.delete(msg)
    db.session.commit()

    return jsonify({})


@app.route("/json/<channel>/add_user/<username>")
def usernames_list(channel, username):
    """
        render list of usernames that can be added to the chatroom
    """
    #extract list of users that are members of this channels
    members_dict={}
    members = Username_Chatroom.query.filter_by(chatroom=channel).all()
    for user in members:
        user_id = user.username
        if members_dict.get(str(user_id)) == None:
            user = (Username.query.get(user_id)).name
            members_dict[str(user_id)] = user


    #extract all users and remove those that are in the members dictionary
    all_members  = Username.query.all()
    usernames_list = []
    for member in all_members:
        if members_dict.get(str(member.id)) == None:
            usernames_list.append(member.name)
    usernames_list = sorted(usernames_list)
    return jsonify({"usernames":usernames_list})


@socketio.on("add user")
def add_user(data):
    """
       Allow a user of the channel to add new user to the channel
    """

    #get data needed to add user to a channel
    channel_id = data["channel_id"]
    channel_name = data["channel_name"]
    user = data["user"]
    adder_id = data["adder"]
    adder_name = data["adder_name"]


    #link user to the chatroom database
    user_id = (Username.query.filter_by(name=user).first()).id
    link = Username_Chatroom(username=user_id, chatroom=channel_id)
    db.session.add(link)
    db.session.commit()

    #emit the message to the user if they are online
    socketio.emit('broadcast added_user', {'adder':adder_name, 'user': user, 'channel':channel_name}, broadcast=True)


@app.route("/<channel>/members/<user>")
def members(channel, user):
    """
        return list of all the members in the chatrooms
    """

    members = []
    members_query = Username_Chatroom.query.filter_by(chatroom=channel).all()
    for element in members_query:
        user_id = element.username
        if user_id != session["user_id"]:
            user = (Username.query.get(user_id)).name
            members.append(user)
    members = sorted(members)
    return jsonify({"members":members})


@app.route("/leave_chatroom/<username>/<channel>")
def leave_chatroom(username, channel):
    """
        Allow user to leave the chatroom
    """
    to_delete = Username_Chatroom.query.filter_by(chatroom=channel, username=username).first()
    db.session.delete(to_delete)
    db.session.commit()


    check = Username_Chatroom.query.filter_by(chatroom=channel).all()
    #check if there is still members in channel, if no members, delete the chatroom

    if len(check)  == 0:
        delete = Chatroom.query.get(channel)
        db.session.delete(delete)
        db.session.commit()

    return jsonify({"success": True})

if __name__ == '__main__':
    app.run()
