//remember all channels
var ALL_CHANNEL_LINKS;

document.addEventListener('DOMContentLoaded', function () {

    //remember all channels
    ALL_CHANNEL_LINKS = document.querySelectorAll(".channel-link");
    all_channel_link_update();

    //check if it is the first time the person visit the website on this browser
    if (localStorage.getItem('display-name') == null)
    {
      //display sign up form
      let toDisplay = [document.querySelector("#signup-div")]
      updatePage(toDisplay);
    }
    else{

      //return the the last channel the user visited
      if(localStorage.getItem("last-channel") != null)
      {

        let channel = localStorage.getItem("last-channel")
        let route = "channel/json/" + channel + "/"+ localStorage.getItem("display-name");
        channel_page(route, localStorage.getItem("last-channel"), true);

        // Push state to URL. and save it in the history
        document.title = "Flack | " + localStorage.getItem("last-channel");
        history.pushState({"title":document.title, "channel":route}, document.title, "/channel/"+channel);

        let allLinks = document.querySelectorAll(".channel-link");

        //highlight urrent channel in different color
        for(var i = 0; i < allLinks.length; i++)
        {
          if(allLinks[i].innerHTML == localStorage.getItem("last-channel"))
          {
            update_links(allLinks[i]);
          }
        }

      }
      else{

        let url =  document.URL.split("/");

        if(url[url.length-2] == "create_channel" && url[url.length-1] == localStorage.getItem("display-name"))
        {
          let toDisplay = [document.querySelector("#navigation-bar"),document.querySelector("#create-channel-div")];
          updatePage(toDisplay);
          document.title = "Flack | Create channel";
        }

        else
        {
          // go to homepage
          goHomePage();
        }
      }
    }


  //submit the sign up form. When the user give a display name for the site use
  document.querySelector('#signup-form').onsubmit = function (){

    //open a http request
    let request = new XMLHttpRequest();
    request.open('POST', '/signup');

    let username = document.querySelector("#display-name").value;

    //Callback function for when request completes
    request.onload = function  ()  {
        let response = JSON.parse(request.responseText);

        //Check if the request returned true or not aka if ther username the user typed as already been used by someone else
        if(response.success){

          //display home and navigation bar
          let toDisplay = [document.querySelector("#navigation-bar"), document.querySelector("#home-display")];
          updatePage(toDisplay);

          localStorage.setItem("display-name", username);
        }else{
          document.querySelector("#signup-alert").style.display = "";
        }

     };
   // Add data to send with request to the server
   let data = new FormData();
   data.append("username", username);
   request.send(data)

   return false;
  };

  //close the signup alert box
  document.querySelector("#close-signup-alert").onclick = function(){
    document.querySelector("#signup-alert").style.display = "none";
  }
  document.querySelector("#display-name").onkeyup = function()
  {
    document.querySelector("#signup-alert").style.display = "none";
  }

  //when create channel link is clicked
  document.querySelector("#create-channel-link").onclick = function(e)
  {
    //prevent link from submitting
    e.preventDefault();

    //Callback function for when request completes
    updatePage([document.querySelector("#create-channel-div"), document.querySelector("#navigation-bar")]);

    // Push state to URL.
    document.title = "Flack | " + "Create channel";
    history.pushState({"title":document.title, "action":"#create-channel-link"}, document.title, "/create_channel/"+localStorage.getItem("display-name"));

    update_links();

    localStorage.removeItem("last-channel");


    return false;
  };

  // Connect to websocket
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  // When connected, configure buttons
   socket.on('connect', () => {

     //When the user send a message
     document.querySelector("#btn-send-message").onclick = function(){

       //remove leading withe space from the message
       let message = document.querySelector("#message").value.trim();

       //only send message if then input is not empty. with current time , useraname and channel it was sent in
       if(message != "")
       {
         let currentTime = current_time();
         let date = get_date();
         let username = localStorage.getItem("display-name");
         let channel =  localStorage.getItem("last-channel");
         socket.emit('sending message', {"date": date, "channel":channel, "message": message, "current_time":currentTime, "username":username});
         return false;
       }

       //reset the input to be empty
       document.querySelector("#message").value = "";

     };

     //allow the creator of the chatrooms to add users, by displaying availabe they can add
     document.querySelector("#addUser-btn").onclick = function(e, save=true)
     {
       e.preventDefault();

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

         //display list of users and navigation bar
         let toDisplay = [document.querySelector("#navigation-bar"), document.querySelector("#usernames-list")];
         updatePage(toDisplay);

         if(save)
         {
           // Push state to URL.
           document.title += " | Add user";
         }
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
       }


       request.send("");
     };

     //when the user click to see members in the chatroom
     document.querySelector("#member-list-btn").onclick = function(e)
     {
        e.preventDefault();
        let channel = localStorage.getItem("last-channel");
        let request = new XMLHttpRequest;

        request.open("GET", "/" +  channel + "/members")

        request.onload = function()
        {
          let response = (JSON.parse(request.responseText)).members;
          const post_template = Handlebars.compile(document.querySelector('#channel-members').innerHTML);
          const members = post_template({'members': response});
          document.querySelector('#usernames-list').innerHTML = "";
          document.querySelector('#usernames-list').innerHTML += members;
          document.querySelector('#usernames-list').style.display = "block";

          // Push state to URL. and save it in the history
          document.title = "Flack | " + channel + "| Members";

          //display list of users and navigation bar
          let toDisplay = [document.querySelector("#navigation-bar"), document.querySelector("#usernames-list")];
          updatePage(toDisplay);


          let buttons = document.querySelectorAll(".remove-user-button");
          buttons.forEach(function(button){
             button.onclick = function(e)
             {
               //remove the user from the list when add to the webpage
               let parent = button.parentElement;
               parent.remove();
               let userToAdd = button.previousElementSibling.innerHTML;
               e.preventDefault();
               socket.emit("remove user", {"founder":localStorage.getItem("display-name"), "channel":localStorage.getItem("last-channel"), "user":userToAdd})
             };
           });

        };

        request.send();
     };



  });

  //alert a user when they had been added to a channel and add their channel to their navbar
  socket.on('broadcast added_user', data => {
    if(data.user == localStorage.getItem("display-name"))
    {
      add_channel_link(data.channel, false);

      //add the channel to the DOM (navbar) if the name has not been taken
      const post_template = Handlebars.compile(document.querySelector('#add-user-message').innerHTML);
      const message = post_template({'channel': data.channel, 'founder':data.founder});
      document.querySelector('body').innerHTML += message;

      all_channel_link_update();


    }

  });

   //broadcast the message to all the users.
   socket.on('broadcast message', data => {


     //display the message only if it is in the channel in which the message was sent
     if(data.channel == localStorage.getItem("last-channel"))
     {
       if(data.date != null){
         let template = Handlebars.compile(document.querySelector('.date').innerHTML);
         let m  = template({"date": data.date});
         document.querySelector("#messages-section").innerHTML += m;
       }
       let message_sent = data.message;
       let username = data.username;
       let currentTime = data.current_time;
       let id = data.id;


       //check if the message was sent by this user, if so add a delete button
       // to allow them to delete their message
       let deleteButton = username == localStorage.getItem('display-name');

       //add messsage to the dom
       const post_template = Handlebars.compile(document.querySelector('#messages').innerHTML);
       const message = post_template({'message': message_sent, "username":username, "time": currentTime, "detele-button":deleteButton, "id":id});
       document.querySelector('#messages-section').innerHTML += message;
       window.scrollTo(0,document.body.scrollHeight);

       //reset the input field to empty string
       document.querySelector("#message").value = "";
     }

   });

   //alert a user when they had been added to a channel and add their channel to their navbar
   socket.on('broadcast remove_user', data => {
     if(data.user == localStorage.getItem("display-name"))
     {

       //add the channel to the DOM (navbar) if the name has not been taken
       const post_template = Handlebars.compile(document.querySelector('#remove-user-message').innerHTML);
       const message = post_template({'channel': data.channel, 'founder':data.founder});
       document.querySelector('body').innerHTML += message;

      ALL_CHANNEL_LINKS.forEach(function(link){
        console.log("link : ", link.innerHTML);
        console.log("channel: ", data.channel);
        if(link.innerHTML == data.channel)
        {
            link.innerHTML = "jonathan";
            console.log(link.innerHTML);
        }
      })
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

   //add channel to navbar
   function add_channel_link(channel, isCurrent)
   {
     let allLinks = document.querySelectorAll(".channel-link");

      //create a new link
      var a = document.createElement('a');
      var linkText = document.createTextNode(channel);
      a.appendChild(linkText);
      a.href = "";
      a.id = channel;
      if (isCurrent)
        a.className = "channel-link current-channel";
      else
        a.className = "channel-link";

      a.title = channel;

       // insert the link at the right place so the nav bar stay alphabetically sorted
       if(ALL_CHANNEL_LINKS.length == 0 || ALL_CHANNEL_LINKS[ALL_CHANNEL_LINKS.length-1].innerHTML < channel)
       {
         document.querySelector("#channels").append(a);
       }
       else{
         var referenceNode = ALL_CHANNEL_LINKS[0];

         for(var i =0; i < ALL_CHANNEL_LINKS.length; i++)
         {
           referenceNode = ALL_CHANNEL_LINKS[i];
           if(channel < ALL_CHANNEL_LINKS[i].innerHTML)
               break;
         }

        // Insert the new node before the reference node
        referenceNode.parentNode.insertBefore(a, referenceNode);
      }

      ALL_CHANNEL_LINKS = document.querySelectorAll(".channel-link");
      all_channel_link_update();
   }


  // not allow space or dot in channel name input
  document.querySelector("#channel-name").onkeydown = function(e){
    if (e.which === 32)
       return false;
    if (e.which === 190)
       return false;
  };
  // Make all letters lower case
  document.querySelector("#channel-name").onkeyup = function(e){
    document.querySelector("#channel-name").value = document.querySelector("#channel-name").value.toLowerCase();
    document.querySelector("#create-channel-alert").style.display = "none";
    document.querySelector("#create-channel-success").style.display = "none";
  };

  //close the create-channel alert message or sucess message
  document.querySelector("#close-create-channel-alert").onclick = function(){
    document.querySelector("#create-channel-alert").style.display = "none";
  }
  document.querySelector("#close-create-channel-success").onclick = function()
  {
    document.querySelector("#create-channel-success").style.display = "none";
  }



  //when the user return to the homepage
   document.querySelector(".Home").onclick = function (e){
    e.preventDefault();
    goHomePage();
  };

  //goes to the homepage
  function goHomePage()
  {
    let request = new XMLHttpRequest();
    request.open('GET', '/home/'+localStorage.getItem("display-name"));

    request.onload = function ()
    {
      let response = JSON.parse(request.responseText);
      let channels = response.channels;
      let contacts = response.personMessages;
      document.querySelector('#channels').innerHTML = "";


      for(var i = 0; i < channels.length; i++){
        //add the channel to the DOM (navbar) if the name has not been taken
        const post_template = Handlebars.compile(document.querySelector('#new-channel').innerHTML);
        const new_channel = post_template({'channel': channels[i]});
        document.querySelector('#channels').innerHTML += new_channel;
      }

      //update all links variable
      ALL_CHANNEL_LINKS = document.querySelectorAll(".channel-link");
      all_channel_link_update();

      //update the display of the webpage
      updatePage([document.querySelector("#home-display"), document.querySelector("#navigation-bar")]);
    };

    // Push state to URL. and save it in the history
    document.title = "Flack | Home";
    history.pushState({"title":document.title, "action":".Home"}, document.title, "/");

    //forget the last channel
    localStorage.removeItem("last-channel");

    request.send();
    return false;
  }


  //when the user click on a channel, display channel information(messages)
  function all_channel_link_update()
  {
    ALL_CHANNEL_LINKS.forEach(function(link){
      link.onclick =function(e){

        //prevent link from submitting
        e.preventDefault();

        //get the channel name
        let channel = link.innerHTML;

        //remember the channel
        localStorage.setItem("last-channel", channel);

        ///update the webpage by calling the channel page function
        let route = "channel/json/" + channel + "/"+ localStorage.getItem("display-name");
        channel_page(route, channel);

        // Push state to URL. and save it in the history
        document.title = "Flack | " + channel;
        history.pushState({"title":document.title, "channel":route}, document.title, "/channel/"+channel);
        update_links(this);

      };
    })
  }


  // Update text on popping state.
    window.onpopstate = e => {
        const data = e.state;
        document.title = data.title;

        //if its a channel page
        if(data.channel)
        {
          let route = data.channel;
          let channel = data.channel.split("/")[2];
          channel_page(route, channel);
          update_links_pop(channel);
          return false;
        }

        else if(data.action == "#create-channel-link")
        {
          //Callback function for when request completes
          updatePage([document.querySelector("#create-channel-div"), document.querySelector("#navigation-bar")]);
          update_links();
        }

        else if(data.action == "#addUser-btn")
        {
          document.querySelector("#addUser-btn").onclick(e, save=false);
        }

        else{
          //update the display of the webpage
          updatePage([document.querySelector("#home-display"), document.querySelector("#navigation-bar")]);
          update_links();

      }
    };

 // retrieve data of a channel from the server and display on the webpage
 function channel_page(route, channel, reload = false)
 {

   //open a get request
   let request = new XMLHttpRequest();
   request.open("GET", `/${route}`);

   request.onload = function(){

       //get the messages of the channel from the server response
       let response = JSON.parse(request.responseText);
       let messages = response.messages;

       //show the message section of a channel and hide the other part of the website
       updatePage([document.querySelector("#channel-messages"), document.querySelector("#navigation-bar")]);
       document.querySelector('#messages-section').innerHTML="";

       let previousDate = "00000";
       for(i=0; i<messages.length; i++)
       {
           let data = messages[i];
           let username = data.username;
           let time = data.time;
           let content = data.content;
           let id = data.id;

           // display the date on top of text message that were sent on the same day
           if(data.date != previousDate)
           {
             let template = Handlebars.compile(document.querySelector('.date').innerHTML);
             let m  = template({"date": data.date});
             document.querySelector("#messages-section").innerHTML += m;
             previousDate =  data.date;
           }

           //check if the message was sent by this user, if so add a delete button
           // to allow them to delete their message
           let deleteButton = username == localStorage.getItem('display-name');

           //add the message to the DOM
           const post_template = Handlebars.compile(document.querySelector('#messages').innerHTML);
           const message = post_template({'message': content, "username":username, "time": time, "detele-button":deleteButton, "id":id});
           document.querySelector('#messages-section').innerHTML += message;
       }
       window.scrollTo(0,document.body.scrollHeight);

       // if the use
       if(reload)
       {
         let channels = response.channels;
         document.querySelector('#channels').innerHTML = "";

         for(var i = 0; i < channels.length; i++){
           //add the channel to the DOM (navbar) if the name has not been taken
           const post_template = Handlebars.compile(document.querySelector('#new-channel').innerHTML);
           const new_channel = post_template({'channel': channels[i]});
           document.querySelector('#channels').innerHTML += new_channel;
         }

         //update all links variable
         ALL_CHANNEL_LINKS = document.querySelectorAll(".channel-link");
         all_channel_link_update();
       }


   };
   // Send channel name to ther server request to the server
   let data = new FormData();
   data.append("channel-name",channel);
   request.send(data);
 }
});

// update the page
//divs is an array of div that should be displayed, the rest display will be set to none
function updatePage(divs)
{
  let mainDivs = document.querySelector("body").children;
  for(var i = 0; i < mainDivs.length; i++)
  {
    if(divs.includes(mainDivs[i]))
    {
       mainDivs[i].style.display="block";
     }
    else
       mainDivs[i].style.display = "none";
  }
}

//Return the currentTime in form of 09:05 AM
function current_time(){
  var time = new Date();
  return time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
}


var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

//return the ordinal versin of a number.
// example: get_ordinal(56) return 56th
function get_ordinal(num)
{
  if(num >= 10 && num <20)
  {
    return num + "th";
  }
  else {
    num = num.toString();
    lastDigit = num[num.length - 1];
    if(lastDigit == "1")
      return num + "st";
    else if(lastDigit == "2")
      return num +"nd";
    else if(lastDigit == "3")
      return num+"rd";
    else
      return num+"th";
  }
}

//current date in form of Day, Month, day number. Example Saturday, September 15th
function get_date()
{
  var time = new Date();
  day = days[time.getDay()];
  month = months[time.getMonth()];
  date = get_ordinal(time.getDate());
  year = time.getYear();
  return day + ", " + month + " " + date;
}

// update channel link
function update_links(link)
{
  ALL_CHANNEL_LINKS = document.querySelectorAll(".channel-link");
  for(var i = 0; i < ALL_CHANNEL_LINKS.length; i++)
  {
    if (ALL_CHANNEL_LINKS[i] == link)
    {
      ALL_CHANNEL_LINKS[i].classList.add('current-channel');
      //console.log("link", link);
    }
    else
    {
      ALL_CHANNEL_LINKS[i].classList.remove("current-channel");
    }
  }

  for(var i = 0; i < 2; i++)
  {
    console.log(ALL_CHANNEL_LINKS[i]);
  }
}

// update link for the pop pushState
function update_links_pop(link)
{
  console.log("this is the link: " + link);
  let allLinks = document.querySelectorAll(".channel-link");
  for(var i = 0; i < allLinks.length; i++)
  {
    if (allLinks[i].innerHTML == link)
    {
      allLinks[i].classList.add('current-channel');
    }
    else
    {
      allLinks[i].classList.remove("current-channel");
    }
  }
}


//Delete a message when delete button was press
function deleteMessage(button)
{
  button.parentElement.style.animationPlayState = 'running';
  button.parentElement.addEventListener('animationend', () =>  {

     let previousElement = button.parentElement.previousElementSibling;

      let id = button.parentElement.id;
      let currentChannel = localStorage.getItem("last-channel");

      //open a http http XMLHttpRequest
      let request = new XMLHttpRequest();
      request.open('GET', "/deleteMessage/" + id + "/" +currentChannel);

      //Callback function for when request completes
      request.onload = function (){
        let response = JSON.parse(request.responseText);

        //if it was the only message of that day, remove the date
        if(response.removedate)
        {
          previousElement.remove();
        }
      }
      button.parentElement.remove();
      request.send();
      return false;
    })
}
