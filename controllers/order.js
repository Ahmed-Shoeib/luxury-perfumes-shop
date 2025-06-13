import Order from "../models/order.js";
import PerfumeProduct from "../models/perfume.js";

export const createOrder = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    await user.populate("cart.items.product");
    const cartItems = user.cart.items;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const orderItems = cartItems.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
    }));

    const totalAmount = user.cart.totalPrice;

    // Check stock for each perfume product
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${item.product.name}`,
        });
      }
    }

    // Deduct stock
    for (const item of cartItems) {
      await PerfumeProduct.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    // Create order
    const order = await Order.create({
      user: user._id,
      items: orderItems,
      totalAmount,
      status: "pending",
    });

    // Clear user's cart
    user.cart.items = [];
    user.cart.totalPrice = 0;
    await user.save();

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOrders = async (req, res) => {
  const orders = await Order.find()
    .populate("user")
    .populate("items.product");
  res.json(orders);
};

export const getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user")
    .populate("items.product");
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
};

export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending", "shipped", "delivered"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
};

export const deleteOrder = async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ message: "Order deleted" });
};
