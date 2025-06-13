import express from "express";
import Perfume from "../models/perfume.js"; // ✅ updated
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Order from "../models/order.js";
import auth from "../middlewares/auth.js";
import orderController from '../controllers/orderController';

const router = express.Router();

// ✅ Middleware to get current user from JWT
router.use(async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.locals.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate("cart.items.product"); // ✅ updated field

    res.locals.user = user || null;
    next();
  } catch (error) {
    console.error("JWT middleware error:", error);
    res.locals.user = null;
    return next();
  }
});

// ✅ Home route with pagination (perfumes instead of books)
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  const skip = (page - 1) * limit;

  const [perfumes, total] = await Promise.all([
    Perfume.find().skip(skip).limit(limit),
    Perfume.countDocuments(),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.render("index", {
    perfumes,           // ✅ updated variable name
    currentPage: page,
    totalPages,
  });
});

// ✅ User profile with perfume orders
router.get("/profile", auth(["user"]), async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product") // ✅ updated field
      .sort({ createdAt: -1 });

    res.render("profile", { user: req.user, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Server error");
  }
});

router.get("/user", async (req, res) => {
  res.redirect("/");
});

router.get("/about-us", async (req, res) => {
  res.render("about-us");
});

router.get("/contact-us", async (req, res) => {
  res.render("contact-us");
});

router.get("/admin", auth(["admin"]), async (req, res) => {
  res.render("admin", {
    users: await User.find(),
    perfumes: await Perfume.find(),
    orders: await Order.find().populate("user").sort({ createdAt: -1 }),
  });
});

router.get("/api/perfumes", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 8;
  const skip = (page - 1) * limit;

  try {
    const [perfumes, total] = await Promise.all([
      Perfume.find().skip(skip).limit(limit),
      Perfume.countDocuments(),
    ]);

    res.json({
      perfumes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching perfumes via API:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Checkout routes
router.get('/checkout', auth(["user"]), async (req, res) => {
  try {
    console.log('Accessing checkout page for user:', req.user._id);
    
    // Get user's cart
    const user = await User.findById(req.user._id).populate('cart.items.perfume');
    if (!user) {
      console.error('User not found during checkout');
      req.flash('error', 'User not found');
      return res.redirect('/cart');
    }

    // Get cart items
    const cart = user.cart;
    if (!cart || !cart.items || cart.items.length === 0) {
      console.log('Empty cart detected during checkout');
      req.flash('error', 'Your cart is empty');
      return res.redirect('/cart');
    }

    // Calculate totals
    const subtotal = cart.items.reduce((total, item) => {
      return total + (item.perfume.price * item.quantity);
    }, 0);
    const shipping = 10; // Fixed shipping cost
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    console.log('Checkout totals:', { subtotal, shipping, tax, total });

    res.render('checkout', {
      title: 'Checkout',
      user: req.user,
      cart: cart,
      subtotal,
      shipping,
      tax,
      total
    });
  } catch (error) {
    console.error('Error loading checkout page:', error);
    req.flash('error', 'An error occurred while loading the checkout page');
    res.redirect('/cart');
  }
});

// API endpoint to get cart items for checkout
router.get('/api/cart', auth(["user"]), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.items.perfume');
    if (!user || !user.cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const cartItems = user.cart.items.map(item => ({
      perfume: item.perfume._id,
      name: item.perfume.name,
      price: item.perfume.price,
      quantity: item.quantity,
      image: item.perfume.image
    }));

    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = 10.00;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    res.json({
      items: cartItems,
      subtotal,
      shipping,
      tax,
      total
    });
  } catch (error) {
    console.error('Error getting cart items:', error);
    res.status(500).json({ error: 'Failed to get cart items' });
  }
});

// Process checkout
router.post('/api/checkout', auth(["user"]), async (req, res) => {
  try {
    console.log('Processing checkout for user:', req.user._id);
    
    // Get user's cart
    const user = await User.findById(req.user._id).populate('cart.items.perfume');
    if (!user) {
      console.error('User not found during checkout process');
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate cart
    if (!user.cart || !user.cart.items || user.cart.items.length === 0) {
      console.log('Empty cart detected during checkout process');
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    // Validate required fields
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({ 
        error: 'Please fill in all required fields',
        missingFields 
      });
    }

    // Validate credit card details if credit card payment is selected
    if (req.body.paymentMethod === 'credit_card') {
      const creditCardFields = ['cardNumber', 'cardHolderName', 'expiryDate', 'cvv'];
      const missingCardFields = creditCardFields.filter(field => !req.body[field]);
      
      if (missingCardFields.length > 0) {
        console.log('Missing credit card fields:', missingCardFields);
        return res.status(400).json({ 
          error: 'Please provide all credit card details',
          missingFields: missingCardFields
        });
      }
    }

    // Calculate order totals
    const subtotal = user.cart.items.reduce((total, item) => {
      return total + (item.perfume.price * item.quantity);
    }, 0);
    const shipping = 10; // Fixed shipping cost
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    console.log('Order totals:', { subtotal, shipping, tax, total });

    // Create order
    const order = await orderController.createOrder({
      user: user._id,
      items: user.cart.items,
      shippingAddress: {
        fullName: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode
      },
      paymentMethod: req.body.paymentMethod,
      subtotal,
      shipping,
      tax,
      total
    });

    // Clear user's cart
    user.cart = { items: [] };
    await user.save();

    console.log('Order created successfully:', order._id);
    res.json({ 
      success: true, 
      orderId: order._id,
      message: 'Order placed successfully'
    });
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({ 
      error: 'An error occurred during checkout',
      details: error.message 
    });
  }
});

// Order success page
router.get('/order-success/:orderId', auth(["user"]), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.perfume');
    
    if (!order) {
      return res.redirect('/');
    }

    // Check if the order belongs to the current user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.redirect('/');
    }

    res.render('order-success', {
      title: 'Order Success',
      user: req.user,
      order
    });
  } catch (error) {
    console.error('Error loading order success page:', error);
    res.redirect('/');
  }
});

export default router;
