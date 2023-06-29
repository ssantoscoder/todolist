//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//-------------------------- Conection a DB ---------------------------
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true});

//-------------------------- Make Items ---------------------------
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

//------------------------ Items Default -------------------------
const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listShema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listShema);


app.get("/", function(req, res) {

  //-------------------------- Find Data ----------------------------------
  Item.find( {} ).then( (items) => {
    if (items.length === 0){
      //-------------------------- Intert data a DB ---------------------------
      Item.insertMany(defaultItems).then(function(){
        console.log("Successfully added to the database! :)")  // Success
      }).catch(function(error){
        console.log(error)      // Failure
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: items});
    }
    //mongoose.connection.close();
  })
  .catch( (err) => {
    console.log(err);
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne( {name: listName} ).then( (foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
    .catch( (err) => {
      console.log(err);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId).then(function(){
      console.log("Successfully delete the document! :)")  // Success
      res.redirect("/");
    }).catch(function(error){
      console.log(error)      // Failure
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function(){
      res.redirect("/" + listName);
    }).catch(function(error){
      console.log(error)      // Failure
    });
  }
  
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne( {name: customListName} ).then( (foundList) => {
    if (!foundList){
      //Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save();
      res.redirect("/" + customListName);
    } else {
      //Show an existing list

      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  })
  .catch( (err) => {
    console.log(err);
  });


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
