const express = require('express');
const hbs = require('express-handlebars');
const methodOverride = require('method-override');
const redis = require('redis');
const path = require('path');

let client = redis.createClient();

client.on('connect', function () {
    console.log('Connected to Redis..');
});

const PORT = 3000;

const app = express();

app.engine('handlebars', hbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.use(methodOverride('_method'));

//Home Search Page
app.get('/', function (req, res, next) {
    res.render('search');
});

//Post method for searching user by ID
app.post('/user/search', (req, res, next) => {
    let id = req.body.id;
    client.HGETALL(id, function (err, obj) {
        if (!obj) {
            res.render('search', {
                error: "User doesn't exist"
            });
        }
        else {
            obj.id = id;
            res.render('details', {
                user: obj
            });
        }
    });
});

//Renders add user page
app.get("/user/add", (req, res, next) => {
    res.render("adduser");
});

//Add new user
app.post("/user/add", (req, res, next) => {
    let username = req.body.userId;
    let name = req.body.name;
    let email = req.body.email;
    let phone = req.body.phone;
    client.EXISTS(username, (err, reply) => {
        // console.log("Inside POST add users")
        if (err)
            console.log(err);
        if (reply == 1) {//If already exists
            console.log(username, " already exists");
            res.render('adduser', {
                error: username + " Username already exists"
            })
        }
        else {//If doesn't exist, create new
            client.HMSET(username, {
                "name": name,
                "email": email,
                "phone": phone
            }, function (err, reply) {
                if (err)
                    console.log(err);
                console.log(username, "created, DB:", reply);
                res.redirect("/");
            })
        }
    })
});

//DELETE method
app.delete("/user/delete/:id", (req, res, next) => {
    // console.log("Deleted", req.params.id);
    client.DEL(req.params.id);
    res.redirect("/");
});

//GET user details
app.get("/user/update/:id", (req, res, next) => {
    // console.log("GET Update method for id:", req.params.id);
    let id = req.params.id;
    client.HGETALL(id, function (err, obj) {
        // console.log("display details for obj:", obj);
        if (!obj) {
            res.render('updateuser', {
                error: "User doesn't exist"
            });
        }
        else {
            obj.id = id;
            res.render('updateuser', {
                user: obj
            });
        }
    });
})

//UPDATE user details
app.put("/user/update/:id", (req, res, next) => {
    let username = req.params.id;
    let name = req.body.name;
    let email = req.body.email;
    let phone = req.body.phone;
    // console.log("PUT Update method", req.params.id);
    client.HMSET(username, {
        "name": name,
        "email": email,
        "phone": phone
    }, function (err, reply) {
        if (err)
            console.log(err);
        console.log(username, "updated", reply);
        res.render("details", {
            user: { id: username, name: name, email: email, phone: phone }
        });
    });
})

app.listen(PORT, function () {
    console.log("Listening on port " + PORT);
});