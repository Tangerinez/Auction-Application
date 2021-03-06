const mysql = require("mysql");
const inquirer = require("inquirer");

const connection = mysql.createConnection({
  host: "localhost",

  // Your port;
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "yourRootPassword",
  database: "auctioned_items_db"
});

connection.connect(function(err) {
  if (err) throw err;
  initialize();
});

function initialize() {
  inquirer
    .prompt([
      {
        type: "list'",
        name: "choice",
        message: "Post or Bid on an item?",
        choices: ["Post an item", "Bid on an item"]
      }
    ])
    .then(function(response) {
      console.log(
        `------------- ${response.choice.toUpperCase()} -------------`
      );
      if (response.choices === "Post an item") {
        postItem();
      } else {
        displayItems(); // have to create function for this
      }
    });
}

function postItem() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "itemName",
        message: "What item do you want to post?"
      },
      {
        type: "input",
        name: "itemDescription",
        message: "Please write some details about your item?"
      },
      {
        type: "input",
        name: "itemBid",
        message: "Please set the starting bid:",
        validateInput: function(val) {
          if (!isNaN(val)) {
            // if the user input is a number
            return true;
          } else {
            return "Please input a number";
          }
        }
      }
    ])
    .then(function(response) {
      let itemInfo = [];
      itemInfo.push(response.itemName);
      itemInfo.push(response.itemDescription);
      itemInfo.push(response.itemBid);
      addDB(itemInfo);
    });
}

function addDB(itemInfo) {
  // function to add items into MySQL
  connection.query(
    "insert into items set ?",
    {
      item: itemInfo[0],
      description: itemInfo[1],
      starting_bid: itemInfo[2],
      highest_bid: itemInfo[2]
    },
    function(err) {
      if (err) throw err;

      console.log(
        `You posted ${itemInfo[0]} for $${itemInfo[2]} dollars successfully!`
      );

      initialize();
    }
  );
}

function displayItems() {
  let auctionedItems = [];

  connection.query("select * from items", function(err, res) {
    if (err) throw err;
    for (var i = 0; i < res.length; i++) {
      const thisItem = res[i];
      auctionedItems.push(res[i].id.toString());
      console.log(
        "Item Number: " +
          thisItem.id +
          "\nItem: " +
          thisItem.item +
          "\nDescription: " +
          thisItem.description +
          "\nStarting Bid $" +
          thisItem.starting_bid +
          "\n----------------------------------------"
      );
    }
    bid(auctionedItems);
  });
}

function bid(itemsArr) {
  inquirer
    .prompt([
      {
        type: "list",
        name: "choice",
        message: "Which item number would you like to bid on?",
        choices: itemsArr
      },
      {
        type: "input",
        name: "bid",
        message: "How much would you like to bid?"
      }
    ])
    .then(function(response) {
      let bid = [];
      bid.push(response.bid);
      bid.push(response.choice);

      checkBid(bid);
    });
}

function updateBid(bid) {
  console.log(`Congrats! You are now the highest bidder at ${bid[0]}!`);
  connection.query("update items set ? where ?", [
    {
      highest_bid: bid[0]
    },
    {
      id: bid[1]
    }
  ]);
  initialize();
}

function checkBid(bid) {
  let highestBid;

  connection.query("select * from items where id=(?)", [bid[1]], function(
    err,
    res
  ) {
    highestBid = res[0].highest_bid;

    if (bid[0] > highestBid) {
      updateBid(bid);
    } else {
      console.log(`Sorry, your bid was too low. Please try again!`);
      initialize();
    }
  });
}
