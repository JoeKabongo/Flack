//allow the creator of the chatrooms to add users, by displaying availabe they can add
document.querySelector("#addUser-btn").onclick = function(e, save=true)
{
  e.preventDefault();

  //only highlight the clicked link
  this.classList.add("highlight");
  document.querySelector("#member-list-btn").classList.remove("highlight");
  document.querySelector('#channel-message-btn').classList.remove("highlight");

  let route = "/json/" + localStorage.getItem("last-channel")+"/add_user/"+localStorage.getItem("display-name");
  //open a get request
  let request = new XMLHttpRequest();
  request.open("GET", route);

  request.onload = function()
  {
    let response = JSON.parse(request.responseText);
    let usernames = response.usernames;
    for(var i = 0; i < 2; i++)
    {
      console.log(usernames[i]);
    }
    //add the message to the DOM
    const post_template = Handlebars.compile(document.querySelector('#users').innerHTML);
    const users = post_template({"usernames":usernames});


    document.querySelector("#usernames-list").innerHTML = "";
    document.querySelector("#usernames-list").innerHTML += users;
    document.title = "Flack | " + localStorage.getItem("last-channel")+ " | Add user";

    UsersList = document.querySelectorAll(".add-user-button");
    UsersList.forEach(function(button){
       button.onclick = function(e)
       {
         //remove the user from the list when add to the webpage
         let parent = button.parentElement;
         parent.remove();
         let userToRemove = button.previousElementSibling.innerHTML;
         e.preventDefault();
         socket.emit("add user", {"founder":localStorage.getItem("display-name"), "channel":localStorage.getItem("last-channel"), "user":userToRemove})
       };
     });

     document.querySelector("#messages-section").style.display = "none";
     document.querySelector("#send-message").style.display = "none";
  };

  request.send("");
};


//alert a user when they had been added to a channel and add their channel to their navbar
socket.on('broadcast added_user', data => {
  if(data.user == localStorage.getItem("display-name"))
  {
    add_channel_link(data.channel, false);

    //add the channel to the DOM (navbar) if the name has not been taken
    const post_template = Handlebars.compile(document.querySelector('#add-user-message').innerHTML);
    const message = post_template({'channel': data.channel, 'founder':data.founder});
    document.querySelector('body').innerHTML += message;
    updateAfterAddRemoveUser();
  }

});


   //when the user try to create a channel
   document.querySelector("#create-channel-form").onsubmit = function(e)
   {
     e.preventDefault();

     let channel = document.querySelector("#channel-name").value;

     //open a http http XMLHttpRequest
     let request = new XMLHttpRequest();
     request.open('POST', '/create_channel_post');

     //Callback function for when request completes
     request.onload = function (){
       let response = JSON.parse(request.responseText);

       //check if the name chose for channel has already been taken

       if(response.failure)
       {
         document.querySelector("#create-channel-alert").style.display = "";
       }else{

         //get the channel name
         localStorage.setItem("last-channel", channel);
         let route = "channel/json/" + channel +"/"+localStorage.getItem("display-name");
         channel_page(route, channel, false);

         // Push state to URL. and save it in the history
         document.title = "Flack | " + channel;
         history.pushState({"title":document.title, "channel":route}, document.title, "/channel/"+channel);

         //add channel link to the dom
         add_channel_link(channel, true);

       }

       //show the alert  message for 5 seconds
       setTimeout(function(){
         document.querySelector("#create-channel-success").style.display = "none";
         document.querySelector("#create-channel-alert").style.display = "none";
       }, 2000);

     };

     // send the name of the channel to the server
     let data = new FormData();
     data.append("founder", localStorage.getItem("display-name"));
     data.append("channel-name",channel);
     request.send(data);

     return false;

   };
