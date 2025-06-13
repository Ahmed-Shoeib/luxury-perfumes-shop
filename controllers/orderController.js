const Order = require('../models/order');
const User = require('../models/user');
const Perfume = require('../models/perfume');

// Get cart items for checkout
exports.getCartItems = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.items.perfume');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cartItems = user.cart.items.map(item => ({
      perfume: item.perfume._id,
      name: item.perfume.name,
      price: item.perfume.price,
      quantity: item.quantity
    }));

    res.json({ items: cartItems });
  } catch (error) {
    console.error('Error getting cart items:', error);
    res.status(500).json({ error: 'Failed to get cart items' });
  }
};

// Process checkout and create order
exports.processCheckout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.items.perfume');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total amount
    const subtotal = user.cart.items.reduce((total, item) => {
      return total + (item.perfume.price * item.quantity);
    }, 0);
    const shipping = 10.00; // Fixed shipping cost
    const tax = subtotal * 0.1; // 10% tax
    const totalAmount = subtotal + shipping + tax;

    // Create order items array
    const orderItems = user.cart.items.map(item => ({
      perfume: item.perfume._id,
      quantity: item.quantity,
      price: item.perfume.price
    }));

    // Create new order
    const order = new Order({
      user: user._id,
      items: orderItems,
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
      paymentDetails: req.body.paymentMethod === 'credit_card' ? {
        cardNumber: req.body.cardNumber,
        cardHolderName: req.body.cardHolderName,
        expiryDate: req.body.expiryDate,
        cvv: req.body.cvv
      } : undefined,
      totalAmount
    });

    // Save order
    await order.save();

    // Clear user's cart
    user.cart.items = [];
    await user.save();

    res.status(201).json({
      message: 'Order placed successfully',
      orderId: order._id
    });
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({ error: 'Failed to process checkout' });
  }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'name email')
      .populate('items.perfume');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if the order belongs to the current user
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error getting order details:', error);
    res.status(500).json({ error: 'Failed to get order details' });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.perfume')
      .sort({ orderDate: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({ error: 'Failed to get user orders' });
  }
};

// Show checkout page
exports.getCheckoutPage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.items.perfume');
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/cart');
    }
    const cart = user.cart;
    if (!cart || !cart.items || cart.items.length === 0) {
      req.flash('error', 'Your cart is empty');
      return res.redirect('/cart');
    }
    const subtotal = cart.items.reduce((total, item) => total + (item.perfume.price * item.quantity), 0);
    const shipping = 10;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;
    res.render('checkout', {
      title: 'Checkout',
      user: req.user,
      cart,
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
};

// Handle checkout form submission and create order
exports.handleCheckout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.items.perfume');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.cart || !user.cart.items || user.cart.items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: 'Please fill in all required fields', missingFields });
    }
    if (req.body.paymentMethod === 'credit_card') {
      const creditCardFields = ['cardNumber', 'cardHolderName', 'expiryDate', 'cvv'];
      const missingCardFields = creditCardFields.filter(field => !req.body[field]);
      if (missingCardFields.length > 0) {
        return res.status(400).json({ error: 'Please provide all credit card details', missingFields: missingCardFields });
      }
    }
    const subtotal = user.cart.items.reduce((total, item) => total + (item.perfume.price * item.quantity), 0);
    const shipping = 10;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;
    const orderItems = user.cart.items.map(item => ({
      perfume: item.perfume._id,
      quantity: item.quantity,
      price: item.perfume.price
    }));
    const order = new Order({
      user: user._id,
      items: orderItems,
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
      paymentDetails: req.body.paymentMethod === 'credit_card' ? {
        cardNumber: req.body.cardNumber,
        cardHolderName: req.body.cardHolderName,
        expiryDate: req.body.expiryDate,
        cvv: req.body.cvv
      } : undefined,
      subtotal,
      shipping,
      tax,
      total
    });
    await order.save();
    user.cart.items = [];
    await user.save();
    res.status(201).json({ success: true, orderId: order._id, message: 'Order placed successfully' });
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({ error: 'An error occurred during checkout', details: error.message });
  }
}; 