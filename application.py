import os
import sys

from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_socketio import SocketIO, emit, send
import json

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"

socketio = SocketIO(app)

message_id = 0
usernames = []
channel_names = []
channel_contents = {}


def insertIt(theList, item):
    """
        insert algorithm that insert
        insert item in theList in increasing order
        item should be a string
    """
    if len(theList) == 0:
        theList.append(item)
    else:
        min = 0
        max = len(theList)
        mid = (min + max)//2

        while min <= max:
            if len(theList[min:max]) == 1:
                if theList[mid] > item:
                    theList.insert(mid, item)
                else:
                    theList.insert(mid+1, item)
                break
            elif theList[mid].lower() == item:
                theList.insert(mid, item)
                break
            elif theList[mid].lower() > item:
                max = mid
                mid = (max+min)//2

            elif theList[mid].lower() < item:
                min = mid
                mid = (max+min)//2

@app.route("/")
def index():

    """
        Go to the homapege when the user first get to the webpage
    """
    return render_template("index.html", channels=channel_names)

@app.route("/home")
def home():
    """
        When the user goes back to the homapage
    """
    return jsonify({"channels": channel_names})


@app.route("/signup", methods=["POST"])
def signup():
    """
        Allow the user to create an unique display name(aka username)
        Make sure the user picked an unique display name that does not exist yet
    """
    username = request.form.get("username")
    print(username)
    if username in usernames:
        return jsonify({"success":False})
    else:
        insertIt(usernames, username)
        return jsonify({"success":True})

@app.route("/create_channel", methods=["GET", "POST"])
def create_channel():
    """
        Allow the user to create a channel as long as the name of the channel
        name has not been taken yet"""

    if request.method == "POST":
        channel = request.form.get("channel-name").lower()
        if channel in channel_names:
            return jsonify({"failure":True})

        else:
            insertIt(channel_names, channel)
            channel_contents[channel] = []
            print("this is channel content", channel_contents)
            return jsonify({"failure":False})
    else:
        return render_template("index.html", channels=channel_names)





@app.route("/channel/json/<channel_name>")
def channel_page(channel_name):
    """
        Display the channel content(messages)
    """
    return jsonify({"messages":channel_contents[channel_name]})

@app.route("/channel/<channel_name>")
def channel(channel_name):
    """
        Display the channel content. This is when the user refresh the webpage
    """
    return render_template("index.html", messages=channel_contents[channel_name], channels=channel_names)


@socketio.on("sending message")
def vote(data):
    """
        allow the user to send a message, and other user to receive inside a channel
        add message to the channel
    """
    global message_id
    message = data["message"]
    username = data["username"]
    current_time = data["current_time"]
    channel = data["channel"]
    date = data["date"]

    #check if it is the first message of the day or not
    if len(channel_contents[channel]) == 0:
        emit("broadcast message", {"date":date, "message":message, "username":username, "current_time":current_time, "channel":channel, "id":message_id}, broadcast=True)
    else:
        if channel_contents[channel][-1]["date"] != date:
            emit("broadcast message", {"date":date, "message":message, "username":username, "current_time":current_time, "channel":channel, "id":message_id}, broadcast=True)
        else:
            emit("broadcast message", {"message":message, "username":username, "current_time":current_time, "channel":channel, "id":message_id}, broadcast=True)
    #save message
    channel_contents[channel].append({"date":date, "time":current_time, "username":username, "content":message, "id":message_id})

    #increment the message_id variable
    message_id += 1

@socketio.on("create channel")
def new_channel(data):
    """
        add new channel to the navbar of every user
    """
    channel = data["channel"]
    user = data["user"]
    emit("broadcast new_channel", {"channel":channel, "user": user}, broadcast=True)

@app.route("/deleteMessage/<id>/<channel>")
def delete_message(id, channel):
    """
        delete a message
    """
    id=int(id)
    messageDate =""
    for message in channel_contents[channel]:
        if message["id"] == id:
            messageDate = message["date"]
            channel_contents[channel].remove(message)
    if len(channel_contents[channel]) == 0:
        print("it is zero")
        return jsonify({"removedate": True})
    if channel_contents[channel][-1]["date"] != messageDate:
        print("they are not equal")
        return jsonify({"removedate": True})
    return jsonify({})
