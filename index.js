const express = require("express");
const passport = require("passport");
const passportLocal = require("passport-local");
const session = require("express-session");
const ejsMate = require("ejs-mate");
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const bodyParser = require("body-parser");

const error = require("./utils/ExpressError");
const catchAsync = require("./utils/CatchAsync");

const User = require("./Schema/UserSchema");
const Post = require("./Schema/PostSchema");
const Booking = require("./Schema/Booking");

const validateBody = require("./middleware/validate");
const { registerSchema } = require("./JOI/user");
const { postSchema } = require("./JOI/post");
const { bookingSchema } = require("./JOI/booking");

const app = express();

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


if(process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

console.log("DB_URL from env:", process.env.url);

const url = process.env.url;
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connected");
  })
  .catch((e) => {
    console.error("Database connection error:", e);
  });
const sessionConfig = {
  secret: "thisshouldbeabettersecret!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Set locals for flash and current user
app.use((req, res, next) => {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.currentUser = req.user;
  next();
});

// Middleware to protect routes
function isLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be logged in to view this page");
    return res.redirect("/login");
  }
  next();
}

// ROUTES

app.get("/", (req, res) => {
  res.redirect("/home");
});

app.get("/home", (req, res) => {
  res.render("home.ejs");
});

app.get(
  "/available",
  isLoggedIn,
  catchAsync(async (req, res) => {
    res.send("You are at the home page");
  })
);

app.get("/register", (req, res) => {
  console.log("Flash errors available on render:", res.locals.error);
  res.render("register");
});


app.post(
  "/register",
  validateBody(registerSchema, "/register"),
  catchAsync(async (req, res, next) => {
    const { email, username, role } = req.body;
    const existingUser = await User.findOne({ email });
      if (existingUser) {
        req.flash("error", "Email is already registered Login avvu ra .");
      return res.redirect("/register");
      }
    const user = new User({ email, username, role });
    try {
      const registeredUser = await User.register(user, req.body.password);
      req.login(registeredUser, function (err) {
        if (err) return next(err);
        req.flash("success", "Welcome to Booking System!");
        return res.redirect("/home");
      });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/register");
    }
  })
);

app.get("/postARide", isLoggedIn, (req, res) => {
  if (req.user.role === "driver") {
    return res.render("postARide.ejs");
  }
  res.send("You are not authorized to access this page");
});

app.post(
  "/postARide",
  isLoggedIn,
  validateBody(postSchema, "/postARide"),
  catchAsync(async (req, res) => {
    const {
      driverPhone,
      vehicleNumber,
      vehicleType,
      departureTime,
      destination,
      availableSeats,
      fare,
    } = req.body;

    const post = new Post({
      driver: req.user._id,
      driverName: req.user.username,
      driverPhone,
      vehicleNumber,
      vehicleType,
      departureTime,
      destination,
      availableSeats,
      fare,
    });

    await post.save();
    res.redirect("/allPosts");
  })
);


app.get(
  "/allPosts",
  isLoggedIn,
  catchAsync(async (req, res) => {
    if (req.user.role !== "driver") {
      req.flash("error", "Only drivers can view this page");
      return res.redirect("/home");
    }
    const posts = await Post.find({ driver: req.user._id }).populate("driver");
    if (posts.length === 0) {
      req.flash("error", "You have not posted any rides yet");
      return res.redirect("/postARide");
    }
    const postIds = posts.map(post => post._id);
    const bookings = await Booking.find({ post: { $in: postIds } }).populate("user").populate("post");

    res.render("allPosts.ejs", { posts, bookings, currentUser: req.user });
  })
);


app.get(
  "/post/:id/edit",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id);
    res.render("editPost.ejs", { post });
  })
);

app.patch(
  "/post/:id",
  isLoggedIn,
  (req, res, next) => {
    validateBody(postSchema, `/post/${req.params.id}/edit`)(req, res, next);
  },
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const {
      driverName,
      driverPhone,
      vehicleNumber,
      vehicleType,
      departureTime,
      destination,
      availableSeats,
      fare,
    } = req.body;

    await Post.findByIdAndUpdate(
      id,
      {
        driverName,
        driverPhone,
        vehicleNumber,
        vehicleType,
        departureTime,
        destination,
        availableSeats,
        fare,
      },
      { new: true }
    );

    res.redirect("/allPosts");
  })
);

app.delete(
  "/post/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    res.redirect("/allPosts");
  })
);


app.get(
  "/bookARide",
  isLoggedIn,
  catchAsync(async (req, res) => {
    if (req.user.role === "user") {
      const allPosts = await Post.find({}).populate("driver");

      const availablePosts = allPosts.filter(post => post.availableSeats > 0);

      if (availablePosts.length === 0) {
        req.flash("error", "No rides available at the moment");
        return res.redirect("/home");
      }

      return res.render("bookARide.ejs", { posts: availablePosts });
    }
    res.send("Login as user to book a ride");
  })
);




app.get("/book/:id", isLoggedIn, async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    
    if (!post) {
      req.flash("error", "Ride not found");
      return res.redirect("/bookARide");
    }

    res.render("confirmBooking.ejs", { post });
  } catch (err) {
    next(err); 
  }
});


app.post(
  "/confirm/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const postId = req.params.id;
    const seats = parseInt(req.body.seats);
    const post = await Post.findById(postId);
    if (!post) {
      req.flash("error", "Ride not found");
      return res.redirect("/bookARide");
    }
    if (post.availableSeats < seats) {
      req.flash("error", "Not enough seats available");
      return res.redirect("/bookARide");
    }
    post.availableSeats -= seats;
    await post.save();
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // e.g., 4-digit


    const booking = new Booking({
      user: req.user._id,
      post: post._id,
      seatsBooked: seats,
      otp: otp,
    });
    await booking.save();


    req.flash("success", "Ride booked successfully. Your OTP is visible in My Bookings.");
    res.redirect("/mybookings");
  })
);

app.get(
  "/mybookings",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const bookings = await (await Booking.find({ user: req.user._id }).populate("post"))
    if (bookings.length === 0) {
      req.flash("info", "You have no bookings");
      return res.redirect("/available");
    }
    res.render("myBookings.ejs", { bookings });
  })
);

app.get("/login", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.render("login.ejs");
  }
  res.send("You are already logged in");
});




app.post("/login", async (req, res, next) => {
  const { username, password, role } = req.body;

  try {
    // Step 1: Find user with given username and role
    const user = await User.findOne({ username, role });

    if (!user) {
      req.flash("error", "No user found with this username and role.");
      return res.redirect("/login");
    }

    // Step 2: Authenticate password manually
    user.authenticate(password, (err, authenticatedUser, passwordErr) => {
      if (err || passwordErr) {
        req.flash("error", "Invalid password.");
        return res.redirect("/login");
      }

      // Step 3: If password is correct, log the user in
      req.login(authenticatedUser, (err) => {
        if (err) return next(err);
        req.flash("success", "Welcome back!");
        const redirectUrl = req.session.returnTo || "/home";
        delete req.session.returnTo;
        return res.redirect(redirectUrl);
      });
    });
  } catch (err) {
    return next(err);
  }
});







app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.flash("success", "Goodbye!");
    res.redirect("/home");
  });
});

app.get(
  "/del",
  isLoggedIn,
  catchAsync(async (req, res, next) => {
    try {
      const id = req.user._id;
      await User.findByIdAndDelete(id);

      req.logout(function (err) {
        if (err) return next(err);
        req.flash("success", "User deleted successfully");
        res.redirect("/home");
      });
    } catch (err) {
      req.flash("error", "Error deleting user");
      res.redirect("/available");
    }
  })
);

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).render("error", { error: err.message });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
