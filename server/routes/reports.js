import express from "express";
import { authMiddleware } from "../middlewares/Authentication.js";
import { requireAdminOrSubAdmin, requireRole } from "../middlewares/Authorization.js";
import SalesReport from "../models/SalesReport.js";
import Order from "../models/Order.js";
import User from "../models/user.js";

const router = express.Router();

// Helper function to generate daily report
const generateDailyReport = async (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const orders = await Order.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  }).populate("userId", "name email").populate("deliveryBoyId", "name");

  // Calculate metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const ordersDelivered = orders.filter((o) => o.status === "Delivered").length;
  const ordersFailed = orders.filter((o) => o.status === "Failed Delivery").length;
  const ordersShipped = orders.filter((o) => o.status === "Shipped" || o.status === "Out for Delivery").length;
  const ordersPending = orders.filter((o) => o.status === "Pending").length;

  // Delivery boy performance
  const deliveryBoyMap = {};
  orders.forEach((order) => {
    if (order.deliveryBoyId) {
      const dbId = order.deliveryBoyId._id.toString();
      if (!deliveryBoyMap[dbId]) {
        deliveryBoyMap[dbId] = {
          deliveryBoyId: order.deliveryBoyId._id,
          deliveryBoyName: order.deliveryBoyId.name,
          ordersAssigned: 0,
          ordersDelivered: 0,
          ordersFailed: 0,
          revenue: 0,
        };
      }
      deliveryBoyMap[dbId].ordersAssigned++;
      if (order.status === "Delivered") {
        deliveryBoyMap[dbId].ordersDelivered++;
      }
      if (order.status === "Failed Delivery") {
        deliveryBoyMap[dbId].ordersFailed++;
      }
      if (order.status === "Delivered" || order.status === "Completed") {
        deliveryBoyMap[dbId].revenue += order.totalPrice || 0;
      }
    }
  });

  const deliveryBoySales = Object.values(deliveryBoyMap).map((db) => ({
    ...db,
    successRate:
      db.ordersAssigned > 0
        ? Math.round((db.ordersDelivered / db.ordersAssigned) * 100)
        : 0,
  }));

  const report = {
    period: "daily",
    reportDate: date,
    totalOrders,
    totalRevenue,
    ordersDelivered,
    ordersPending,
    ordersFailed,
    ordersShipped,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    successRate: totalOrders > 0 ? Math.round((ordersDelivered / totalOrders) * 100) : 0,
    deliveryBoySales,
    newCustomers: orders.length, // This is simplified; you may want to check user.createdAt
  };

  return report;
};

// ✅ Get daily sales report (Admin & Sub-Admin)
router.get("/daily", authMiddleware, requireAdminOrSubAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();

    // Check if report exists in DB
    const existingReport = await SalesReport.findOne({
      period: "daily",
      reportDate: {
        $gte: new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate()),
        $lt: new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate() + 1),
      },
    });

    if (existingReport) {
      return res.json(existingReport);
    }

    // Generate report
    const report = await generateDailyReport(reportDate);

    // Save to DB
    const newReport = new SalesReport(report);
    await newReport.save();

    res.json(newReport);
  } catch (error) {
    res.status(500).json({ msg: "Error generating daily report", error: error.message });
  }
});

// ✅ Get weekly sales report
router.get("/weekly", authMiddleware, requireAdminOrSubAdmin, async (req, res) => {
  try {
    const { week, year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentWeek = week ? parseInt(week) : getWeekNumber(new Date());

    const startDate = getDateFromWeek(currentYear, currentWeek);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).populate("deliveryBoyId", "name");

    // Calculate metrics (similar to daily)
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const ordersDelivered = orders.filter((o) => o.status === "Delivered").length;
    const ordersFailed = orders.filter((o) => o.status === "Failed Delivery").length;

    const report = {
      period: "weekly",
      reportDate: startDate,
      totalOrders,
      totalRevenue,
      ordersDelivered,
      ordersFailed,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      successRate: totalOrders > 0 ? Math.round((ordersDelivered / totalOrders) * 100) : 0,
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ msg: "Error generating weekly report", error: error.message });
  }
});

// ✅ Get monthly sales report
router.get("/monthly", authMiddleware, requireAdminOrSubAdmin, async (req, res) => {
  try {
    const { month, year } = req.query;
    const date = new Date();
    if (month) date.setMonth(parseInt(month) - 1);
    if (year) date.setFullYear(parseInt(year));

    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).populate("deliveryBoyId", "name");

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const ordersDelivered = orders.filter((o) => o.status === "Delivered").length;
    const ordersFailed = orders.filter((o) => o.status === "Failed Delivery").length;

    const report = {
      period: "monthly",
      reportDate: startDate,
      totalOrders,
      totalRevenue,
      ordersDelivered,
      ordersFailed,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      successRate: totalOrders > 0 ? Math.round((ordersDelivered / totalOrders) * 100) : 0,
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ msg: "Error generating monthly report", error: error.message });
  }
});

// ✅ Get delivery boy performance (Admin & Sub-Admin)
router.get("/delivery-boy/:deliveryBoyId", authMiddleware, requireAdminOrSubAdmin, async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { deliveryBoyId };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const orders = await Order.find(query);
    const deliveryBoy = await User.findById(deliveryBoyId);

    const totalAssigned = orders.length;
    const totalDelivered = orders.filter((o) => o.status === "Delivered").length;
    const totalFailed = orders.filter((o) => o.status === "Failed Delivery").length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    const report = {
      deliveryBoyId,
      deliveryBoyName: deliveryBoy?.name || "Unknown",
      totalAssigned,
      totalDelivered,
      totalFailed,
      totalRevenue,
      successRate: totalAssigned > 0 ? Math.round((totalDelivered / totalAssigned) * 100) : 0,
      averageOrderValue: totalAssigned > 0 ? totalRevenue / totalAssigned : 0,
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ msg: "Error generating delivery boy report", error: error.message });
  }
});

// ✅ Get summary report (Admin & Sub-Admin)
router.get("/summary", authMiddleware, requireAdminOrSubAdmin, async (req, res) => {
  try {
    // Get stats from all time
    const allOrders = await Order.find()
      .populate("deliveryBoyId", "name")
      .populate("userId", "email createdAt");

    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const ordersDelivered = allOrders.filter((o) => o.status === "Delivered").length;
    const ordersFailed = allOrders.filter((o) => o.status === "Failed Delivery").length;
    const ordersPending = allOrders.filter((o) => o.status === "Pending").length;

    // Delivery boy stats
    const deliveryBoyStats = {};
    allOrders.forEach((order) => {
      if (order.deliveryBoyId) {
        const dbId = order.deliveryBoyId._id.toString();
        if (!deliveryBoyStats[dbId]) {
          deliveryBoyStats[dbId] = {
            name: order.deliveryBoyId.name,
            orders: 0,
            delivered: 0,
          };
        }
        deliveryBoyStats[dbId].orders++;
        if (order.status === "Delivered") {
          deliveryBoyStats[dbId].delivered++;
        }
      }
    });

    const summary = {
      totalOrders,
      totalRevenue,
      ordersDelivered,
      ordersFailed,
      ordersPending,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      successRate: totalOrders > 0 ? Math.round((ordersDelivered / totalOrders) * 100) : 0,
      deliveryBoyStats: Object.values(deliveryBoyStats),
      totalCustomers: new Set(allOrders.map((o) => o.userId?._id?.toString())).size,
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ msg: "Error generating summary", error: error.message });
  }
});

// Helper functions
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function getDateFromWeek(year, week) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
}

export default router;
