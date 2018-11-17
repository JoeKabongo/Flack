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

#list of all the users
usernames = []

#list of all chatrooms
channel_names = []

#all messags containted in the chatrooms
channel_contents = {}

#maps users to channels that are members, or channel they can access
users_toChannels = {}


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
    return render_template("index.html")

@app.route("/home/<username>")
def home(username):
    """
        When the user goes back to the homapage
    """
    print("We on the homepage")
    return jsonify({"channels": users_toChannels[username]})

@app.route("/signup", methods=["POST"])
def signup():
    """
        Allow the user to create an unique display name(aka username)
        Make sure the user picked an unique display name that does not exist yet
    """
    global  usernames
    username = request.form.get("username")
    print("the username ", username)
    print("all usernames: ", usernames)
    if username in usernames:
        return jsonify({"success":False})
    else:
        insertIt(usernames, username)
        users_toChannels[username] = []
        return jsonify({"success":True})

@app.route("/create_channel_post", methods=["POST"])
def create_channel():
    """
        Allow the user to create a channel as long as the name of the channel
        name has not been taken yet"""

    channel = request.form.get("channel-name").lower()
    founder = request.form.get("founder")
    if channel in channel_names:
        return jsonify({"failure":True})

    else:
        insertIt(channel_names, channel)
        channel_contents[channel] = [{"next_messageId": 0, "members":[founder], "founder":founder}]
        insertIt(users_toChannels[founder], channel)
        print("this is channel content", channel_contents)
        return jsonify({"failure":False})

@app.route("/create_channel/<username>")
def go_create_channel(username):
    return render_template("index.html", channels=users_toChannels[username])

@app.route("/channel/json/<channel_name>/<username>")
def channel_page(channel_name, username):
    """
        Display the channel content(messages)
    """
    if channel_name in  users_toChannels[username]:
        return jsonify({"messages":channel_contents[channel_name][1:],"channels": users_toChannels[username]})

    else:
        return redirect(url_for("home", username=username))





@app.route("/channel/<channel_name>")
def channel(channel_name):
    """
        Display the channel content. This is when the user refresh the webpage
    """
    return render_template("index.html", messages=channel_contents[channel_name][1:], channels=channel_names)


@socketio.on("sending message")
def send_message(data):
    """
        allow the user to send a message, and other user to receive inside a channel
        add message to the channel
    """
    global message_id

    print("ibside the socket blablabla")
    message = data["message"]
    username = data["username"]
    current_time = data["current_time"]
    channel = data["channel"]
    date = data["date"]

    #check if it is the first message of the day or not
    if len(channel_contents[channel]) == 1:
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

@app.route("/deleteMessage/<id>/<channel>")
def delete_message(id, channel):
    """
        delete a message
    """
    id=int(id)
    messageDate =""
    print(channel_contents[channel][1:])

    #remove the message was the channel
    for message in channel_contents[channel][1:]:
        if message["id"] == id:
            messageDate = message["date"]
            channel_contents[channel].remove(message)

    #check if this was the only message of the day
    if len(channel_contents[channel]) == 1:
        return jsonify({"removedate": True})

    if channel_contents[channel][-1]["date"] != messageDate:
        return jsonify({"removedate": True})
    return jsonify({})


@app.route("/json/<channel>/add_user/<username>")
def usernames_list(channel, username):
    """
        render list of usernames that can be added to the chatroom
    """
    copy = usernames[:]
    result = []

    #lis of all members
    members = channel_contents[channel][0]["members"]
    length = len(copy)

    for i in range(0, length):
        if copy[i] not in members:
            result.append(copy[i])
    return jsonify({"usernames":result})



@socketio.on("add user")
def add_user(data):
    """
       Allow the founder of the channel to add new user to their channel
    """
    channel = data["channel"]
    user = data["user"]
    founder = data["founder"]


    insertIt(channel_contents[channel][0]["members"], user)
    insertIt(users_toChannels[user], channel)

    socketio.emit('broadcast added_user', {'founder':founder, 'user': user, 'channel':channel}, broadcast=True)


@app.route("/<channel>/members")
def members(channel):
    """
        return list of all the members in the chatrooms
    """
    print("we supposed to be in here")
    return jsonify({"members":channel_contents[channel][0]["members"]})




@socketio.on("remove user")
def remove_user(data):
    """
       Allow the founder of the channel to remove user from their channel
    """
    channel = data["channel"]
    user = data["user"]
    founder = data["founder"]

    channel_contents[channel][0]["members"].remove(user)
    users_toChannels[user].remove(channel)

    socketio.emit('broadcast remove_user', {'founder':founder, 'user': user, 'channel':channel}, broadcast=True)
