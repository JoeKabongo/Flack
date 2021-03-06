//remember all channels
var ALL_CHANNEL_LINKS;

document.addEventListener('DOMContentLoaded', function () {

    //remember all channels
    ALL_CHANNEL_LINKS = document.querySelectorAll(".channel-link");
    all_channel_link_update();

    //check if it is the first time the person visit the website on this browser
    if (localStorage.getItem('display-name') == null)
    {
      // Push state to URL. and save it in the history
      document.title = "Flack | Sign in/Sign up" ;
      history.pushState({"title":document.title, "signinSignupPage":true}, document.title,  "/");

      //display sign up form
      let toDisplay = [document.querySelector("#signup-div")]
      updatePage(toDisplay);
    }
    else{
      goHomePage();

    }


  //submit the sign up form. When the user give a display name for the site use
  document.querySelector('#signup-form').onsubmit = function (e){

    e.preventDefault();
    //open a http request
    let request = new XMLHttpRequest();
    request.open('POST', '/signup');

    let username = document.querySelector("#display-name").value;
    let password = document.querySelector("#signup-password").value;
    let confirm_password = document.querySelector("#signup_assword_confirmation").value;

    //Callback function for when request completes
    request.onload = function  ()  {
        let response = JSON.parse(request.responseText);

        //Check if the request returned true or not aka if ther username the user typed as already been used by someone else
        if(response.success){

          //display home and navigation bar
          localStorage.setItem("display-name", username);
          localStorage.setItem("user_id", response.user_id)
          goHomePage();

        }else{
          document.querySelector("#signup-alert").style.display = "";
          document.querySelector("#span-alert-message").innerHTML = response.message;
        }

     };
   // Add data to send with request to the server
   let data = new FormData();
   data.append("username", username);
   data.append("password", password);
   data.append("confirm_password", confirm_password);
   request.send(data)

   return false;
  };

  //when the user is signin in
  document.querySelector("#signin-form").onsubmit = function (e)
  {
    e.preventDefault();
    let username = document.querySelector("#display-name1").value;
    let password = document.querySelector("#signin-password").value;

    let request = new XMLHttpRequest();

    request.open("POST", "/signin");

    //when the request has loaded
    request.onload = function ()
    {
      let response = JSON.parse(request.responseText);

      //if the user entered the correct information, go to home page, else alert the user
      if(response.success)
      {
        //display home and navigation bar
        localStorage.setItem("display-name", username);
        localStorage.setItem("user_id", response.user_id);
        goHomePage();
      }
      else
      {
        document.querySelector("#signup-alert").style.display = "";
        document.querySelector("#span-alert-message").innerHTML = response.message;
      }
    }

    // Add data to send with request to the server
    let data = new FormData();
    data.append("username", username);
    data.append("password", password);
    request.send(data)

    return false;
  }

  //allow the user to signout
  document.querySelector("#signout-link").onclick = function(e)
  {
    e.preventDefault();

    // this is when the user sign out and click the back button
    localStorage.setItem("recovery-name", localStorage.getItem("display-name"));

    localStorage.removeItem("display-name");
    localStorage.removeItem("user_id");
    localStorage.removeItem("last-channel");
    localStorage.removeItem("last-channel-id");

    //display sign up form
    let toDisplay = [document.querySelector("#signup-div")]
    updatePage(toDisplay);

  }

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
     document.querySelector("#btn-send-message").onclick = function()
     {
       //remove leading withe space from the message
       let message = document.querySelector("#message").value.trim();

       //only send message if then input is not empty. with current time , useraname and channel it was sent in
       if(message != "")
       {
         let currentTime = current_time();
         let date = get_date();
         let username = localStorage.getItem("display-name");
         let username_id =   localStorage.getItem("user_id");
         let channel =  localStorage.getItem("last-channel-id");
         socket.emit('sending message', {"date": date, "channel":channel, "message": message, "current_time":currentTime, "username":username, "username_id":username_id});
         return false;
       }
       //reset the input to be empty
       document.querySelector("#message").value = "";
     };

     //allow a user  to add users to chatroom by displaying availabe they can add
     document.querySelector("#addUser-btn").onclick = function(e, save=true)
     {
       e.preventDefault();

       //only highlight the clicked link
       this.classList.add("highlight");
       document.querySelector("#member-list-btn").classList.remove("highlight");
       document.querySelector('#channel-message-btn').classList.remove("highlight");

       let route = "/json/" + localStorage.getItem("last-channel-id")+"/add_user/"+localStorage.getItem("display-name");
       //open a get request
       let request = new XMLHttpRequest();
       request.open("GET", route);

       request.onload = function()
       {
         let response = JSON.parse(request.responseText);
         let usernames = response.usernames;

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
              socket.emit("add user", {"adder":localStorage.getItem("username_id"), "adder_name": localStorage.getItem("display-name"), "channel_id": localStorage.getItem("last-channel-id"), "channel_name":localStorage.getItem("last-channel"), "user":userToRemove})
            };
          });

          document.querySelector("#messages-section").style.display = "none";
          document.querySelector("#send-message").style.display = "none";
       };

       request.send("");
     };

     //when the user click to see members in the chatroom
     document.querySelector("#member-list-btn").onclick = function(e)
     {
        this.classList.add("highlight");
        document.querySelector("#addUser-btn").classList.remove("highlight");
        document.querySelector('#channel-message-btn').classList.remove("highlight");

        e.preventDefault();
        let channel = localStorage.getItem("last-channel-id");
        let user = localStorage.getItem("display-name");
        let request = new XMLHttpRequest;

        request.open("GET", "/" +  channel + "/members/" + user)

        request.onload = function()
        {
          let response = (JSON.parse(request.responseText)).members;
          const post_template = Handlebars.compile(document.querySelector('#channel-members').innerHTML);
          const members = post_template({'members': response, "you":localStorage.getItem("display-name")});
          document.querySelector('#usernames-list').innerHTML = "";
          document.querySelector('#usernames-list').innerHTML += members;
          document.querySelector('#usernames-list').style.display = "block";

          //change title name
          document.title = "Flack | " + localStorage.getItem("last-channel") + " | Members";

          document.querySelector("#messages-section").style.display = "none";
          document.querySelector("#send-message").style.display = "none";
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

  //update links after adding or removing a user
  function updateAfterAddRemoveUser()
  {
    ALL_CHANNEL_LINKS = document.querySelectorAll(".channel-link");
     ALL_CHANNEL_LINKS.forEach(function(link){
        link.onclick =function(e){
          console.log(link);

          //prevent link from submitting
          e.preventDefault();
          //get the channel name
          let channel = link.innerHTML;

          //remember the channel
          localStorage.setItem("last-channel", channel);

          ///update the webpage by calling the channel page function
          let route = "channel/json/" + channel;
          channel_page(route, channel);

          // Push state to URL. and save it in the history
          document.title = "Flack | " + channel;
          history.pushState({"title":document.title, "channel":route}, document.title, "/channel/"+channel);
          update_links(this);

        }
      });

      //when the user return to the homepage
       document.querySelector(".Home").onclick = function (e){
        e.preventDefault();
        goHomePage();
      };
  }

  document.querySelector("#leave-chatroom-btn").onclick = function (e)
  {
    document.querySelector("#leave-message-warning").style.display = "block";
    e.preventDefault();

    //allow the user to confirm that they are leaving the group
    document.querySelector("#confirm-leave-group").onclick = function(e)
    {
      e.preventDefault();

      let username = localStorage.getItem("user_id");
      let channel = localStorage.getItem("last-channel-id");
      let channel_name = localStorage.getItem("last-channel");

      let request = new XMLHttpRequest();
      request.open("GET", "/leave_chatroom/" + username +"/" +channel);

      request.onload = function()
      {
        let response = JSON.parse(request.responseText);

        //when was sucessfull
        if(response.success)
        {
          ALL_CHANNEL_LINKS.forEach(function(link){

            if(link.innerHTML == channel_name)
            {
              link.remove();
              ALL_CHANNEL_LINKS = document.querySelectorAll(".channel-link")
              goHomePage();
            }
          })

          localStorage.removeItem("last-channel");
        }
        else
        {
          alert("sorry went wrong, sorry");
        }
        document.querySelector("#leave-message-warning").style.display = "none";
      }

      request.send();
    }
  }


  //refresh sned message button so it works properly when it is clicked
 function update_send_message_btn()
 {
   //update onclick
   document.querySelector("#btn-send-message").onclick = function()
   {
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
 }
  //alert a user when they had been added to a channel and add their channel to their navbar
  socket.on('broadcast added_user', data => {
    if(data.user == localStorage.getItem("display-name"))
    {
      add_channel_link(data.channel, false);

      //add the channel to the DOM (navbar) if the name has not been taken
      const post_template = Handlebars.compile(document.querySelector('#add-user-message').innerHTML);
      const message = post_template({'channel': data.channel, 'founder':data.adder});
      document.querySelector('body').innerHTML += message;
      updateAfterAddRemoveUser();

      //refresh send message button so it works properly when it is clicked
      update_send_message_btn()

    }
  });

   //broadcast the message to all the users.
   socket.on('broadcast message', data => {


     //display the message only if it is in the channel in which the message was sent
     if(data.channel == localStorage.getItem("last-channel-id"))
     //{
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
     //}

   });

   //alert a user when they had been added to a channel and add their channel to their navbar
   socket.on('broadcast remove_user', data => {
     if(data.user == localStorage.getItem("display-name"))
     {

       //add the channel to the DOM (navbar) if the name has not been taken
       const post_template = Handlebars.compile(document.querySelector('#remove-user-message').innerHTML);
       const message = post_template({'channel': data.channel, 'founder':data.founder});
       document.querySelector('body').innerHTML += message;

      ALL_CHANNEL_LINKS = document.querySelectorAll(".channel-link");
      ALL_CHANNEL_LINKS.forEach(function(link){
        if(link.innerHTML == data.channel)
        {
          link.remove();
        }

        if(localStorage.getItem("last-channel") == link.innerHTML)
        {
          //update the display of the webpage
          updatePage([document.querySelector("#navigation-bar"), ["for remove user", data.channel, data.founder]]);
          localStorage.removeItem("last-channel");
        }
      })

      updateAfterAddRemoveUser();
     }
     //refresh sned message button so it works properly when it is clicked
      update_send_message_btn()


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
         localStorage.setItem("last-channel-id", response.channel_id)
         let route = "channel/json/" +localStorage.getItem("last-channel");
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
     data.append("channel-name",channel);
     data.append("user_id", localStorage.getItem("user_id"));
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
    request.open('GET', '/home/'+localStorage.getItem("user_id"));

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
        let route = "channel/json/" + channel;
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

        if(localStorage.getItem("display-name") == null)
        {
          localStorage.setItem("display-name", localStorage.getItem("recovery-name"));
        }
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

        else if(data.signinSignupPage)
        {
          //display sign up form
          let toDisplay = [document.querySelector("#signup-div")]
          updatePage(toDisplay);
        }

        //when user return to homapage
        else{
          //update the display of the webpage
          updatePage([document.querySelector("#home-display"), document.querySelector("#navigation-bar")]);
          update_links();
      }
    };

    //when user click on messages link
    document.querySelector("#channel-message-btn").onclick = function (e){

      //only highlight the clicked link
      this.classList.add("highlight");
      document.querySelector("#addUser-btn").classList.remove("highlight");
      document.querySelector('#member-list-btn').classList.remove("highlight");

      //change title of the page
      document.title = "Flack | " + localStorage.getItem("last-channel") + " | messages";

      e.preventDefault();
      let channel = localStorage.getItem("last-channel");
      let displayName = localStorage.getItem("display-name");

      let route = "channel/json/" + localStorage.getItem("last-channel");
      channel_page(route, channel);

    }

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
       localStorage.setItem("last-channel-id", response.channel_id)

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
       //update the display of the channel section
       document.querySelector("#usernames-list").innerHTML = "";
       document.querySelector("#send-message").style.display = "";
       document.querySelector("#messages-section").style.display="";

       //only highlight the message link in the navbar of the channel
       document.querySelector("#channel-message-btn").classList.add("highlight");
       document.querySelector("#addUser-btn").classList.remove("highlight");
       document.querySelector("#member-list-btn").classList.remove("highlight");


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

  if(divs[divs.length-1][0] == "for remove user")
  {
    //alert the user that they have been remove
    const post_template = Handlebars.compile(document.querySelector('#remove-user-message').innerHTML);
    console.log(divs[divs.length-1][1]);
    divs[divs.length-1][2]

    const message = post_template({'channel': divs[divs.length-1][1], 'founder':divs[divs.length-1][2]});
    document.querySelector('body').innerHTML += message;

    // Push state to URL. and save it in the history
    document.title = "FLACK | Home"
    history.pushState({"title":document.title, }, document.title, "/");
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
      alert(id)
      request.open('GET', "/deleteMessage/" + id);

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
